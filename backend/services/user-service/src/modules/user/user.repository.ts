import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../../libs/database/prisma.service';

@Injectable()
export class UserRepository {
  private postsTableInitialized = false;

  constructor(private readonly prisma: PrismaService) {}

  private async ensurePostsTable() {
    if (this.postsTableInitialized) {
      return;
    }

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS posts (
        id CHAR(36) NOT NULL PRIMARY KEY,
        authorId CHAR(36) NOT NULL,
        content TEXT NOT NULL,
        imageUrl VARCHAR(2048) NULL,
        postType VARCHAR(32) NOT NULL DEFAULT 'POST',
        shortVideoUrl VARCHAR(2048) NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_posts_authorId (authorId),
        INDEX idx_posts_createdAt (createdAt),
        INDEX idx_posts_postType (postType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Backward-compatible migration for old environments that already have `posts`.
    await this.prisma
      .$executeRawUnsafe(
        `ALTER TABLE posts ADD COLUMN postType VARCHAR(32) NOT NULL DEFAULT 'POST' AFTER imageUrl`,
      )
      .catch(() => undefined);
    await this.prisma
      .$executeRawUnsafe(
        `ALTER TABLE posts ADD COLUMN shortVideoUrl VARCHAR(2048) NULL AFTER postType`,
      )
      .catch(() => undefined);
    await this.prisma
      .$executeRawUnsafe(`ALTER TABLE posts ADD INDEX idx_posts_postType (postType)`)
      .catch(() => undefined);

    this.postsTableInitialized = true;
  }

  async createPost(
    authorId: string,
    content: string,
    imageUrl?: string | null,
    postType: 'POST' | 'SHORT_VIDEO' = 'POST',
    shortVideoUrl?: string | null,
  ) {
    await this.ensurePostsTable();

    const id = randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO posts (id, authorId, content, imageUrl, postType, shortVideoUrl)
      VALUES (${id}, ${authorId}, ${content}, ${imageUrl ?? null}, ${postType}, ${shortVideoUrl ?? null})
    `;

    const rows = await this.prisma.$queryRaw<Array<any>>`
      SELECT
        p.id,
        p.content,
        p.imageUrl,
        p.createdAt,
        p.updatedAt,
        u.id AS authorId,
        u.username AS authorUsername,
        u.avatar AS authorAvatar,
        u.bio AS authorBio,
        u.isOnline AS authorIsOnline
      FROM posts p
      INNER JOIN users u ON u.id = p.authorId
      WHERE p.id = ${id}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async listFeedPosts(skip: number, take: number) {
    await this.ensurePostsTable();

    const [items, totalRows] = await Promise.all([
      this.prisma.$queryRaw<Array<any>>`
        SELECT
          p.id,
          p.content,
          p.imageUrl,
          p.postType,
          p.shortVideoUrl,
          p.postType,
          p.shortVideoUrl,
          p.createdAt,
          p.updatedAt,
          u.id AS authorId,
          u.username AS authorUsername,
          u.avatar AS authorAvatar,
          u.bio AS authorBio,
          u.isOnline AS authorIsOnline
        FROM posts p
        INNER JOIN users u ON u.id = p.authorId
        ORDER BY p.createdAt DESC
        LIMIT ${take} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total FROM posts
      `,
    ]);

    const totalValue = totalRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue);

    return { items, total };
  }

  async listShortVideos(skip: number, take: number) {
    await this.ensurePostsTable();

    const [items, totalRows] = await Promise.all([
      this.prisma.$queryRaw<Array<any>>`
        SELECT
          p.id,
          p.content,
          p.imageUrl,
          p.postType,
          p.shortVideoUrl,
          p.createdAt,
          p.updatedAt,
          u.id AS authorId,
          u.username AS authorUsername,
          u.avatar AS authorAvatar,
          u.bio AS authorBio,
          u.isOnline AS authorIsOnline
        FROM posts p
        INNER JOIN users u ON u.id = p.authorId
        WHERE p.postType = 'SHORT_VIDEO' AND p.shortVideoUrl IS NOT NULL
        ORDER BY p.createdAt DESC
        LIMIT ${take} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total
        FROM posts
        WHERE postType = 'SHORT_VIDEO' AND shortVideoUrl IS NOT NULL
      `,
    ]);

    const totalValue = totalRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue);

    return { items, total };
  }

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

  async clearPendingFriendRequests(targetUserId: string, fromUserId: string) {
    return (this.prisma as any).notification.deleteMany({
      where: {
        userId: targetUserId,
        fromUserId,
        type: 'FRIEND_REQUEST',
        isRead: false,
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
      select: { followingId: true, createdAt: true },
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
      select: { followerId: true, createdAt: true },
    });

    const incomingByFollowerId = new Map(
      incoming.map((f) => [f.followerId, f.createdAt]),
    );

    const mutual = outgoing
      .filter((f) => incomingByFollowerId.has(f.followingId))
      .map((f) => {
        const incomingCreatedAt = incomingByFollowerId.get(f.followingId)!;
        const establishedAt =
          incomingCreatedAt > f.createdAt ? incomingCreatedAt : f.createdAt;

        return {
          friendId: f.followingId,
          establishedAt,
        };
      })
      .sort((a, b) => b.establishedAt.getTime() - a.establishedAt.getTime());

    if (mutual.length === 0) {
      return { items: [], total: 0 };
    }

    const paged = mutual.slice(skip, skip + take);
    const pagedIds = paged.map((f) => f.friendId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: pagedIds } },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        isOnline: true,
      },
    });

    const userById = new Map(users.map((u) => [u.id, u]));

    const items = paged
      .map((f) => {
        const user = userById.get(f.friendId);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          isOnline: user.isOnline,
          createdAt: f.establishedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { items, total: mutual.length };
  }
}

