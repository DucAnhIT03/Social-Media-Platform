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
      this.eventBus.publish('user.followed', {
        followerId: currentUserId,
        followingId: targetUserId,
      });
      return { success: true };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // đã follow trước đó
        return { success: true };
      }
      throw e;
    }
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

  async search(username: string, q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.searchByUsername(
      username,
      skip,
      limit,
    );
    return { page, limit, total, items };
  }
}

