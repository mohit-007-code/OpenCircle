// app/register/page.tsx
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import Link from 'next/link';
import { RegisterData, AuthResponse } from '@/types';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register/', formData);
      login(response.data.user, {
        access: response.data.access,
        refresh: response.data.refresh,
      });
      router.push('/');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse): Promise<void> => {
    if (!credentialResponse.credential) {
      setError('Google authentication failed');
      return;
    }

    try {
      const response = await api.post<AuthResponse>('/auth/google/', {
        token: credentialResponse.credential,
      });

      login(response.data.user, {
        access: response.data.access,
        refresh: response.data.refresh,
      });

      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google authentication failed');
    }
  };

  const handleGoogleError = (): void => {
    setError('Google Sign-In failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#ff4500] to-[#ff6a00] p-12 items-center justify-center">
        <div className="max-w-md">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-[#ff4500]">O</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Join OpenCircle</h1>
          <p className="text-xl text-white/90">Discover communities and connect with people who share your interests</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#ff4500] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">O</span>
              </div>
              <span className="text-2xl font-bold text-white">OpenCircle</span>
            </div>
          </div>

          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Sign Up</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#d7dadc]">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={20} />
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#d7dadc]">Username *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={20} />
                  <input
                    name="username"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#d7dadc]">First Name</label>
                  <input
                    name="first_name"
                    type="text"
                    className="w-full px-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#d7dadc]">Last Name</label>
                  <input
                    name="last_name"
                    type="text"
                    className="w-full px-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#d7dadc]">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={20} />
                  <input
                    name="password"
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#d7dadc]">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={20} />
                  <input
                    name="password2"
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                    placeholder="••••••••"
                    value={formData.password2}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#ff4500] hover:bg-[#ff5414] text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#343536]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a1a1b] text-[#818384]">OR</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                text="signup_with"
                width="350"
              />
            </div>

            <p className="text-center text-sm text-[#818384] mt-6">
              Already a member?{' '}
              <Link href="/login" className="text-[#ff4500] hover:text-[#ff5414] font-semibold">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
