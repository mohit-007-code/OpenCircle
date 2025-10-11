// app/communities/[slug]/page.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Community, Post, CommunityMember } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { 
  Users, 
  Calendar, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Image as ImageIcon,
  X,
  Heart,
  MessageSquare,
  Share2,
  Shield,
  Crown,
  UserCog,
  Trash2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [memberToKick, setMemberToKick] = useState<{ id: number; username: string } | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  
  // Confirmation dropdown states
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (slug) {
      fetchCommunityData();
    }
  }, [slug]);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const [communityRes, postsRes, membersRes] = await Promise.all([
        api.get(`/communities/${slug}/`),
        api.get(`/posts/community/${slug}/`),
        api.get(`/communities/${slug}/members/`)
      ]);

      setCommunity(communityRes.data);
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      
      const membersData = membersRes.data?.results || membersRes.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
      
    } catch (error: any) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await api.post(`/communities/${slug}/join/`);
      fetchCommunityData();
      showToast('Successfully joined the community!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to join community', 'error');
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/communities/${slug}/leave/`);
      fetchCommunityData();
      setShowLeaveConfirm(false);
      showToast('Left the community', 'info');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to leave community', 'error');
      setShowLeaveConfirm(false);
    }
  };

  const handlePromoteMember = async (userId: number) => {
    try {
      await api.post(`/communities/${slug}/members/${userId}/promote/`);
      fetchCommunityData();
      setSelectedMember(null);
      showToast('Member promoted to moderator!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to promote member', 'error');
    }
  };

  const handleDemoteMember = async (userId: number) => {
    try {
      await api.post(`/communities/${slug}/members/${userId}/demote/`);
      fetchCommunityData();
      setSelectedMember(null);
      showToast('Member demoted to regular member', 'info');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to demote member', 'error');
    }
  };

  const handleKickMember = async () => {
    if (!memberToKick) return;
    
    try {
      await api.post(`/communities/${slug}/members/${memberToKick.id}/kick/`);
      fetchCommunityData();
      setSelectedMember(null);
      setMemberToKick(null);
      showToast(`${memberToKick.username} has been removed`, 'warning');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to remove member', 'error');
      setMemberToKick(null);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await api.delete(`/posts/${postId}/`);
      fetchCommunityData();
      setShowDeleteConfirm(null);
      showToast('Post deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete post', 'error');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setPosting(true);
    const formData = new FormData();
    formData.append('title', postTitle);
    formData.append('content', postContent);
    if (postImage) formData.append('image', postImage);

    try {
      await api.post(`/posts/community/${slug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPostTitle('');
      setPostContent('');
      setPostImage(null);
      setImagePreview(null);
      setShowCreatePost(false);
      fetchCommunityData();
      showToast('Post created successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to create post', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/like/`);
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked: response.data.liked,
              likes_count: response.data.likes_count 
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
      showToast('Failed to update vote', 'error');
    }
  };

  const handleShare = async (postId: number) => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
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
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getRoleBadge = (role: string, isCreator: boolean) => {
    if (isCreator) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-semibold">
          <Crown size={12} />
          <span>Creator</span>
        </div>
      );
    }
    if (role === 'admin') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
          <Shield size={12} />
          <span>Admin</span>
        </div>
      );
    }
    if (role === 'moderator') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 rounded-lg text-xs font-semibold">
          <Shield size={12} />
          <span>Mod</span>
        </div>
      );
    }
    return null;
  };

  const PostSkeleton = () => (
    <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-4 py-20">
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

  if (!community) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
              <Users size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Community not found</h2>
            <p className="text-zinc-400 mb-8">This community doesn't exist or has been removed</p>
            <button
              onClick={() => router.push('/communities')}
              className="px-8 py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
            >
              Browse Communities
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal
        isOpen={memberToKick !== null}
        onClose={() => setMemberToKick(null)}
        onConfirm={handleKickMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToKick?.username} from this community?`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />

      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />
        
        <div className="flex-1 min-w-0">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-5 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </motion.button>

          {/* ✨ MOBILE RESPONSIVE BANNER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6 rounded-2xl overflow-hidden"
          >
            {/* Cover Image */}
            <div className="h-32 sm:h-40 md:h-48 bg-white relative">
              {getImageUrl(community.cover_image) && (
                <Image
                  src={getImageUrl(community.cover_image)!}
                  alt={community.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="px-3 sm:px-4 md:px-6">
              <div className="relative">
                {/* Display Picture */}
                <div className="absolute -top-10 sm:-top-12 md:-top-16 left-0 w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-zinc-950 bg-white overflow-hidden shadow-2xl shadow-white/20">
                  {getImageUrl(community.display_picture) ? (
                    <Image
                      src={getImageUrl(community.display_picture)!}
                      alt={community.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl md:text-4xl font-bold text-zinc-950">
                      {community.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Community Info and Buttons */}
                <div className="pt-2 sm:pt-3 md:pt-4 pb-4 pl-20 sm:pl-24 md:pl-36">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Community Name and Description */}
                    <div className="flex-1 min-w-0 pr-2">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 text-white truncate">
                        c/{community.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">{community.description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      {community.is_creator ? (
                        <button
                          onClick={() => router.push(`/communities/${slug}/edit`)}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
                        >
                          <Settings size={16} className="sm:w-[18px] text-white sm:h-[18px]" />
                          <span className="hidden sm:inline text-white">Manage</span>
                        </button>
                      ) : community.is_member ? (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLeaveConfirm(!showLeaveConfirm);
                            }}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-red-400 hover:text-red-300 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap"
                          >
                            <UserMinus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Leave</span>
                          </button>

                          {/* LEAVE CONFIRMATION DROPDOWN */}
                          {showLeaveConfirm && (
                            <div className="absolute right-0 mt-2 w-44 sm:w-48 glass-effect bg-zinc-900 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeave();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-3 hover:bg-zinc-800/50 transition-all text-sm text-red-400 hover:text-red-300 font-semibold"
                              >
                                <Trash2 size={16} />
                                <span>Sure? Leave</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={handleJoin}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105 whitespace-nowrap"
                        >
                          <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
                          <span>Join</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 mb-5"
          >
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`relative text-sm font-semibold pb-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Posts
                {activeTab === 'posts' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`relative text-sm font-semibold pb-2 transition-colors ${
                  activeTab === 'members'
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Members ({community.member_count})
                {activeTab === 'members' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'posts' ? (
              <motion.div
                key="posts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pb-24 lg:pb-0"
              >
                {community.is_member && (
                  <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4">
                    {!showCreatePost ? (
                      <button
                        onClick={() => setShowCreatePost(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left text-zinc-400 transition-all duration-300"
                      >
                        {user?.profile_picture ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={getImageUrl(user.profile_picture)!}
                              alt={user.username}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-zinc-950 font-semibold">
                            {user?.username[0].toUpperCase()}
                          </div>
                        )}
                        <span>Create Post</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCreatePost} className="space-y-3">
                        <input
                          type="text"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          placeholder="Post Title"
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300"
                          required
                        />

                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 resize-none"
                          rows={4}
                          required
                        />

                        {imagePreview && (
                          <div className="relative inline-block">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={300}
                              height={200}
                              className="rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPostImage(null);
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 p-2 bg-black/70 rounded-xl hover:bg-black/90 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-xl transition-all text-sm text-zinc-400 hover:text-white">
                            <ImageIcon size={18} />
                            <span>Add Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageSelect}
                            />
                          </label>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreatePost(false);
                                setPostTitle('');
                                setPostContent('');
                                setPostImage(null);
                                setImagePreview(null);
                              }}
                              className="px-4 py-2 hover:bg-zinc-800/50 rounded-xl text-sm font-semibold transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={posting || !postTitle.trim() || !postContent.trim()}
                              className="px-6 py-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30"
                            >
                              {posting ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {posts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-12 text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
                      <MessageSquare size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">No posts yet</h3>
                    <p className="text-zinc-400">Be the first to post in this community!</p>
                  </motion.div>
                ) : (
                  posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => router.push(`/posts/${post.id}`)}
                      className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl hover:border-white/30 transition-all duration-300 overflow-hidden cursor-pointer group"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                            {post.author.profile_picture ? (
                              <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={getImageUrl(post.author.profile_picture)!}
                                  alt={post.author.username}
                                  width={24}
                                  height={24}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-zinc-950 text-[10px] font-bold">
                                {post.author.username[0].toUpperCase()}
                              </div>
                            )}
                            <span>Posted by</span>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/users/${post.author.id}`);
                              }}
                              className="hover:text-white cursor-pointer font-semibold transition-colors"
                            >
                              u/{post.author.username}
                            </span>
                            <span>•</span>
                            <span>{formatTime(post.created_at)}</span>
                          </div>

                          {/* DELETE BUTTON WITH CONFIRMATION DROPDOWN */}
                          {post.can_delete && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(showDeleteConfirm === post.id ? null : post.id);
                                }}
                                className="p-2 hover:bg-zinc-800/50 rounded-xl text-zinc-500 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>

                              {/* DELETE CONFIRMATION DROPDOWN */}
                              {showDeleteConfirm === post.id && (
                                <div className="absolute right-0 mt-2 w-40 glass-effect bg-zinc-900 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePost(post.id);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-zinc-800/50 transition-all text-sm text-red-400 hover:text-red-300 font-semibold"
                                  >
                                    <Trash2 size={16} />
                                    <span>Sure? Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <h2 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2 hover:text-white transition-colors line-clamp-2">
                          {post.title || post.content}
                        </h2>

                        {post.title && (
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-3">{post.content}</p>
                        )}

                        {getImageUrl(post.image) && (
                          <div className="mb-4 rounded-xl overflow-hidden group/image">
                            <Image
                              src={getImageUrl(post.image)!}
                              alt="Post"
                              width={600}
                              height={400}
                              className="w-full max-h-[400px] object-cover transition-transform duration-300 group-hover/image:scale-105"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(post.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-zinc-800/50 transition-all duration-300 text-sm font-medium group/like ${
                              post.is_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                            }`}
                          >
                            <Heart 
                              size={18} 
                              fill={post.is_liked ? 'currentColor' : 'none'}
                              className="group-hover/like:scale-110 transition-transform" 
                            />
                            <span>{post.likes_count}</span>
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/posts/${post.id}`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-zinc-800/50 transition-all duration-300 text-sm font-medium text-zinc-400 hover:text-white group/comment"
                          >
                            <MessageSquare size={18} className="group-hover/comment:scale-110 transition-transform" />
                            <span>{post.comments_count}</span>
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(post.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-zinc-800/50 transition-all duration-300 text-sm font-medium group/share ${
                              copiedPostId === post.id ? 'text-green-500' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Share2 size={18} className="group-hover/share:scale-110 transition-transform" />
                            <span className="hidden sm:inline">
                              {copiedPostId === post.id ? 'Copied!' : 'Share'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6"
              >
                <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-white">
                  <Users size={20} className="text-white" />
                  Members ({members.length})
                </h3>
                
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Users size={32} className="text-white" />
                    </div>
                    <p className="text-zinc-400">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member, index) => {
                      const isCreator = community.creator_id === member.user.id;
                      const canManage = community.can_manage_members && !isCreator && member.user.id !== user?.id;

                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-all group"
                        >
                          <div 
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => router.push(`/users/${member.user.id}`)}
                          >
                            {member.user.profile_picture ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                                <Image
                                  src={getImageUrl(member.user.profile_picture)!}
                                  alt={member.user.username}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-zinc-950 font-semibold shadow-lg">
                                {member.user.username[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white hover:text-zinc-300 transition-colors truncate">
                                u/{member.user.username}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {getRoleBadge(member.role, isCreator)}
                                <span className="text-xs text-zinc-500">
                                  Joined {formatTime(member.joined_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {canManage && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMember(selectedMember?.id === member.id ? null : member);
                                }}
                                className="p-2 hover:bg-zinc-700/50 rounded-xl transition-all"
                              >
                                <Shield size={18} />
                              </button>

                              {selectedMember?.id === member.id && (
                                <div className="absolute right-0 mt-2 w-56 glass-effect bg-zinc-900 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl z-10 overflow-hidden">
                                  {member.role === 'member' && (
                                    <button
                                      onClick={() => handlePromoteMember(member.user.id)}
                                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-all text-sm"
                                    >
                                      <Shield size={16} />
                                      <span>Promote to Moderator</span>
                                    </button>
                                  )}

                                  {member.role === 'moderator' && community.is_creator && (
                                    <button
                                      onClick={() => handleDemoteMember(member.user.id)}
                                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-all text-sm"
                                    >
                                      <UserCog size={16} />
                                      <span>Demote to Member</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setMemberToKick({ id: member.user.id, username: member.user.username })}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-all text-sm text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={16} />
                                    <span>Remove from Community</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                <Sparkles size={18} className="text-white" />
                About Community
              </h3>
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{community.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm p-3 bg-zinc-800/30 rounded-xl">
                  <Users size={18} className="text-white" />
                  <span className="font-semibold text-zinc-100">{community.member_count.toLocaleString()}</span>
                  <span className="text-white">Members</span>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 bg-zinc-800/30 rounded-xl">
                  <Crown size={18} className="text-yellow-500" />
                  <span className="text-zinc-500">Created by</span>
                  <span 
                    onClick={() => router.push(`/users/${community.creator_id}`)}
                    className="font-semibold text-white hover:text-zinc-300 cursor-pointer transition-colors"
                  >
                    u/{members.find(m => m.user.id === community.creator_id)?.user.username || 'Creator'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 bg-zinc-800/30 rounded-xl">
                  <Calendar size={18} className="text-zinc-400" />
                  <span className="text-zinc-500">Created {formatTime(community.created_at)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </aside>
      </div>
    </div>
  );
}
