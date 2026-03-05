import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class SearchUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  username: string;
}

export class SearchUserQueryDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  username: string;
}
