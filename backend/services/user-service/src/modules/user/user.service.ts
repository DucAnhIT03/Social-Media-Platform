import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventBusService } from '../../shared/events/event-bus.service';
import { AuthServiceClient } from '../../shared/clients/auth-service.client';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRepository } from './user.repository';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly eventBus: EventBusService,
    private readonly authClient: AuthServiceClient,
  ) {}

  // Auth proxy: FE có thể gọi user-service để đăng ký/đăng nhập, user-service sẽ gọi auth-service.
  register(dto: RegisterUserDto) {
    return this.authClient.register(dto as any);
  }

  login(dto: LoginUserDto) {
    return this.authClient.login(dto as any);
  }

  async getProfileById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(currentUserId: string, dto: UpdateProfileDto) {
    try {
      const updated = await this.repo.updateById(currentUserId, {
        username: dto.username,
        avatar: dto.avatar ?? undefined,
        bio: dto.bio ?? undefined,
      });

      this.eventBus.publish('user.profile.updated', {
        userId: currentUserId,
        fields: Object.keys(dto),
      });
      return updated;
    } catch (e) {
      // unique constraint: username/email
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Username already exists');
      }
      throw e;
    }
  }

  async follow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const target = await this.repo.findById(targetUserId);
    if (!target) throw new NotFoundException('Target user not found');

    try {
      await this.repo.createFollow(currentUserId, targetUserId);
    } catch (e) {
      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        e.code !== 'P2002'
      ) {
        throw e;
      }
      // Nếu đã follow trước đó thì bỏ qua lỗi, nhưng vẫn cho phép gửi lại notification
    }

    // Lưu notification lời mời kết bạn (mỗi lần bấm Kết bạn sẽ tạo một notification mới)
    const notification = await this.repo.createFriendRequestNotification(
      targetUserId,
      currentUserId,
    );

    // Sự kiện domain cho các service khác (analytics, v.v.)
    this.eventBus.publish('user.followed', {
      followerId: currentUserId,
      followingId: targetUserId,
    });

    // Gửi notification realtime tới người được kết bạn
    this.eventBus.publish('notification.created', {
      userId: targetUserId,
      type: 'friend_request',
      fromUserId: currentUserId,
      notificationId: notification.id,
      createdAt: notification.createdAt,
    });
    return { success: true };
  }

  async unfollow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot unfollow yourself');
    }

    await this.repo.deleteFollow(currentUserId, targetUserId);
    this.eventBus.publish('user.unfollowed', {
      followerId: currentUserId,
      followingId: targetUserId,
    });
    return { success: true };
  }

  async listFollowers(userId: string, q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listFollowers(userId, skip, limit);
    return {
      page,
      limit,
      total,
      items: items.map((i) => ({
        createdAt: i.createdAt,
        user: i.follower,
      })),
    };
  }

  async listFollowing(userId: string, q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listFollowing(userId, skip, limit);
    return {
      page,
      limit,
      total,
      items: items.map((i) => ({
        createdAt: i.createdAt,
        user: i.following,
      })),
    };
  }

  async listFriends(currentUserId: string, q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listFriends(currentUserId, skip, limit);

    return {
      page,
      limit,
      total,
      items: items.map((u) => ({
        createdAt: u.createdAt,
        user: {
          id: u.id,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          isOnline: u.isOnline,
        },
      })),
    };
  }

  async search(username: string, q: PaginationQueryDto) {
    const normalized = username.trim();
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.searchByUsername(
      normalized,
      skip,
      limit,
    );

    // Ưu tiên exact match trước, sau đó đến số lượng từ khớp
    const lowerQuery = normalized.toLowerCase();
    const terms = lowerQuery
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const scored = items
      .map((u) => {
        const name = u.username.toLowerCase();
        let score = 0;
        if (name === lowerQuery) score += 100;
        if (name.includes(lowerQuery)) score += 50;
        for (const term of terms) {
          if (name.includes(term)) score += 10;
        }
        return { user: u, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.user);

    return { page, limit, total, items: scored };
  }

  async recommend(currentUserId: string, q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.recommendForUser(
      currentUserId,
      skip,
      limit,
    );

    return { page, limit, total, items };
  }

  async listFriendRequests(currentUserId: string, q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listFriendRequests(
      currentUserId,
      skip,
      limit,
    );

    return {
      page,
      limit,
      total,
      items: items.map((i) => ({
        id: i.id,
        isRead: i.isRead,
        createdAt: i.createdAt,
        fromUser: i.fromUser,
      })),
    };
  }

  async listFollowingIds(currentUserId: string) {
    return this.repo.listFollowingIds(currentUserId);
  }

  async acceptFriendRequest(currentUserId: string, notificationId: string) {
    const request = await this.repo.findFriendRequestByIdForUser(
      currentUserId,
      notificationId,
    );
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Đảm bảo sau khi chấp nhận thì luôn có 2 chiều follow (bạn bè)
    try {
      // Người hiện tại follow người đã gửi lời mời
      await this.repo.createFollow(currentUserId, request.fromUserId);
    } catch (e) {
      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        e.code !== 'P2002'
      ) {
        throw e;
      }
      // Nếu đã tồn tại thì bỏ qua
    }

    try {
      // Người gửi lời mời cũng follow lại người hiện tại
      await this.repo.createFollow(request.fromUserId, currentUserId);
    } catch (e) {
      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        e.code !== 'P2002'
      ) {
        throw e;
      }
      // Nếu đã tồn tại thì bỏ qua
    }

    await this.repo.markFriendRequestAsRead(notificationId);
    return { success: true };
  }

  async rejectFriendRequest(currentUserId: string, notificationId: string) {
    const request = await this.repo.findFriendRequestByIdForUser(
      currentUserId,
      notificationId,
    );
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    await this.repo.markFriendRequestAsRead(notificationId);
    return { success: true };
  }
}

