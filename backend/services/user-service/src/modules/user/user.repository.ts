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
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { username: { contains: username } },
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
        where: { username: { contains: username } },
      }),
    ]);

    return { items, total };
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
}

