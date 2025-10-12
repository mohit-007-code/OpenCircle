// app/profile/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Post, Comment, FollowUser } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { 
  User,
  Calendar,
  Mail,
  Settings,
  MessageSquare,
  FileText,
  TrendingUp,
  Heart,
  Camera,
  ArrowLeft,
  LogOut,
  Users,
  Sparkles,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UserStats {
  total_posts: number;
  total_comments: number;
  communities: {
    name: string;
    slug: string;
    post_count: number;
  }[];
  member_of: number;
  followers_count: number;
  following_count: number;
}

interface UserComment extends Comment {
  post_title?: string;
  community_name?: string;
  community_slug?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments'>('overview');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [updating, setUpdating] = useState(false);

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [removingFollowerId, setRemovingFollowerId] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfileData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setBio(user.bio || '');
      setProfilePreview(getImageUrl(user.profile_picture));
      setCoverPreview(getImageUrl(user.cover_image));
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user || !localStorage.getItem('access_token')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [statsRes, postsRes, commentsRes] = await Promise.all([
        api.get('/auth/stats/').catch(err => {
          console.error('Stats error:', err);
          return { data: { total_posts: 0, total_comments: 0, communities: [], member_of: 0, followers_count: 0, following_count: 0 } };
        }),
        api.get(`/posts/user/${user?.id}/`).catch(err => {
          console.error('Posts error:', err);
          return { data: [] };
        }),
        api.get('/auth/comments/').catch(err => {
          console.error('Comments error:', err);
          return { data: [] };
        })
      ]);

