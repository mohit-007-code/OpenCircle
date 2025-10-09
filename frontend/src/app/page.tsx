// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Post } from '@/types';
import Image from 'next/image';
import { Users, Shield, Zap, MessageSquare, Heart, User as UserIcon, Calendar } from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await api.get('/posts/feed/');
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      setPosts([]);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_65%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
            {user ? (
              <>
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {user.username}
                </span>
              </>
            ) : (
              <>
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  OpenCircle
                </span>
              </>
            )}
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Discover posts from communities around the world
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all hover:scale-105"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Feed Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Latest Posts</h2>
          <Link
            href="/communities"
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
          >
            Browse Communities →
          </Link>
        </div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
            <MessageSquare size={64} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
            <p className="text-zinc-400 mb-6">Be the first to create a post!</p>
            <Link
              href="/communities"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
            >
              Explore Communities
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all">
                {/* Post Header */}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    {/* Author Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-semibold flex-shrink-0">
                      {post.author.username[0].toUpperCase()}
                    </div>

                    {/* Author & Community Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{post.author.username}</p>
                        <span className="text-zinc-600">•</span>
                        <Link 
                          href={`/communities/${post.community_slug}`}
                          className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                        >
                          {post.community_name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                        <Calendar size={14} />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>

                    {/* Join Community Button */}
                    <Link
                      href={`/communities/${post.community_slug}`}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
                    >
                      View Community
                    </Link>
                  </div>

                  {/* Post Content */}
                  <p className="text-zinc-100 text-lg mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Post Image */}
                  {getImageUrl(post.image) && (
                    <div className="rounded-xl overflow-hidden mb-4">
                      <Image
                        src={getImageUrl(post.image)!}
                        alt="Post image"
                        width={800}
                        height={500}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.is_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                      }`}
                    >
                      <Heart size={22} fill={post.is_liked ? 'currentColor' : 'none'} />
                      <span className="font-medium">{post.likes_count}</span>
                    </button>

                    <Link
                      href={`/communities/${post.community_slug}`}
                      className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 transition-colors"
                    >
                      <MessageSquare size={22} />
                      <span className="font-medium">{post.comments_count}</span>
                    </Link>

                    <Link
                      href={`/communities/${post.community_slug}`}
                      className="flex items-center gap-2 text-zinc-400 hover:text-purple-500 transition-colors ml-auto"
                    >
                      <Users size={20} />
                      <span className="text-sm">Join Community</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section - Only for non-logged in users */}
      {!user && (
        <div className="border-t border-zinc-800 bg-zinc-900/50 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why OpenCircle?</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Users size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Global Community</h3>
                <p className="text-zinc-400 text-sm">Connect with people worldwide</p>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-zinc-400 text-sm">Your data is protected</p>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4">
                  <Zap size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                <p className="text-zinc-400 text-sm">Optimized performance</p>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Communication</h3>
                <p className="text-zinc-400 text-sm">Simple and intuitive</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-500">
          <p>&copy; 2025 OpenCircle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
