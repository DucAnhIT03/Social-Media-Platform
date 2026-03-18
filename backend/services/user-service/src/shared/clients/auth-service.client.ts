import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

type Json = Record<string, any>;

@Injectable()
export class AuthServiceClient {
  private baseUrl() {
    // Ví dụ: http://localhost:3001/api
    return process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';
  }

  async register(payload: Json) {
    return this.post('/auth/register', payload);
  }

  async login(payload: Json) {
    return this.post('/auth/login', payload);
  }

  async changePassword(token: string, payload: Json) {
    return this.post('/auth/change-password', payload, token);
  }

  private async post(path: string, body: Json, bearerToken?: string) {
    const url = `${this.baseUrl()}${path}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new HttpException(
        'Không kết nối được tới auth-service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Auth-service lỗi (${res.status}) khi gọi ${path}`;
      throw new HttpException(message, res.status);
    }
    return data;
  }
}

