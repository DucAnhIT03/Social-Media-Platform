import {
  BadRequestException,
  Injectable,
  Logger,
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
import { CreatePostDto } from './dto/create-post.dto';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly repo: UserRepository,
    private readonly eventBus: EventBusService,
    private readonly authClient: AuthServiceClient,
    private readonly cloudinaryService: CloudinaryService,
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

    const currentUser = await this.repo.findById(currentUserId);
    if (!currentUser) {
      throw new BadRequestException('Current user not found');
    }

    const target = await this.repo.findById(targetUserId);
    if (!target) throw new NotFoundException('Target user not found');

    try {
      await this.repo.createFollow(currentUserId, targetUserId);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException('Invalid follow relation');
      }

      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        e.code !== 'P2002'
      ) {
        throw e;
      }
      // Nếu đã follow trước đó thì bỏ qua lỗi, nhưng vẫn cho phép gửi lại notification
    }

    // Lưu notification lời mời kết bạn (mỗi lần bấm Kết bạn sẽ tạo một notification mới)
    let notification: { id: string; createdAt: Date } | null = null;
    try {
      notification = await this.repo.createFriendRequestNotification(
        targetUserId,
        currentUserId,
      );
    } catch (e) {
      this.logger.warn(
        `Cannot create friend-request notification for ${currentUserId} -> ${targetUserId}: ${(e as Error).message}`,
      );
    }

    // Sự kiện domain cho các service khác (analytics, v.v.)
    this.eventBus.publish('user.followed', {
      followerId: currentUserId,
      followingId: targetUserId,
    });

    // Gửi notification realtime tới người được kết bạn
    if (notification) {
      this.eventBus.publish('notification.created', {
        userId: targetUserId,
        type: 'friend_request',
        fromUserId: currentUserId,
        notificationId: notification.id,
        createdAt: notification.createdAt,
      });
    }

    return { success: true };
  }

  async unfollow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot unfollow yourself');
    }

    await this.repo.deleteFollow(currentUserId, targetUserId);
    // Khi huy loi moi ket ban, xoa cac notification loi moi chua doc ben phia doi phuong.
    await this.repo.clearPendingFriendRequests(targetUserId, currentUserId);
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

  async uploadPostMedia(currentUserId: string, file: any, type?: string) {
    const user = await this.repo.findById(currentUserId);
    if (!user) {
      throw new NotFoundException('Current user not found');
    }

    const uploadType = type?.trim().toLowerCase() || 'image';
    if (uploadType !== 'image' && uploadType !== 'video') {
      throw new BadRequestException('Upload type must be image or video');
    }

    const mimeType = String(file?.mimetype || '').toLowerCase();
    if (!mimeType) {
      throw new BadRequestException('Invalid file type');
    }

    if (uploadType === 'image' && !mimeType.startsWith('image/')) {
      throw new BadRequestException('Expected an image file');
    }

    if (uploadType === 'video' && !mimeType.startsWith('video/')) {
      throw new BadRequestException('Expected a video file');
    }

    const uploaded = await this.cloudinaryService.uploadBuffer(file, uploadType);

    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      resourceType: uploaded.resource_type,
      format: uploaded.format,
      bytes: uploaded.bytes,
      duration: uploaded.duration ?? null,
    };
  }

  async createPost(currentUserId: string, dto: CreatePostDto) {
    const content = String(dto.content ?? '').trim();
    if (!content) {
      throw new BadRequestException('Post content is required');
    }

    const postType = dto.postType === 'SHORT_VIDEO' ? 'SHORT_VIDEO' : 'POST';
    const shortVideoUrl = dto.shortVideoUrl?.trim() || null;

    if (postType === 'SHORT_VIDEO' && !shortVideoUrl) {
      throw new BadRequestException('Short video URL is required for short video posts');
    }

    const user = await this.repo.findById(currentUserId);
    if (!user) {
      throw new NotFoundException('Current user not found');
    }

    const created = await this.repo.createPost(
      currentUserId,
      content,
      dto.imageUrl?.trim() || null,
      postType,
      shortVideoUrl,
    );

    if (!created) {
      throw new BadRequestException('Cannot create post');
    }

    this.eventBus.publish('post.created', {
      postId: created.id,
      authorId: currentUserId,
      createdAt: created.createdAt,
    });

    return {
      id: created.id,
      content: created.content,
      imageUrl: created.imageUrl,
      postType: created.postType,
      shortVideoUrl: created.shortVideoUrl,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      author: {
        id: created.authorId,
        username: created.authorUsername,
        avatar: created.authorAvatar,
        bio: created.authorBio,
        isOnline: Boolean(created.authorIsOnline),
      },
    };
  }

  async listFeedPosts(q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listFeedPosts(skip, limit);

    return {
      page,
      limit,
      total,
      items: items.map((item) => ({
        id: item.id,
        content: item.content,
        imageUrl: item.imageUrl,
        postType: item.postType,
        shortVideoUrl: item.shortVideoUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        author: {
          id: item.authorId,
          username: item.authorUsername,
          avatar: item.authorAvatar,
          bio: item.authorBio,
          isOnline: Boolean(item.authorIsOnline),
        },
      })),
    };
  }

  async listShortVideos(q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listShortVideos(skip, limit);

    return {
      page,
      limit,
      total,
      items: items.map((item) => ({
        id: item.id,
        content: item.content,
        imageUrl: item.imageUrl,
        postType: item.postType,
        shortVideoUrl: item.shortVideoUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        author: {
          id: item.authorId,
          username: item.authorUsername,
          avatar: item.authorAvatar,
          bio: item.authorBio,
          isOnline: Boolean(item.authorIsOnline),
        },
      })),
    };
  }
}

