
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginValues } from '@/lib/schemas';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { loginApi, saveTokens } from '@/lib/api';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser } = useChatStore();

  const registered = searchParams.get('registered') === '1';
  const emailFromRegister = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailFromRegister,
      password: '',
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await loginApi({ email: data.email, password: data.password });
      saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });

      setCurrentUser({
        id: res.user.id,
        name: res.user.username,
        avatar: res.user.avatar || `https://i.pravatar.cc/150?u=${res.user.id}`,
      });
      
      router.push('/');
    } catch (err: any) {
       console.error(err);
       setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('Đăng nhập Google chưa được tích hợp (hiện đang dùng backend auth).');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] dark:bg-[#18191A] p-4">
      <div className="bg-white dark:bg-[#242526] p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#1877F2] rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#050505] dark:text-[#E4E6EB]">Welcome back</h1>
          <p className="text-[#65676B] dark:text-[#B0B3B8]">Sign in to continue to Messenger</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {registered && !error && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 text-sm p-3 rounded-lg mb-6 text-center">
            Đăng ký thành công, vui lòng đăng nhập.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#050505] dark:text-[#E4E6EB] mb-1">Email</label>
            <input 
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#050505] dark:text-[#E4E6EB] mb-1">Password</label>
            <input 
              {...register('password')}
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E4E6EB] dark:border-[#3E4042]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#242526] text-[#65676B] dark:text-[#B0B3B8]">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full border border-[#E4E6EB] dark:border-[#3E4042] hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <div className="mt-8 text-center">
          <p className="text-[#65676B] dark:text-[#B0B3B8] text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#1877F2] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
