// frontend/src/app/users/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Post, Comment, FollowUser } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { 
  User as UserIcon,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,  
  ArrowBigUp,
  Users,
  UserPlus,
  UserMinus,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';


interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}


interface PublicUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  cover_image?: string;
  date_joined: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_own_profile: boolean;
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
}


interface UserComment extends Comment {
  post_title?: string;
  community_name?: string;
  community_slug?: string;
}


export default function PublicUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;


  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments'>('overview');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [following, setFollowing] = useState(false);


  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);


  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };


  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userId]);


  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/auth/users/${userId}/`);
      setProfileUser(response.data);
      setFollowing(response.data.is_following);
      
      if (response.data.is_own_profile) {
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast('User not found', 'error');
    } finally {
      setLoading(false);
    }
  };


  const fetchUserPosts = async () => {
    try {
      const [postsRes, commentsRes] = await Promise.all([
        api.get(`/posts/user/${userId}/`).catch(() => ({ data: [] })),
        api.get(`/auth/comments/`).catch(() => ({ data: [] }))
      ]);


      setPosts(postsRes.data);
      setComments(commentsRes.data);


      const communitiesMap = new Map();
      postsRes.data.forEach((post: Post) => {
        if (!communitiesMap.has(post.community_slug)) {
          communitiesMap.set(post.community_slug, {
            name: post.community_name,
            slug: post.community_slug,
            post_count: 0
          });
        }
        communitiesMap.get(post.community_slug).post_count++;
      });


      setStats({
        total_posts: postsRes.data.length,
        total_comments: commentsRes.data.length,
        communities: Array.from(communitiesMap.values()),
        member_of: communitiesMap.size
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };


  const fetchFollowers = async () => {
    try {
      const response = await api.get(`/auth/users/${userId}/followers/`);
      setFollowers(response.data);
    } catch (error) {
      showToast('Failed to load followers', 'error');
    }
  };


  const fetchFollowing = async () => {
    try {
      const response = await api.get(`/auth/users/${userId}/following/`);
      setFollowingList(response.data);
    } catch (error) {
      showToast('Failed to load following', 'error');
    }
  };


  const handleFollowToggle = async (targetUserId?: number) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }


    const userToFollow = targetUserId || profileUser?.id;
    if (!userToFollow) return;


    try {
      await api.post(`/auth/users/${userToFollow}/follow/`);
      
      if (!targetUserId && profileUser) {
        setFollowing(!following);
        setProfileUser({
          ...profileUser,
          followers_count: following 
            ? profileUser.followers_count - 1 
            : profileUser.followers_count + 1,
          is_following: !following
        });
      }
      
      setFollowers(prev => prev.map(f => 
        f.id === userToFollow ? { ...f, is_following: !f.is_following } : f
      ));
      setFollowingList(prev => prev.map(f => 
        f.id === userToFollow ? { ...f, is_following: !f.is_following } : f
      ));
      
      showToast(
        targetUserId 
          ? (followers.find(f => f.id === targetUserId)?.is_following || followingList.find(f => f.id === targetUserId)?.is_following ? 'Unfollowed' : 'Followed')
          : (following ? 'Unfollowed' : 'Followed'),
        'success'
      );
    } catch (error) {
      showToast('Failed to update follow', 'error');
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


  if (loading || !profileUser) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-zinc-950 pb-20 lg:pb-0">
      <Navbar />


      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}


      {/* Modals */}
      <Modal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title={`Followers (${profileUser.followers_count})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {followers.map((follower) => (
            <div key={follower.id} className="flex items-center justify-between p-3 glass-effect bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-xl">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowersModal(false);
                  router.push(`/users/${follower.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-950 font-bold overflow-hidden">
                  {follower.profile_picture ? (
                    <Image src={getImageUrl(follower.profile_picture)!} alt={follower.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    follower.username[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100 truncate">u/{follower.username}</p>
                  {(follower.first_name || follower.last_name) && (
                    <p className="text-sm text-zinc-500 truncate">{follower.first_name} {follower.last_name}</p>
                  )}
                </div>
              </div>
              {currentUser && follower.id !== currentUser.id && (
                <button
                  onClick={() => handleFollowToggle(follower.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    follower.is_following
                      ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-100'
                      : 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-lg shadow-white/20'
                  }`}
                >
                  {follower.is_following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>


      <Modal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title={`Following (${profileUser.following_count})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {followingList.map((followingUser) => (
            <div key={followingUser.id} className="flex items-center justify-between p-3 glass-effect bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-xl">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowingModal(false);
                  router.push(`/users/${followingUser.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-950 font-bold overflow-hidden">
                  {followingUser.profile_picture ? (
                    <Image src={getImageUrl(followingUser.profile_picture)!} alt={followingUser.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    followingUser.username[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100 truncate">u/{followingUser.username}</p>
                  {(followingUser.first_name || followingUser.last_name) && (
                    <p className="text-sm text-zinc-500 truncate">{followingUser.first_name} {followingUser.last_name}</p>
                  )}
                </div>
              </div>
              {currentUser && followingUser.id !== currentUser.id && (
                <button
                  onClick={() => handleFollowToggle(followingUser.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    followingUser.is_following
                      ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-100'
                      : 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-lg shadow-white/20'
                  }`}
                >
                  {followingUser.is_following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>


      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />


        <main className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl mb-4 overflow-hidden"
          >
            {/* Cover Image - Fixed overlap issue */}
            <div className="relative">
              <div className="h-40 sm:h-48 bg-gradient-to-r from-white/10 to-white/5 relative">
                {profileUser.cover_image && (
                  <Image 
                    src={getImageUrl(profileUser.cover_image)!} 
                    alt="Cover" 
                    fill 
                    className="object-cover" 
                  />
                )}
                {/* Add gradient overlay to ensure profile picture stands out */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 to-transparent" />
              </div>
            </div>
            
            <div className="px-4 sm:px-6 pb-4">
              {/* Profile Picture - Fixed overlap with proper positioning */}
              <div className="flex justify-start -mt-16 sm:-mt-20 mb-4 relative z-10">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-zinc-900 bg-white flex items-center justify-center text-zinc-950 text-2xl sm:text-3xl font-bold overflow-hidden shadow-2xl shadow-white/30">
                  {profileUser.profile_picture ? (
                    <Image 
                      src={getImageUrl(profileUser.profile_picture)!} 
                      alt={profileUser.username} 
                      width={112} 
                      height={112} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    profileUser.username[0].toUpperCase()
                  )}
                </div>
              </div>


              {/* Username and Follow Button */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">u/{profileUser.username}</h1>
                  {(profileUser.first_name || profileUser.last_name) && (
                    <p className="text-zinc-400 mt-1 text-sm sm:text-base truncate">{profileUser.first_name} {profileUser.last_name}</p>
                  )}
                  {profileUser.bio && (
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 line-clamp-2">{profileUser.bio}</p>
                  )}
                </div>


                {currentUser && currentUser.id !== profileUser.id && (
                  <button
                    onClick={() => handleFollowToggle()}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                      following
                        ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-100 border border-zinc-700/50'
                        : 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-lg shadow-white/30 hover:shadow-white/50 hover:scale-105'
                    }`}
                  >
                    {following ? (
                      <>
                        <UserMinus size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>


              {/* Stats - Grid on mobile, flex on desktop */}
              <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 py-4 border-t border-zinc-800/50">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats?.total_posts || 0}</p>
                  <p className="text-xs sm:text-sm text-white">Posts</p>
                </div>
                <button
                  onClick={() => {
                    setShowFollowersModal(true);
                    fetchFollowers();
                  }}
                  className="hover:opacity-80 transition-opacity text-left"
                >
                  <p className="text-xl sm:text-2xl font-bold text-white">{profileUser.followers_count}</p>
                  <p className="text-xs sm:text-sm text-white">Followers</p>
                </button>
                <button
                  onClick={() => {
                    setShowFollowingModal(true);
                    fetchFollowing();
                  }}
                  className="hover:opacity-80 transition-opacity text-left"
                >
                  <p className="text-xl sm:text-2xl font-bold text-white">{profileUser.following_count}</p>
                  <p className="text-xs sm:text-sm text-white">Following</p>
                </button>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats?.member_of || 0}</p>
                  <p className="text-xs sm:text-sm text-white">Communities</p>
                </div>
              </div>


              {/* Tabs - Scrollable on mobile */}
              <div className="flex gap-4 sm:gap-6 pt-4 border-t border-zinc-800/50 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'posts'
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Posts</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'comments'
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Comments</span>
                </button>
              </div>
            </div>
          </motion.div>


          {/* Content Sections */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-4 text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                  <span>Active in Communities</span>
                </h3>
                {stats?.communities && stats.communities.length > 0 ? (
                  <div className="space-y-2">
                    {stats.communities.map((community) => (
                      <button
                        key={community.slug}
                        onClick={() => router.push(`/communities/${community.slug}`)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 glass-effect bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-white/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-white/20 flex-shrink-0">
                            {community.name[0].toUpperCase()}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base text-white group-hover:text-white transition-colors truncate">c/{community.name}</p>
                            <p className="text-xs sm:text-sm text-zinc-500">{community.post_count} posts</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                      <Sparkles size={24} className="text-white sm:w-[32px] sm:h-[32px]" />
                    </div>
                    <p className="text-sm sm:text-base text-zinc-500">No community activity yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {activeTab === 'posts' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {posts.length === 0 ? (
                <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                    <FileText size={24} className="text-white sm:w-[32px] sm:h-[32px]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">No posts yet</h3>
                  <p className="text-sm sm:text-base text-zinc-500">This user hasn't posted anything</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => router.push(`/posts/${post.id}`)}
                    className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 hover:border-white/30 rounded-2xl transition-all cursor-pointer overflow-hidden group"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-2">
                        <span
                          className="hover:text-white transition-colors truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/communities/${post.community_slug}`);
                          }}
                        >
                          c/{post.community_name}
                        </span>
                        <span>•</span>
                        <span className="whitespace-nowrap">{formatTime(post.created_at)}</span>
                      </div>


                      {post.title && (
                        <h2 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors line-clamp-2">{post.title}</h2>
                      )}


                      <p className="text-sm text-zinc-300 line-clamp-2 mb-3">{post.content}</p>


                      {getImageUrl(post.image) && (
                        <div className="mb-3 rounded-xl overflow-hidden">
                          <Image
                            src={getImageUrl(post.image)!}
                            alt="Post"
                            width={600}
                            height={400}
                            className="w-full max-h-[200px] sm:max-h-[300px] object-cover"
                          />
                        </div>
                      )}


                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <ArrowBigUp size={14} className="text-white sm:w-4 sm:h-4" />
                          <span>{post.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                          <span>{post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </motion.div>
          )}


          {activeTab === 'comments' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {comments.length === 0 ? (
                <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                    <MessageSquare size={24} className="text-white sm:w-[32px] sm:h-[32px]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">No comments yet</h3>
                  <p className="text-sm sm:text-base text-zinc-500">This user hasn't commented</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    onClick={() => router.push(`/posts/${comment.post}`)}
                    className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 hover:border-white/30 rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-2">
                      <span
                        className="hover:text-white transition-colors truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/communities/${comment.community_slug}`);
                        }}
                      >
                        c/{comment.community_name}
                      </span>
                      <span>•</span>
                      <span className="whitespace-nowrap">{formatTime(comment.created_at)}</span>
                    </div>


                    <p className="text-sm sm:text-base text-zinc-300 mb-2 group-hover:text-white transition-colors line-clamp-3">{comment.content}</p>


                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <ArrowBigUp size={12} className="text-white sm:w-[14px] sm:h-[14px]" />
                      <span>{comment.likes_count} likes</span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </main>


        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-white" />
                <span>About</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                    <UserIcon size={16} className="text-white" />
                  </div>
                  <span>u/{profileUser.username}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <span>Joined {formatTime(profileUser.date_joined)}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <span>{profileUser.followers_count} followers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </aside>
      </div>


      {/* Add custom scrollbar hide CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}