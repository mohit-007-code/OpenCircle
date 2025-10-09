// app/page.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">OpenCircle</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          {/* Welcome Message - Changes based on auth status */}
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-gray-900">
              {user ? (
                <>
                  Welcome <span className="text-blue-600">{user.username}</span> to OpenCircle
                </>
              ) : (
                'Welcome to OpenCircle'
              )}
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {user ? (
                `Hi ${user.first_name || user.username}! Ready to explore communities and connect with like-minded people?`
              ) : (
                'Join communities, share your thoughts, and connect with people who share your interests.'
              )}
            </p>
          </div>

          {/* User-specific content */}
          {user ? (
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Community</h3>
                <p className="text-gray-600 mb-4">Start your own community and invite others to join</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Create Now →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Explore Communities</h3>
                <p className="text-gray-600 mb-4">Discover and join communities that match your interests</p>
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  Explore →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Posts</h3>
                <p className="text-gray-600 mb-4">Share your thoughts and engage with community members</p>
                <button className="text-green-600 hover:text-green-700 font-medium">
                  Start Posting →
                </button>
              </div>
            </div>
          ) : (
            /* Guest user CTA */
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-3xl mx-auto mt-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Get Started Today
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Create an account to start building and joining communities. It only takes a minute!
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Features Section (shown to all users) */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-gray-900 mb-12">
              Why OpenCircle?
            </h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🌐</div>
                <h4 className="font-semibold text-gray-900 mb-2">Global Community</h4>
                <p className="text-gray-600 text-sm">Connect with people from around the world</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
                <p className="text-gray-600 text-sm">Your data is protected with industry standards</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fast & Reliable</h4>
                <p className="text-gray-600 text-sm">Lightning-fast performance you can count on</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy Communication</h4>
                <p className="text-gray-600 text-sm">Simple tools to engage with your community</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
