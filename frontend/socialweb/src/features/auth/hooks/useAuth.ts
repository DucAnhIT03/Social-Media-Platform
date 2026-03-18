import { useState } from 'react';
import { login, register, sendOTP, verifyOTP } from '@/api/auth';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đăng nhập
  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await login({ email, password });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const handleRegister = async (
    email: string,
    password: string,
    username: string,
    otp: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await register({ email, password, username, otp });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Gửi OTP
  const handleSendOTP = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendOTP(email);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xác thực OTP
  const handleVerifyOTP = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await verifyOTP(email, otp);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleLogin,
    handleRegister,
    handleSendOTP,
    handleVerifyOTP,
  };
};