      setStats(statsRes.data);
      setPosts(postsRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await api.get(`/auth/users/${user?.id}/followers/`);
      setFollowers(response.data);
    } catch (error) {
      showToast('Failed to load followers', 'error');
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await api.get(`/auth/users/${user?.id}/following/`);
      setFollowing(response.data);
    } catch (error) {
      showToast('Failed to load following', 'error');
    }
  };

  const handleFollowToggle = async (userId: number, isFollowing: boolean) => {
    try {
      await api.post(`/auth/users/${userId}/follow/`);
      
      setFollowers(prev => prev.map(f => 
        f.id === userId ? { ...f, is_following: !isFollowing } : f
      ));
      setFollowing(prev => prev.map(f => 
        f.id === userId ? { ...f, is_following: !isFollowing } : f
      ));
      
      showToast(isFollowing ? 'Unfollowed' : 'Followed', 'success');
    } catch (error) {
      showToast('Failed to update follow', 'error');
    }
  };

  const handleRemoveFollower = async (userId: number) => {
    if (removingFollowerId === userId) return;
    
    setRemovingFollowerId(userId);
    
    try {
      await api.delete(`/auth/users/${userId}/remove-follower/`).catch(async (error) => {
        if (error.response?.status === 404 || error.response?.status === 405) {
          await api.post(`/auth/users/${userId}/follow/`);
        } else {
          throw error;
        }
      });
      
      setFollowers(prev => prev.filter(f => f.id !== userId));
      
      setStats(prev => prev ? {
        ...prev,
        followers_count: Math.max(0, prev.followers_count - 1)
      } : null);
      
      showToast('Follower removed', 'success');
    } catch (error) {
      console.error('Remove error:', error);
      showToast('Failed to remove follower', 'error');
    } finally {
      setRemovingFollowerId(null);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('bio', bio);
      
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      const response = await api.patch('/auth/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(response.data);
      setUsername(response.data.username);
      setFirstName(response.data.first_name || '');
      setLastName(response.data.last_name || '');
      setBio(response.data.bio || '');
      setProfilePreview(getImageUrl(response.data.profile_picture));
      setCoverPreview(getImageUrl(response.data.cover_image));
      
      setEditMode(false);
      setProfilePicture(null);
      setCoverImage(null);
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Update error:', error);
      showToast(error.response?.data?.username?.[0] || 'Failed to update profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to change password', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    showToast('Logged out successfully', 'success');
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8000${imageUrl}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const PostSkeleton = () => (
    <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            {[1, 2, 3].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 lg:pb-0">
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title={`Followers (${stats?.followers_count || 0})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {followers.map((follower) => (
            <div key={follower.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowersModal(false);
                  router.push(`/users/${follower.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-white flex items-center justify-center text-white font-bold overflow-hidden">
                  {follower.profile_picture ? (
                    <Image src={getImageUrl(follower.profile_picture)!} alt={follower.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    follower.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">u/{follower.username}</p>
                  {(follower.first_name || follower.last_name) && (
                    <p className="text-sm text-zinc-400">{follower.first_name} {follower.last_name}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFollower(follower.id);
                }}
                disabled={removingFollowerId === follower.id}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingFollowerId === follower.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
          {followers.length === 0 && (
            <p className="text-center text-white py-8">No followers yet</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title={`Following (${stats?.following_count || 0})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 text-white overflow-y-auto">
          {following.map((followingUser) => (
            <div key={followingUser.id} className="flex items-center  justify-between p-3 bg-zinc-800/50 rounded-xl">
              <div 
                className="flex items-center gap-3 cursor-pointer text-white flex-1"
                onClick={() => {
                  setShowFollowingModal(false);
                  router.push(`/users/${followingUser.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-white flex items-center justify-center text-white font-bold overflow-hidden">
                  {followingUser.profile_picture ? (
                    <Image src={getImageUrl(followingUser.profile_picture)!} alt={followingUser.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    followingUser.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">u/{followingUser.username}</p>
                  {(followingUser.first_name || followingUser.last_name) && (
                    <p className="text-sm text-white">{followingUser.first_name} {followingUser.last_name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleFollowToggle(followingUser.id, true)}
                className="px-4 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold text-white transition-colors"
              >
                Unfollow
              </button>
            </div>
          ))}
          {following.length === 0 && (
            <p className="text-center text-white py-8">Not following anyone yet</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showMobileSettings}
        onClose={() => setShowMobileSettings(false)}
        title="Profile Settings"
        showActions={false}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                <Sparkles size={18} className="text-white" />
                Profile
              </h3>
              <button
                onClick={() => setEditMode(!editMode)}
                className="p-2 hover:bg-zinc-800/50 text-white rounded-xl transition-colors"
              >
                <Settings size={18}  / >
              </button>
            </div>

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setProfilePicture(null);
                      setCoverImage(null);
                      setProfilePreview(getImageUrl(user.profile_picture));
                      setCoverPreview(getImageUrl(user.cover_image));
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-800/50 text-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-black"
                  >
                    {updating ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <User size={16} />
                  <span>u/{user.username}</span>
                </div>
                {(user.first_name || user.last_name) && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <User size={16} />
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-400">
                  <Mail size={16} />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Calendar size={16} />
                  <span>Joined {formatTime(user.date_joined || new Date().toISOString())}</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5">
            <h3 className="font-bold text-lg mb-4 text-white">Security</h3>
            
            {!showPasswordForm ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-white"
                >
                  Change Password
                </button>
                
                <button
                  onClick={() => {
                    setShowMobileSettings(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-semibold transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 px-4 py-2 bg-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-black"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
      />

      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 lg:mb-0">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium hidden sm:inline">Back</span>
            </motion.button>

            <button
              onClick={() => setShowMobileSettings(true)}
              className="lg:hidden p-2 hover:bg-zinc-800/50 rounded-xl transition-colors"
            >
              <Settings size={20} className="text-zinc-400" />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl mb-6 overflow-hidden"
          >
            <div className="relative">
              <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-white to-white relative">
                {coverPreview && (
                  <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                )}
                {editMode && (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-xl transition-colors z-10 backdrop-blur-sm"
                  >
                    <Camera size={18} />
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageChange}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
              </div>
            </div>
            
            <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5">
              <div className="-mt-12 sm:-mt-14 md:-mt-16 mb-4 relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl border-4 border-zinc-950 bg-gradient-to-br from-white to-white flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold overflow-hidden shadow-2xl shadow-white/30">
                  {profilePreview ? (
                    <Image src={profilePreview} alt={user.username} width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                {editMode && (
                  <button
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-lg sm:rounded-xl transition-colors z-10 backdrop-blur-sm"
                  >
                    <Camera size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </div>

              <div className="mb-4">
                <h1 className="text-lg sm:text-xl md:text-2xl text-white font-bold gradient-text">u/{user.username}</h1>
                {(user.first_name || user.last_name) && (
                  <p className="text-zinc-400 text-sm sm:text-base">{user.first_name} {user.last_name}</p>
                )}
                {user.bio && <p className="text-xs sm:text-sm text-zinc-400 mt-2">{user.bio}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 py-4 border-t border-zinc-800/50">
                <div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats?.total_posts || 0}</p>
                  <p className="text-xs sm:text-sm text-white">Posts</p>
                </div>
                <button
                  onClick={() => {
                    setShowFollowersModal(true);
                    fetchFollowers();
                  }}
                  className="hover:opacity-80 transition-opacity text-left"
                >
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats?.followers_count || 0}</p>
                  <p className="text-xs sm:text-sm text-white">Followers</p>
                </button>
                <button
                  onClick={() => {
                    setShowFollowingModal(true);
                    fetchFollowing();
                  }}
                  className="hover:opacity-80 transition-opacity text-left"
                >
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats?.following_count || 0}</p>
                  <p className="text-xs sm:text-sm text-white">Following</p>
                </button>
                <div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats?.member_of || 0}</p>
                  <p className="text-xs sm:text-sm text-white">Communities</p>
                </div>
              </div>

              <div className="flex gap-4 sm:gap-6 pt-4 border-t border-zinc-800/50 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`relative flex items-center gap-2 text-xs sm:text-sm font-semibold pb-2 whitespace-nowrap transition-colors ${
                    activeTab === 'overview'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <TrendingUp size={16} className="sm:w-4 sm:h-4" />
                  <span>Overview</span>
                  {activeTab === 'overview' && (
                    <motion.div
                      layoutId="profileActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white to-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`relative flex items-center gap-2 text-xs sm:text-sm font-semibold pb-2 whitespace-nowrap transition-colors ${
                    activeTab === 'posts'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <FileText size={16} className="sm:w-4 sm:h-4" />
                  <span>Posts</span>
                  {activeTab === 'posts' && (
                    <motion.div
                      layoutId="profileActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white to-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`relative flex items-center gap-2 text-xs sm:text-sm font-semibold pb-2 whitespace-nowrap transition-colors ${
                    activeTab === 'comments'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <MessageSquare size={16} className="sm:w-4 sm:h-4" />
                  <span>Comments</span>
                  {activeTab === 'comments' && (
                    <motion.div
                      layoutId="profileActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white to-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
                  <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2 text-white">
                    <Users size={18} className="text-white sm:w-5 sm:h-5" />
                    Active in Communities
                  </h3>
                  {stats?.communities && stats.communities.length > 0 ? (
                    <div className="space-y-2">
                      {stats.communities.map((community) => (
                        <button
                          key={community.slug}
                          onClick={() => router.push(`/communities/${community.slug}`)}
                          className="w-full flex items-center justify-between p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl transition-colors group text-white"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-white to-white flex items-center justify-center text-white font-bold text-sm sm:text-base">
                              {community.name[0].toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm sm:text-base group-hover:text-white transition-colors">c/{community.name}</p>
                              <p className="text-xs sm:text-sm text-zinc-500">{community.post_count} posts</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-white/20 flex items-center justify-center">
                        <Users size={24} className="text-white sm:w-8 sm:h-8" />
                      </div>
                      <p className="text-zinc-400 mb-4 text-sm sm:text-base">No community activity yet</p>
                      <button
                        onClick={() => router.push('/communities')}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-white to-white hover:from-white hover:to-white text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/40 hover:scale-105 text-sm sm:text-base"
                      >
                        Explore Communities
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {posts.length === 0 ? (
                  <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-white/20 flex items-center justify-center">
                      <FileText size={32} className="text-white sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 gradient-text">No posts yet</h3>
                    <p className="text-zinc-400 mb-6 sm:mb-8 text-sm sm:text-base">Start sharing your thoughts!</p>
                    <button
                      onClick={() => router.push('/communities')}
                      className="px-6 sm:px-8 py-2 sm:py-3 bg-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-black text-sm sm:text-base"
                    >
                      Browse Communities
                    </button>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl hover:border-white/50 transition-all duration-300 overflow-hidden group"
                    >
                      <div className="p-3 sm:p-4">
                        <div 
                          onClick={() => router.push(`/posts/${post.id}`)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-2 sm:mb-3">
                            <span
                              className="hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/communities/${post.community_slug}`);
                              }}
                            >
                              c/{post.community_name}
                            </span>
                            <span>•</span>
                            <span>{formatTime(post.created_at)}</span>
                          </div>

                          {post.title && (
                            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">{post.title}</h2>
                          )}

                          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-2 sm:mb-3">{post.content}</p>

                          {getImageUrl(post.image) && (
                            <div className="mb-2 sm:mb-3 rounded-xl overflow-hidden">
                              <Image
                                src={getImageUrl(post.image)!}
                                alt="Post"
                                width={600}
                                height={400}
                                className="w-full max-h-[200px] sm:max-h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          )}
                        </div>

                        {/* ✅ UPDATED: Clickable heart with like functionality */}
                        <div className="flex items-center gap-4 text-xs sm:text-sm">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await api.post(`/posts/${post.id}/like/`);
                                setPosts(prev => prev.map(p => 
                                  p.id === post.id 
                                    ? { ...p, is_liked: response.data.liked, likes_count: response.data.likes_count }
                                    : p
                                ));
                              } catch (error) {
                                showToast('Failed to update like', 'error');
                              }
                            }}
                            className={`flex items-center gap-1 transition-all hover:scale-110 ${
                              post.is_liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'
                            }`}
                          >
                            <Heart 
                              size={16} 
                              className="sm:w-4 sm:h-4" 
                              fill={post.is_liked ? 'currentColor' : 'none'}
                            />
                            <span>{post.likes_count}</span>
                          </button>
                          <div className="flex items-center gap-1 text-zinc-500">
                            <MessageSquare size={16} className="sm:w-4 sm:h-4" />
                            <span>{post.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'comments' && (
              <motion.div
                key="comments"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {comments.length === 0 ? (
                  <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-white/20 flex items-center justify-center">
                      <MessageSquare size={32} className="text-white sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 gradient-text">No comments yet</h3>
                    <p className="text-zinc-400 text-sm sm:text-base">Join the conversation!</p>
                  </div>
                ) : (
                  comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => router.push(`/posts/${comment.post}`)}
                      className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-3 sm:p-4 hover:border-white/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-2">
                        <span
                          className="hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/communities/${comment.community_slug}`);
                          }}
                        >
                          c/{comment.community_name}
                        </span>
                        <span>•</span>
                        <span>{formatTime(comment.created_at)}</span>
                      </div>

                      <p className="text-zinc-100 mb-2 sm:mb-3 text-sm sm:text-base">{comment.content}</p>

                      <div className="flex items-center gap-1 text-xs sm:text-sm text-zinc-500">
                        <Heart size={14} className="text-red-400 sm:w-4 sm:h-4" fill={comment.is_liked ? 'currentColor' : 'none'} />
                        <span>{comment.likes_count} likes</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                  <Sparkles size={18} className="text-white" />
                  Profile
                </h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="p-2 hover:bg-zinc-800/50 rounded-xl transition-colors"
                >
                  <Settings size={18} />
                </button>
              </div>

              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setProfilePicture(null);
                        setCoverImage(null);
                        setProfilePreview(getImageUrl(user.profile_picture));
                        setCoverPreview(getImageUrl(user.cover_image));
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-800/50 text-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-black"
                    >
                      {updating ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <User size={16} />
                    <span>u/{user.username}</span>
                  </div>
                  {(user.first_name || user.last_name) && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <User size={16} />
                      <span>{user.first_name} {user.last_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail size={16} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar size={16} />
                    <span>Joined {formatTime(user.date_joined || new Date().toISOString())}</span>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg mb-4 text-white">Security</h3>
              
              {!showPasswordForm ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-white"
                  >
                    Change Password
                  </button>
                  
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-semibold transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 px-4 py-2 bg-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors text-black"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </aside>
      </div>
    </div>
  );
}
