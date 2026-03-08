import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../libs/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  // Kiểu any để tránh xung đột type với JwtSignOptions.expiresIn (string | number)
  private readonly accessTokenTtl: any;
  private readonly refreshTokenTtl: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtl =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '7d';
    this.refreshTokenTtl =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.userCredential.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          username: dto.username,
        },
      });

      const tokens = await this.generateTokens(user.id, user.email);

      const credential = await tx.userCredential.create({
        data: {
          id: user.id,
          email: dto.email,
          password: hashed,
          refreshToken: tokens.refreshToken,
        },
      });

      return { user, credential, tokens };
    });

    return {
      user: {
        id: created.user.id,
        email: created.user.email,
        username: created.user.username,
        avatar: created.user.avatar,
        bio: created.user.bio,
        isVerified: created.credential.isVerified,
      },
      ...created.tokens,
    };
  }

  async login(dto: LoginDto) {
    const credential = await this.prisma.userCredential.findUnique({
      where: { email: dto.email },
      include: { user: true },
    });
    if (!credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, credential.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(credential.id, credential.email);
    await this.prisma.userCredential.update({
      where: { id: credential.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: credential.user.id,
        email: credential.user.email,
        username: credential.user.username,
        avatar: credential.user.avatar,
        bio: credential.user.bio,
        isVerified: credential.isVerified,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    // 1) Check refresh token exists in DB
    const credential = await this.prisma.userCredential.findFirst({
      where: { refreshToken },
      include: { user: true },
    });
    if (!credential) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2) Verify refresh token signature + payload
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      if ((payload.sub as string) !== credential.id) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 3) Issue new tokens and rotate stored refresh token
    const tokens = await this.generateTokens(credential.id, credential.email);
    await this.prisma.userCredential.update({
      where: { id: credential.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: credential.user.id,
        email: credential.user.email,
        username: credential.user.username,
        avatar: credential.user.avatar,
        bio: credential.user.bio,
        isVerified: credential.isVerified,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.userCredential.updateMany({
      where: { refreshToken },
      data: { refreshToken: null },
    });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const credential = await this.prisma.userCredential.findUnique({
      where: { id: userId },
    });

    if (!credential) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const matched = await bcrypt.compare(dto.currentPassword, credential.password);
    if (!matched) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const newHashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.userCredential.update({
      where: { id: userId },
      data: { password: newHashed },
    });

    return { success: true };
  }

  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return { userId: payload.sub as string, email: payload.email as string };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessSignOptions: any = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    };
    const refreshSignOptions: any = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    };

    if (this.accessTokenTtl !== 'never') {
      accessSignOptions.expiresIn = this.accessTokenTtl;
    }
    if (this.refreshTokenTtl !== 'never') {
      refreshSignOptions.expiresIn = this.refreshTokenTtl;
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessSignOptions),
      this.jwtService.signAsync(payload, refreshSignOptions),
    ]);

    return { accessToken, refreshToken };
  }
}
