// app/communities/[slug]/page.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Community, Post, CommunityMember } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { 
  Users, 
  Calendar, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Send,
  Image as ImageIcon,
  X,
  MoreVertical,
  Trash2,
  Heart,
  MessageCircle
} from 'lucide-react';

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
  
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

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
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
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
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join community');
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this community?')) {
      try {
        await api.post(`/communities/${slug}/leave/`);
        fetchCommunityData();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to leave community');
      }
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
    if (!postContent.trim()) return;

    setPosting(true);
    const formData = new FormData();
    formData.append('content', postContent);
    if (postImage) formData.append('image', postImage);

    try {
      await api.post(`/posts/community/${slug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPostContent('');
      setPostImage(null);
      setImagePreview(null);
      fetchCommunityData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${postId}/`);
        fetchCommunityData();
      } catch (error) {
        alert('Failed to delete post');
      }
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/like/`);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: response.data.liked, likes_count: response.data.likes_count }
          : post
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8000${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 w-full">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white w-full">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Community not found</h2>
          <p className="text-zinc-400 mb-8">The community you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/communities')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
          >
            Browse Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white w-full">
      <Navbar />

      {/* Cover Image */}
      <div className="w-full h-64 bg-gradient-to-br from-blue-600 to-purple-600 relative">
        {getImageUrl(community.cover_image) && (
          <Image
            src={getImageUrl(community.cover_image)!}
            alt={community.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Community Info */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 pb-6 border-b border-zinc-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Display Picture */}
              <div className="w-40 h-40 rounded-2xl border-4 border-zinc-950 bg-zinc-900 overflow-hidden shadow-xl">
                {getImageUrl(community.display_picture) ? (
                  <Image
                    src={getImageUrl(community.display_picture)!}
                    alt={community.name}
                    width={160}
                    height={160}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-zinc-600">
                    {community.name[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info & Actions */}
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{community.name}</h1>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Users size={18} />
                        <span>{community.member_count} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>Created {formatDate(community.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {community.is_creator ? (
                      <button
                        onClick={() => router.push(`/communities/${slug}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                      >
                        <Settings size={18} />
                        <span>Manage</span>
                      </button>
                    ) : community.is_member ? (
                      <button
                        onClick={handleLeave}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                      >
                        <UserMinus size={18} />
                        <span>Leave</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleJoin}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all hover:scale-105"
                      >
                        <UserPlus size={20} />
                        <span>Join Community</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-zinc-300 text-lg">{community.description}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-800 mt-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'posts'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'members'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Members ({community.member_count})
            </button>
          </div>

          {/* Content */}
          <div className="py-8">
            {activeTab === 'posts' ? (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Create Post */}
                {community.is_member && (
                  <form onSubmit={handleCreatePost} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-semibold flex-shrink-0">
                        {user?.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />

                        {imagePreview && (
                          <div className="mt-4 relative inline-block">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={300}
                              height={200}
                              className="rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPostImage(null);
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        <div className="mt-4 flex justify-between items-center">
                          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all text-sm">
                            <ImageIcon size={18} />
                            <span>Add Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageSelect}
                            />
                          </label>

                          <button
                            type="submit"
                            disabled={posting || !postContent.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {posting ? 'Posting...' : (
                              <>
                                <Send size={18} />
                                <span>Post</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* Posts Feed */}
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                    <MessageCircle size={48} className="mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400 text-lg">No posts yet</p>
                    <p className="text-zinc-500 text-sm mt-2">Be the first to share something!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-semibold">
                            {post.author.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{post.author.username}</p>
                            <p className="text-sm text-zinc-400">{formatDate(post.created_at)}</p>
                          </div>
                        </div>

                        {post.can_delete && (
                          <div className="relative group">
                            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                              <MoreVertical size={18} className="text-zinc-400" />
                            </button>
                            <div className="hidden group-hover:block absolute right-0 mt-1 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 min-w-[120px] z-10">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-zinc-700 transition-colors"
                              >
                                <Trash2 size={16} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-zinc-100 mb-4 whitespace-pre-wrap text-lg">{post.content}</p>

                      {getImageUrl(post.image) && (
                        <div className="rounded-lg overflow-hidden mb-4">
                          <Image
                            src={getImageUrl(post.image)!}
                            alt="Post image"
                            width={600}
                            height={400}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-6 pt-4 border-t border-zinc-800">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            post.is_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                          }`}
                        >
                          <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
                          <span className="font-medium">{post.likes_count}</span>
                        </button>
                        <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 transition-colors">
                          <MessageCircle size={20} />
                          <span className="font-medium">{post.comments_count}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-semibold">
                          {member.user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{member.user.username}</p>
                          <p className="text-sm text-zinc-400 capitalize">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
