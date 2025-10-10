// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Post } from '@/types';
import Image from 'next/image';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal, TrendingUp, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'best' | 'new' | 'top'>('best');

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

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
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
      console.error('Failed to vote:', error);
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
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

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-5">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 max-w-3xl">
          {/* Filter Tabs */}
          <div className="flex items-center gap-3 mb-4 bg-[#1a1a1b] border border-[#343536] rounded-lg p-2">
            <button
              onClick={() => setFilter('best')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'best'
                  ? 'bg-[#272729] text-white'
                  : 'text-[#818384] hover:bg-[#272729]'
              }`}
            >
              <Sparkles size={16} />
              Best
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'new'
                  ? 'bg-[#272729] text-white'
                  : 'text-[#818384] hover:bg-[#272729]'
              }`}
            >
              New
            </button>
            <button
              onClick={() => setFilter('top')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'top'
                  ? 'bg-[#272729] text-white'
                  : 'text-[#818384] hover:bg-[#272729]'
              }`}
            >
              <TrendingUp size={16} />
              Top
            </button>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#272729] flex items-center justify-center">
                <MessageSquare size={32} className="text-[#818384]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-[#818384] mb-6">Be the first to share something!</p>
              <Link
                href="/communities"
                className="inline-block px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors"
              >
                Explore Communities
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-[#1a1a1b] border border-[#343536] rounded-lg hover:border-[#474748] transition-colors overflow-hidden"
                >
                  <div className="flex">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1 bg-[#161617] px-3 py-3">
                      <button
                        onClick={() => handleVote(post.id, 'up')}
                        className={`p-1 rounded hover:bg-[#272729] transition-colors ${
                          post.is_liked ? 'text-[#ff4500]' : 'text-[#818384]'
                        }`}
                      >
                        <ArrowBigUp size={24} fill={post.is_liked ? 'currentColor' : 'none'} />
                      </button>
                      <span className={`text-xs font-bold ${post.is_liked ? 'text-[#ff4500]' : 'text-[#d7dadc]'}`}>
                        {post.likes_count}
                      </span>
                      <button
                        onClick={() => handleVote(post.id, 'down')}
                        className="p-1 rounded hover:bg-[#272729] transition-colors text-[#818384]"
                      >
                        <ArrowBigDown size={24} />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-3">
                      {/* Post Header */}
                      <div className="flex items-center gap-2 text-xs text-[#818384] mb-2">
                        <Link
                          href={`/communities/${post.community_slug}`}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#ff4500] flex items-center justify-center text-white text-[10px] font-bold">
                            {post.community_name[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-[#d7dadc]">c/{post.community_name}</span>
                        </Link>
                        <span>•</span>
                        <span>Posted by u/{post.author.username}</span>
                        <span>•</span>
                        <span>{formatTime(post.created_at)}</span>
                      </div>

                      {/* Post Content */}
                      <h2 className="text-lg font-semibold text-[#d7dadc] mb-2 hover:underline cursor-pointer">
                        {post.content}
                      </h2>

                      {/* Post Image */}
                      {getImageUrl(post.image) && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={getImageUrl(post.image)!}
                            alt="Post"
                            width={600}
                            height={400}
                            className="w-full max-h-[500px] object-cover"
                          />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/communities/${post.community_slug}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]"
                        >
                          <MessageSquare size={18} />
                          <span>{post.comments_count} Comments</span>
                        </Link>

                        <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]">
                          <Share2 size={18} />
                          <span>Share</span>
                        </button>

                        <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]">
                          <Bookmark size={18} />
                          <span>Save</span>
                        </button>

                        <button className="ml-auto p-1.5 rounded hover:bg-[#272729] transition-colors text-[#818384]">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80">
          <div className="sticky top-14 space-y-4">
            {/* Home Card */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg overflow-hidden">
              <div className="h-12 bg-gradient-to-r from-[#ff4500] to-[#ff6a00]"></div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#ff4500] flex items-center justify-center text-white font-bold">
                    O
                  </div>
                  <h3 className="font-semibold">Home</h3>
                </div>
                <p className="text-sm text-[#818384] mb-4">
                  Your personal OpenCircle frontpage. Come here to check in with your favorite communities.
                </p>
                <Link
                  href="/communities/create"
                  className="block w-full py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white text-center font-semibold rounded-full transition-colors"
                >
                  Create Community
                </Link>
              </div>
            </div>

            {/* Popular Communities */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#ff4500]" />
                Popular Communities
              </h3>
              <Link
                href="/communities"
                className="text-sm text-[#818384] hover:text-white transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
