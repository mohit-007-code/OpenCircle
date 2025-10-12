// app/auth/page.tsx
'use client';
import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { RegisterData, LoginData, AuthResponse } from '@/types';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

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
      
      // Toast is shown automatically in AuthContext
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
      
      // Check if email verification is required
      if (response.data.requires_verification) {
        showToast('Registration successful! Please check your email to verify your account 📧', 'success');
        
        // Reset form
        setRegisterData({
          email: '',
          username: '',
          password: '',
          password2: '',
          first_name: '',
          last_name: '',
        });
        
        // Switch to login mode
        setIsSignUp(false);
      } else {
        // Normal registration without verification
        login(response.data.user, {
          access: response.data.access,
          refresh: response.data.refresh,
        });
        router.push('/');
      }
    } catch (err: any) {
      console.error('Registration error:', err.response?.data);
      
      // Handle specific field errors
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse): Promise<void> => {
    if (!credentialResponse.credential) {
      const errorMsg = 'Google authentication failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
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
      const errorMsg = err.response?.data?.error || 'Google authentication failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleGoogleError = (): void => {
    const errorMsg = 'Google Sign-In failed. Please try again.';
    setError(errorMsg);
    showToast(errorMsg, 'error');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden lg:flex relative w-full h-screen bg-zinc-950 overflow-hidden">
        
        {/* LEFT SIDE */}
        <div className="w-1/2 h-full relative overflow-hidden">
          {/* Register Form - Shows on LEFT when isSignUp is TRUE */}
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

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  text="signup_with"
                />
              </div>

              <p className="text-center text-sm text-zinc-500 mt-4">
                Already a member?{' '}
                <button onClick={toggleMode} className="text-white hover:text-zinc-300 font-semibold transition-colors">
                  Log In
                </button>
              </p>
            </div>
          </div>

          {/* "New here?" Panel - Shows on LEFT when isSignUp is FALSE */}
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
          {/* "One of us?" Panel - Shows on RIGHT when isSignUp is TRUE */}
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

          {/* Login Form - Shows on RIGHT when isSignUp is FALSE */}
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

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  text="signin_with"
                />
              </div>

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

      {/* Mobile Layout - Keep existing code */}
      {/* ... your existing mobile code ... */}
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
