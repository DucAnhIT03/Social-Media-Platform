
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterValues } from '@/lib/schemas';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { registerApi, saveTokens } from '@/lib/api';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useChatStore();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const username = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

      const res = await registerApi({
        email: data.email,
        password: data.password,
        username,
      });

      // Đăng ký xong chuyển sang trang đăng nhập
      // (không auto-login để đúng flow yêu cầu)
      router.push(
        `/login?registered=1&email=${encodeURIComponent(res.user.email)}`,
      );
    } catch (err: any) {
       console.error(err);
       setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] dark:bg-[#18191A] p-4">
      <div className="bg-white dark:bg-[#242526] p-8 rounded-xl shadow-lg w-full max-w-md">
        <Link href="/login" className="inline-flex items-center text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-[#E4E6EB] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
        </Link>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#1877F2] rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#050505] dark:text-[#E4E6EB]">Create Account</h1>
          <p className="text-[#65676B] dark:text-[#B0B3B8]">Join Messenger today</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#050505] dark:text-[#E4E6EB] mb-1">Họ</label>
              <input 
                {...register('firstName')}
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
                placeholder="Nguyễn Văn"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#050505] dark:text-[#E4E6EB] mb-1">Tên</label>
              <input 
                {...register('lastName')}
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
                placeholder="Anh"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-[#050505] dark:text-[#E4E6EB] mb-1">Confirm Password</label>
            <input 
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#65676B] dark:text-[#B0B3B8] text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1877F2] font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
