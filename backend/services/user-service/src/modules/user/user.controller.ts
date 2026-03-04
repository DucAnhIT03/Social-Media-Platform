import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/jwt.guard';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Đăng ký / đăng nhập (proxy sang auth-service)
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.userService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }

  // 7. Search user theo username (có phân trang)
  @Get('search')
  search(@Query() s: SearchUserDto, @Query() q: PaginationQueryDto) {
    return this.userService.search(s.username, q);
  }

  // 1. Lấy profile theo id (public)
  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfileById(id);
  }

  // 2. Update profile (cần JWT)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  // 3. Follow user
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  follow(@Req() req: any, @Param('id') id: string) {
    return this.userService.follow(req.user.userId, id);
  }

  // 4. Unfollow user
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  unfollow(@Req() req: any, @Param('id') id: string) {
    return this.userService.unfollow(req.user.userId, id);
  }

  // 5. Danh sách follower
  @Get(':id/followers')
  followers(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.userService.listFollowers(id, q);
  }

  // 6. Danh sách following
  @Get(':id/following')
  following(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.userService.listFollowing(id, q);
  }
}

