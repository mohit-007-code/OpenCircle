// app/auth/page.tsx
'use client';
import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import { RegisterData, LoginData, AuthResponse } from '@/types';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

// Hardcoded backend URL - CHANGE THIS if needed
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://opencircle-backend-h3qt.onrender.com';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState<RegisterData>({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login/', loginData);
      login(response.data.user, {
        access: response.data.access,
        refresh: response.data.refresh,
      });
      
      router.push('/');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register/', registerData);
      
      if (response.data.requires_verification) {
        showToast('Registration successful! Please check your email to verify your account 📧', 'success');
        
        setRegisterData({
          email: '',
          username: '',
          password: '',
          password2: '',
          first_name: '',
          last_name: '',
        });
        
        setIsSignUp(false);
      } else {
        login(response.data.user, {
          access: response.data.access,
          refresh: response.data.refresh,
        });
        router.push('/');
      }
    } catch (err: any) {
      console.error('Registration error:', err.response?.data);
      
      const errors = err.response?.data?.error || err.response?.data;
      let errorMessage = 'Registration failed. Please try again.';
      
      if (errors?.email) {
        errorMessage = Array.isArray(errors.email) ? errors.email[0] : errors.email;
      } else if (errors?.username) {
        errorMessage = Array.isArray(errors.username) ? errors.username[0] : errors.username;
      } else if (errors?.password || errors?.password2) {
        errorMessage = errors.password2?.[0] || errors.password?.[0] || 'Password validation failed';
      } else if (typeof errors === 'object') {
        errorMessage = Object.values(errors).flat().join(', ') || errorMessage;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Google Login Handler - Redirects to Django Allauth
  const handleGoogleLogin = (): void => {
    window.location.href = `${API_URL}/accounts/google/login/`;
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  // Google Login Button Component
  const GoogleButton = ({ text }: { text: string }) => (
    <button
      onClick={handleGoogleLogin}
      type="button"
      className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl border border-gray-300 transition-all shadow-sm hover:shadow-md"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {text}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden lg:flex relative w-full h-screen bg-zinc-950 overflow-hidden">
        
        {/* LEFT SIDE */}
        <div className="w-1/2 h-full relative overflow-hidden">
          {/* Register Form */}
          <div 
            className="absolute inset-0 flex items-center justify-center p-8 bg-zinc-950 transition-transform duration-700 ease-in-out"
            style={{
              transform: isSignUp ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            <div className="w-full max-w-md overflow-y-auto max-h-screen py-8">
              <h2 className="text-3xl font-bold mb-2 text-white">Sign Up</h2>
              <p className="text-zinc-400 mb-6 text-sm">Discover communities and connect with people</p>

              {error && isSignUp && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Username *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="username"
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="johndoe"
                      value={registerData.username}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">First Name</label>
                    <input
                      name="first_name"
                      type="text"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="John"
                      value={registerData.first_name}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Last Name</label>
                    <input
                      name="last_name"
                      type="text"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Doe"
                      value={registerData.last_name}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="password2"
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="••••••••"
                      value={registerData.password2}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl disabled:opacity-50 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </span>
                  ) : (
                    'Sign Up'
                  )}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-950 text-zinc-500">OR</span>
                </div>
              </div>

              <GoogleButton text="Sign up with Google" />

              <p className="text-center text-sm text-zinc-500 mt-4">
                Already a member?{' '}
                <button onClick={toggleMode} className="text-white hover:text-zinc-300 font-semibold transition-colors">
                  Log In
                </button>
              </p>
            </div>
          </div>

          {/* "New here?" Panel */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/95 via-zinc-100/95 to-zinc-200/95 flex flex-col items-center justify-center text-zinc-950 p-12 transition-transform duration-700 ease-in-out"
            style={{
              transform: isSignUp ? 'translateX(-100%)' : 'translateX(0)',
            }}
          >
            <div className="w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-4xl font-bold text-white">O</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">New here?</h1>
            <p className="text-center mb-8 text-lg">Sign up and discover great amount of new opportunities!</p>
            <button
              onClick={toggleMode}
              className="px-12 py-3 border-2 border-zinc-950 rounded-full font-bold hover:bg-zinc-950 hover:text-white transition-all shadow-lg hover:scale-105"
            >
              SIGN UP
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/2 h-full relative overflow-hidden">
          {/* "One of us?" Panel */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/95 via-zinc-100/95 to-zinc-200/95 flex flex-col items-center justify-center text-zinc-950 p-12 transition-transform duration-700 ease-in-out"
            style={{
              transform: isSignUp ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            <div className="w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-4xl font-bold text-white">O</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">One of us?</h1>
            <p className="text-center mb-8 text-lg">If you already have an account, just sign in. We've missed you!</p>
            <button
              onClick={toggleMode}
              className="px-12 py-3 border-2 border-zinc-950 rounded-full font-bold hover:bg-zinc-950 hover:text-white transition-all shadow-lg hover:scale-105"
            >
              SIGN IN
            </button>
          </div>

          {/* Login Form */}
          <div 
            className="absolute inset-0 flex items-center justify-center p-8 bg-zinc-950 transition-transform duration-700 ease-in-out"
            style={{
              transform: isSignUp ? 'translateX(100%)' : 'translateX(0)',
            }}
          >
            <div className="w-full max-w-md">
              <h2 className="text-3xl font-bold mb-2 text-white">Log In</h2>
              <p className="text-zinc-400 mb-6 text-sm">Connect with communities around the world</p>

              {error && !isSignUp && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={handleLoginChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={handleLoginChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl disabled:opacity-50 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Logging in...
                    </span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-950 text-zinc-500">OR</span>
                </div>
              </div>

              <GoogleButton text="Sign in with Google" />

              <p className="text-center text-sm text-zinc-500 mt-6">
                New to OpenCircle?{' '}
                <button onClick={toggleMode} className="text-white hover:text-zinc-300 font-semibold transition-colors">
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - SAME CHANGES */}
      <div className="lg:hidden w-full min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {!isSignUp ? (
            <div className="w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-4 shadow-2xl">
                  <span className="text-3xl font-bold text-zinc-950">O</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Log In</h2>
                <p className="text-zinc-400 text-sm mt-2">Connect with communities around the world</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={handleLoginChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={handleLoginChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Logging in...
                    </span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-950 text-zinc-500">OR</span>
                </div>
              </div>

              <GoogleButton text="Sign in with Google" />

              <p className="text-center text-sm text-zinc-500 mt-6">
                New to OpenCircle?{' '}
                <button onClick={toggleMode} className="text-white hover:text-zinc-300 font-semibold">
                  Sign Up
                </button>
              </p>
            </div>
          ) : (
            <div className="w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-4 shadow-2xl">
                  <span className="text-3xl font-bold text-zinc-950">O</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Sign Up</h2>
                <p className="text-zinc-400 text-sm mt-2">Discover communities and connect with people</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Username *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="username"
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="johndoe"
                      value={registerData.username}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">First Name</label>
                    <input
                      name="first_name"
                      type="text"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="John"
                      value={registerData.first_name}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Last Name</label>
                    <input
                      name="last_name"
                      type="text"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="Doe"
                      value={registerData.last_name}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      name="password2"
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      placeholder="••••••••"
                      value={registerData.password2}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </span>
                  ) : (
                    'Sign Up'
                  )}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-950 text-zinc-500">OR</span>
                </div>
              </div>

              <GoogleButton text="Sign up with Google" />

              <p className="text-center text-sm text-zinc-500 mt-4">
                Already a member?{' '}
                <button onClick={toggleMode} className="text-white hover:text-zinc-300 font-semibold">
                  Log In
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
