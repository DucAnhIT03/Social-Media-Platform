import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

type MediaType = 'image' | 'video';

type UploadableFile = {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

@Injectable()
export class CloudinaryService {
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.isConfigured = Boolean(cloudName && apiKey && apiSecret);

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  async uploadBuffer(file: UploadableFile, mediaType: MediaType) {
    if (!file?.buffer) {
      throw new BadRequestException('File upload is missing');
    }

    if (!this.isConfigured) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured',
      );
    }

    const folder =
      mediaType === 'video' ? 'mxh/posts/short-videos' : 'mxh/posts/images';

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: mediaType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(new BadRequestException(`Cloudinary upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new BadRequestException('Cloudinary upload failed'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }
}