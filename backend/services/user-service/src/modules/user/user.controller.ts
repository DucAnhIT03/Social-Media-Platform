import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../shared/auth/jwt.guard';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SearchUserQueryDto } from './dto/search-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreatePostDto } from './dto/create-post.dto';
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
  search(@Query() query: SearchUserQueryDto) {
    return this.userService.search(query.username, query);
  }

  // Gợi ý kết bạn dựa trên bạn chung / bạn của bạn (cần JWT)
  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  recommend(@Req() req: any, @Query() q: PaginationQueryDto) {
    return this.userService.recommend(req.user.userId, q);
  }

  // Danh sách lời mời kết bạn nhận được (chưa xử lý)
  @UseGuards(JwtAuthGuard)
  @Get('me/friend-requests')
  friendRequests(@Req() req: any, @Query() q: PaginationQueryDto) {
    return this.userService.listFriendRequests(req.user.userId, q);
  }

  // Xử lý lời mời kết bạn: chấp nhận
  @UseGuards(JwtAuthGuard)
  @Post('me/friend-requests/:id/accept')
  acceptFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.userService.acceptFriendRequest(req.user.userId, id);
  }

  // Xử lý lời mời kết bạn: từ chối
  @UseGuards(JwtAuthGuard)
  @Post('me/friend-requests/:id/reject')
  rejectFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.userService.rejectFriendRequest(req.user.userId, id);
  }

  // Danh sách id người dùng mà current user đã follow (kết bạn)
  @UseGuards(JwtAuthGuard)
  @Get('me/following-ids')
  followingIds(@Req() req: any) {
    return this.userService.listFollowingIds(req.user.userId);
  }

  // Danh sách bạn bè (mutual follow)
  @UseGuards(JwtAuthGuard)
  @Get('me/friends')
  friends(@Req() req: any, @Query() q: PaginationQueryDto) {
    return this.userService.listFriends(req.user.userId, q);
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

  @UseGuards(JwtAuthGuard)
  @Post('me/posts')
  createMyPost(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.userService.createPost(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/uploads')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadMyPostMedia(
    @Req() req: any,
    @UploadedFile() file: any,
    @Query('type') type?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.userService.uploadPostMedia(req.user.userId, file, type);
  }

  @Get('feed/posts')
  listFeedPosts(@Query() q: PaginationQueryDto) {
    return this.userService.listFeedPosts(q);
  }

  @Get('feed/short-videos')
  listShortVideos(@Query() q: PaginationQueryDto) {
    return this.userService.listShortVideos(q);
  }
}

