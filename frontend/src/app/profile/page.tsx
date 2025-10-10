// frontend/src/app/profile/page.tsx
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
  ArrowBigUp,
  Camera,
} from 'lucide-react';

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
  const { user, setUser, loading: authLoading } = useAuth();
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0b0f14]">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-[#d93900] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f14]">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-[#d93900] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14]">
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
            <div key={follower.id} className="flex items-center justify-between p-3 bg-[#272729] rounded">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowersModal(false);
                  router.push(`/users/${follower.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold overflow-hidden">
                  {follower.profile_picture ? (
                    <Image src={getImageUrl(follower.profile_picture)!} alt={follower.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    follower.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">u/{follower.username}</p>
                  {(follower.first_name || follower.last_name) && (
                    <p className="text-sm text-[#818384]">{follower.first_name} {follower.last_name}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFollower(follower.id);
                }}
                disabled={removingFollowerId === follower.id}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingFollowerId === follower.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
          {followers.length === 0 && (
            <p className="text-center text-[#818384] py-8">No followers yet</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title={`Following (${stats?.following_count || 0})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {following.map((followingUser) => (
            <div key={followingUser.id} className="flex items-center justify-between p-3 bg-[#272729] rounded">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowingModal(false);
                  router.push(`/users/${followingUser.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold overflow-hidden">
                  {followingUser.profile_picture ? (
                    <Image src={getImageUrl(followingUser.profile_picture)!} alt={followingUser.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    followingUser.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">u/{followingUser.username}</p>
                  {(followingUser.first_name || followingUser.last_name) && (
                    <p className="text-sm text-[#818384]">{followingUser.first_name} {followingUser.last_name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleFollowToggle(followingUser.id, true)}
                className="px-4 py-1.5 bg-[#272729] hover:bg-[#343536] rounded-full font-semibold text-sm transition-colors"
              >
                Unfollow
              </button>
            </div>
          ))}
          {following.length === 0 && (
            <p className="text-center text-[#818384] py-8">Not following anyone yet</p>
          )}
        </div>
      </Modal>

      <div className="max-w-[1400px] mx-auto flex gap-3 px-3 pt-4 pb-5">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg mb-4 overflow-hidden">
            {/* Cover Image */}
            <div className="relative">
              <div className="h-48 bg-gradient-to-r from-[#d93900] to-[#a62d00] relative">
                {coverPreview && (
                  <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                )}
                {editMode && (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                  >
                    <Camera size={20} />
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageChange}
                />
              </div>
            </div>
            
            <div className="px-6 pb-4">
              {/* Profile Picture - Overlapping Banner (COMMUNITY STYLE) */}
              <div className="-mt-16 mb-4 relative">
                <div className="w-28 h-28 rounded-full border-4 border-[#1a1a1b] bg-[#d93900] flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-xl">
                  {profilePreview ? (
                    <Image src={profilePreview} alt={user.username} width={112} height={112} className="object-cover w-full h-full" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                {editMode && (
                  <button
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                  >
                    <Camera size={16} />
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

              {/* Username and Details (BELOW DP) */}
              <div>
                <h1 className="text-2xl font-bold">u/{user.username}</h1>
                {(user.first_name || user.last_name) && (
                  <p className="text-[#818384]">{user.first_name} {user.last_name}</p>
                )}
                {user.bio && <p className="text-sm text-[#818384] mt-1">{user.bio}</p>}
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t border-[#343536]">
                <div>
                  <p className="text-2xl font-bold">{stats?.total_posts || 0}</p>
                  <p className="text-sm text-[#818384]">Posts</p>
                </div>
                <button
                  onClick={() => {
                    setShowFollowersModal(true);
                    fetchFollowers();
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold">{stats?.followers_count || 0}</p>
                  <p className="text-sm text-[#818384]">Followers</p>
                </button>
                <button
                  onClick={() => {
                    setShowFollowingModal(true);
                    fetchFollowing();
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold">{stats?.following_count || 0}</p>
                  <p className="text-sm text-[#818384]">Following</p>
                </button>
                <div>
                  <p className="text-2xl font-bold">{stats?.member_of || 0}</p>
                  <p className="text-sm text-[#818384]">Communities</p>
                </div>
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t border-[#343536]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-[#d93900] text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  <TrendingUp size={18} />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-[#d93900] text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  <FileText size={18} />
                  <span>Posts</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-[#d93900] text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  <MessageSquare size={18} />
                  <span>Comments</span>
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
                <h3 className="font-semibold mb-4">Active in Communities</h3>
                {stats?.communities && stats.communities.length > 0 ? (
                  <div className="space-y-2">
                    {stats.communities.map((community) => (
                      <button
                        key={community.slug}
                        onClick={() => router.push(`/communities/${community.slug}`)}
                        className="w-full flex items-center justify-between p-3 bg-[#272729] hover:bg-[#343536] rounded transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold">
                            {community.name[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">c/{community.name}</p>
                            <p className="text-sm text-[#818384]">{community.post_count} posts</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#818384]">No community activity yet</p>
                    <button
                      onClick={() => router.push('/communities')}
                      className="mt-4 px-6 py-2 bg-[#d93900] hover:bg-[#c13300] text-white rounded-full font-semibold transition-colors"
                    >
                      Explore Communities
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-[#818384]" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-[#818384] mb-4">Start sharing your thoughts!</p>
                  <button
                    onClick={() => router.push('/communities')}
                    className="px-6 py-2 bg-[#d93900] hover:bg-[#c13300] text-white rounded-full font-semibold transition-colors"
                  >
                    Browse Communities
                  </button>
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => router.push(`/posts/${post.id}`)}
                    className="bg-[#1a1a1b] border border-[#343536] rounded-lg hover:border-[#474748] transition-colors cursor-pointer overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-[#818384] mb-2">
                        <span
                          className="hover:underline"
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
                        <h2 className="text-lg font-semibold text-[#d7dadc] mb-2">{post.title}</h2>
                      )}

                      <p className="text-sm text-[#d7dadc] line-clamp-2 mb-3">{post.content}</p>

                      {getImageUrl(post.image) && (
                        <div className="mb-3 rounded overflow-hidden">
                          <Image
                            src={getImageUrl(post.image)!}
                            alt="Post"
                            width={600}
                            height={400}
                            className="w-full max-h-[300px] object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[#818384]">
                        <div className="flex items-center gap-1">
                          <ArrowBigUp size={16} />
                          <span>{post.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={16} />
                          <span>{post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 text-[#818384]" />
                  <h3 className="text-xl font-semibold mb-2">No comments yet</h3>
                  <p className="text-[#818384]">Join the conversation!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    onClick={() => router.push(`/posts/${comment.post}`)}
                    className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4 hover:border-[#474748] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-sm text-[#818384] mb-2">
                      <span
                        className="hover:underline"
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

                    <p className="text-[#d7dadc] mb-2">{comment.content}</p>

                    <div className="flex items-center gap-1 text-xs text-[#818384]">
                      <ArrowBigUp size={14} />
                      <span>{comment.likes_count} likes</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-16 pt-2 space-y-4">
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Profile</h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="p-2 hover:bg-[#272729] rounded transition-colors"
                >
                  <Settings size={18} />
                </button>
              </div>

              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[#818384] mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#818384] mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#818384] mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#818384] mb-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384] resize-none"
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
                      className="flex-1 px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-[#d93900] hover:bg-[#c13300] text-white rounded font-semibold disabled:opacity-50 transition-colors"
                    >
                      {updating ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-[#818384]">
                    <User size={16} />
                    <span>u/{user.username}</span>
                  </div>
                  {(user.first_name || user.last_name) && (
                    <div className="flex items-center gap-2 text-[#818384]">
                      <User size={16} />
                      <span>{user.first_name} {user.last_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#818384]">
                    <Mail size={16} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#818384]">
                    <Calendar size={16} />
                    <span>Joined {formatTime(user.date_joined || new Date().toISOString())}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-4">Security</h3>
              
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded font-semibold transition-colors"
                >
                  Change Password
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[#818384] mb-1">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#818384] mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#818384] mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] focus:outline-none focus:border-[#818384]"
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
                      className="flex-1 px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 px-4 py-2 bg-[#d93900] hover:bg-[#c13300] text-white rounded font-semibold transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
