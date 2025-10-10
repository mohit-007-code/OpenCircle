// app/profile/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Calendar, Award, MessageSquare, Heart, Cake } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-5">
        <Sidebar />

        <main className="flex-1">
          {/* Profile Header */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg overflow-hidden mb-5">
            {/* Banner */}
            <div className="h-24 bg-gradient-to-r from-[#ff4500] to-[#ff6a00]"></div>
            
            {/* Profile Info */}
            <div className="p-6 -mt-12">
              <div className="flex items-end gap-4 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-[#1a1a1b] bg-gradient-to-br from-[#ff4500] to-[#ff6a00] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">u/{user.username}</h1>
                  <p className="text-[#818384]">Redditor</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 pt-4 border-t border-[#343536]">
                <div>
                  <div className="text-sm text-[#818384]">Karma</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Award size={20} className="text-[#ff4500]" />
                    0
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#818384]">Cake day</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Cake size={20} className="text-[#ff4500]" />
                    Today
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-5">
            <h2 className="text-xl font-bold mb-4">Account Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#272729] rounded-lg">
                <User size={20} className="text-[#818384]" />
                <div>
                  <div className="text-sm text-[#818384]">Username</div>
                  <div className="font-medium">{user.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#272729] rounded-lg">
                <Mail size={20} className="text-[#818384]" />
                <div>
                  <div className="text-sm text-[#818384]">Email</div>
                  <div className="font-medium">{user.email}</div>
                </div>
              </div>

              {user.first_name && (
                <div className="flex items-center gap-3 p-4 bg-[#272729] rounded-lg">
                  <User size={20} className="text-[#818384]" />
                  <div>
                    <div className="text-sm text-[#818384]">Name</div>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Overview */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#272729] rounded-lg text-center">
                <MessageSquare size={32} className="mx-auto mb-2 text-[#818384]" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-[#818384]">Posts</div>
              </div>
              
              <div className="p-4 bg-[#272729] rounded-lg text-center">
                <MessageSquare size={32} className="mx-auto mb-2 text-[#818384]" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-[#818384]">Comments</div>
              </div>

              <div className="p-4 bg-[#272729] rounded-lg text-center">
                <Heart size={32} className="mx-auto mb-2 text-[#818384]" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-[#818384]">Upvotes Given</div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80">
          <div className="sticky top-14 bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
            <h3 className="font-semibold mb-3">Profile Settings</h3>
            <p className="text-sm text-[#818384] mb-4">
              Customize your profile, manage preferences, and more coming soon!
            </p>
            <button className="w-full py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors">
              Edit Profile (Coming Soon)
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
