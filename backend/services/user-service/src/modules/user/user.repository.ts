import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../libs/database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  updateById(id: string, data: { username?: string; avatar?: string | null; bio?: string | null }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async searchByUsername(username: string, skip: number, take: number) {
    const terms = username
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const where =
      terms.length > 0
        ? {
            OR: terms.map((term) => ({
              username: { contains: term },
            })),
          }
        : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { username: 'asc' },
        skip,
        take,
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isOnline: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    return { items, total };
  }

  async createFriendRequestNotification(targetUserId: string, fromUserId: string) {
    const prisma = this.prisma as any;
    return prisma.notification.create({
      data: {
        userId: targetUserId,
        fromUserId,
        type: 'FRIEND_REQUEST',
      },
    });
  }

  async listFriendRequests(userId: string, skip: number, take: number) {
    const [items, total] = await Promise.all([
      (this.prisma as any).notification.findMany({
        where: {
          userId,
          type: 'FRIEND_REQUEST',
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          isRead: true,
          createdAt: true,
          fromUser: {
            select: {
              id: true,
              username: true,
              avatar: true,
              bio: true,
              isOnline: true,
            },
          },
        },
      }),
      (this.prisma as any).notification.count({
        where: {
          userId,
          type: 'FRIEND_REQUEST',
          isRead: false,
        },
      }),
    ]);

    return { items, total };
  }

  async findFriendRequestByIdForUser(userId: string, notificationId: string) {
    return (this.prisma as any).notification.findFirst({
      where: {
        id: notificationId,
        userId,
        type: 'FRIEND_REQUEST',
      },
      select: {
        id: true,
        isRead: true,
        createdAt: true,
        fromUserId: true,
      },
    });
  }

  async markFriendRequestAsRead(notificationId: string) {
    return (this.prisma as any).notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async recommendForUser(userId: string, skip: number, take: number) {
    // Lấy danh sách người mà current user đang follow (bạn bè trực tiếp)
    const directFollowing = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const friendIds = directFollowing.map((f) => f.followingId);

    if (friendIds.length === 0) {
      return { items: [], total: 0 };
    }

    const baseWhere = {
      id: { not: userId },
      // Chưa được current user follow
      followers: {
        none: {
          followerId: userId,
        },
        // Được ít nhất một "bạn của mình" follow (bạn của bạn)
        some: {
          followerId: { in: friendIds },
        },
      },
    } as const;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: baseWhere,
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isOnline: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
        orderBy: [
          // Ưu tiên nhiều follower (xấp xỉ nhiều bạn chung / phổ biến)
          { _count: { followers: 'desc' } as any },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      } as any),
      this.prisma.user.count({
        where: baseWhere,
      }),
    ]);

    // Map bỏ _count ở response bên ngoài
    return {
      items: items.map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        isOnline: u.isOnline,
        createdAt: u.createdAt,
      })),
      total,
    };
  }

  createFollow(followerId: string, followingId: string) {
    return this.prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  deleteFollow(followerId: string, followingId: string) {
    return this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  async listFollowers(userId: string, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          createdAt: true,
          follower: {
            select: {
              id: true,
              username: true,
              avatar: true,
              bio: true,
              isOnline: true,
            },
          },
        },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return { items, total };
  }

  async listFollowing(userId: string, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          createdAt: true,
          following: {
            select: {
              id: true,
              username: true,
              avatar: true,
              bio: true,
              isOnline: true,
            },
          },
        },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return { items, total };
  }

  async listFollowingIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return rows.map((r) => r.followingId);
  }

  async listFriends(userId: string, skip: number, take: number) {
    // Lấy danh sách những người current user đang follow
    const outgoing = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    if (outgoing.length === 0) {
      return { items: [], total: 0 };
    }

    const outgoingIds = outgoing.map((f) => f.followingId);

    // Lấy danh sách những người đang follow lại current user
    const incoming = await this.prisma.follow.findMany({
      where: {
        followerId: { in: outgoingIds },
        followingId: userId,
      },
      select: { followerId: true },
    });

    const mutualIds = incoming.map((f) => f.followerId);
    if (mutualIds.length === 0) {
      return { items: [], total: 0 };
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: mutualIds } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isOnline: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where: { id: { in: mutualIds } } }),
    ]);

    return { items, total };
  }
}

