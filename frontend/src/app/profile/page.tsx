// app/profile/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { User, Mail, Calendar, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center w-full">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white w-full">
      <Navbar />

      <div className="w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">Profile</h1>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-600"></div>

            {/* Profile Info */}
            <div className="p-8">
              <div className="flex items-start gap-6 -mt-20">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-zinc-900 shadow-xl">
                  {user.username[0].toUpperCase()}
                </div>

                <div className="flex-1 mt-16">
                  <h2 className="text-3xl font-bold mb-2">{user.username}</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail size={18} />
                      <span>{user.email}</span>
                    </div>
                    {user.first_name && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <User size={18} />
                        <span>{user.first_name} {user.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-blue-500" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-800 rounded-xl">
                    <p className="text-sm text-zinc-400 mb-1">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div className="p-4 bg-zinc-800 rounded-xl">
                    <p className="text-sm text-zinc-400 mb-1">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  {user.first_name && (
                    <>
                      <div className="p-4 bg-zinc-800 rounded-xl">
                        <p className="text-sm text-zinc-400 mb-1">First Name</p>
                        <p className="font-medium">{user.first_name}</p>
                      </div>
                      <div className="p-4 bg-zinc-800 rounded-xl">
                        <p className="text-sm text-zinc-400 mb-1">Last Name</p>
                        <p className="font-medium">{user.last_name}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-800">
                <div className="bg-zinc-800/50 rounded-xl p-6 text-center">
                  <Calendar size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-400">Profile editing and additional features coming soon...</p>
                  <p className="text-sm text-zinc-500 mt-2">Stay tuned for updates!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
