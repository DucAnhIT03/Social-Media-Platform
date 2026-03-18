import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { sendOTP, register } from '@/api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getApiErrorMessage = (err: any, fallback: string): string => {
    const data = err?.response?.data;
    if (Array.isArray(data?.message)) {
      return data.message.join(', ');
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    return fallback;
  };

  // Đếm ngược theo thời gian hiệu lực OTP từ backend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsOtpSent(false);
      setOtp('');
      setError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOtpSent, timer]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email trước khi gửi OTP.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await sendOTP(email);
      setIsOtpSent(true);
      const expiresIn = Number(response?.data?.expiresIn ?? 300);
      setTimer(expiresIn);
      setOtp('');

      setSuccess(`Đã gửi mã OTP 6 số qua email. Mã có hiệu lực trong ${expiresIn} giây.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gửi OTP thất bại. Vui lòng kiểm tra email.'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtpSent) {
      await handleSendOTP();
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('Vui lòng nhập OTP gồm đúng 6 chữ số.');
      return;
    }

    const username = name.trim();
    if (username.length < 3 || username.length > 20) {
      setError('Tên người dùng phải từ 3 đến 20 ký tự.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await register({ username, email: email.trim(), password, otp });
      setSuccess('Đăng ký thành công. Đang chuyển sang trang đăng nhập...');
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2564&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/50 to-[#0a0a0a]" />
        </div>
        
        <div className="relative z-10 max-w-lg px-12">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <span className="text-white font-bold text-4xl">c</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Bắt đầu hành trình <br/>
            <span className="text-emerald-400">
              của riêng bạn
            </span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Tạo tài khoản ngay hôm nay để không bỏ lỡ những khoảnh khắc tuyệt vời từ cộng đồng của chúng tôi.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">c</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Tạo tài khoản</h2>
            <p className="text-gray-400">Điền thông tin bên dưới để đăng ký</p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tên người dùng</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  placeholder="3-20 ký tự" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isOtpSent}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  placeholder="Nhập email của bạn" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isOtpSent}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  placeholder="Tạo mật khẩu" 
                />
              </div>
            </div>

            {isOtpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mã OTP</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full px-4 py-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white tracking-[0.4em] text-center placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Mã OTP còn hiệu lực trong {timer}s
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#0a0a0a] transition-all mt-6 group"
            >
              <span>
                {isLoading
                  ? 'Đang xử lý...'
                  : isOtpSent
                    ? 'Xác thực OTP & Đăng ký'
                    : 'Gửi mã OTP'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {isOtpSent && !isLoading && (
              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full text-sm text-gray-300 hover:text-emerald-400 transition-colors"
              >
                Gửi lại mã OTP
              </button>
            )}
          </form>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2A2A]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0a0a0a] text-gray-500">Hoặc đăng ký với</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center py-3 px-4 border border-[#2A2A2A] rounded-xl bg-[#141414] hover:bg-[#1A1A1A] transition-colors">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                <span className="ml-2 text-sm font-medium text-gray-300">Google</span>
              </button>
              <button className="flex items-center justify-center py-3 px-4 border border-[#2A2A2A] rounded-xl bg-[#141414] hover:bg-[#1A1A1A] transition-colors">
                <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="h-5 w-5" />
                <span className="ml-2 text-sm font-medium text-gray-300">Facebook</span>
              </button>
            </div>

            <p className="mt-10 text-center text-sm text-gray-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
