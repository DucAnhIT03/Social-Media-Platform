import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập gọi API gửi email
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2564&auto=format&fit=crop" 
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
            Khôi phục <br/>
            <span className="text-emerald-400">
              tài khoản của bạn
            </span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản một cách nhanh chóng và an toàn.
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
          {!isSubmitted ? (
            <>
              <div className="mb-10">
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại đăng nhập
                </Link>
                <h2 className="text-3xl font-bold text-white mb-3">Quên mật khẩu?</h2>
                <p className="text-gray-400">Nhập email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
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
                      className="block w-full pl-11 pr-4 py-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                      placeholder="Nhập email của bạn" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#0a0a0a] transition-all mt-6 group"
                >
                  <span>Gửi liên kết đặt lại</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Kiểm tra email của bạn</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến <br/>
                <span className="text-white font-medium">{email}</span>
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center w-full py-3.5 px-4 border border-[#2A2A2A] rounded-xl shadow-sm text-sm font-bold text-white bg-[#141414] hover:bg-[#1A1A1A] transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
