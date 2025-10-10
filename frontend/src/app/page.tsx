// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Post, Community } from '@/types';
import Image from 'next/image';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, TrendingUp, Sparkles, Clock, Crown, Award } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularCommunities, setPopularCommunities] = useState<Community[]>([]);
  const [communitiesMap, setCommunitiesMap] = useState<{ [key: string]: Community }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'new' | 'top' | 'best'>('new');

  useEffect(() => {
    fetchFeed();
    fetchPopularCommunities();
  }, [filter]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/feed/');
      let allPosts = Array.isArray(response.data) ? response.data : [];
      
      let filteredPosts = [...allPosts];
      
      if (filter === 'new') {
        filteredPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (filter === 'top') {
        filteredPosts.sort((a, b) => b.likes_count - a.likes_count);
      } else if (filter === 'best') {
        filteredPosts.sort((a, b) => {
          const scoreA = (a.likes_count * 2) + a.comments_count;
          const scoreB = (b.likes_count * 2) + b.comments_count;
          return scoreB - scoreA;
        });
      }
      
      setPosts(filteredPosts);
      await fetchCommunitiesForPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching feed:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunitiesForPosts = async (posts: Post[]) => {
    try {
      const response = await api.get('/communities/');
      let allCommunities = response.data.results || response.data || [];
      if (!Array.isArray(allCommunities)) {
        allCommunities = [];
      }
      
      const map: { [key: string]: Community } = {};
      allCommunities.forEach((community: Community) => {
        map[community.slug] = community;
      });
      
      setCommunitiesMap(map);
    } catch (error) {
      console.error('Error fetching communities for posts:', error);
    }
  };

  const fetchPopularCommunities = async () => {
    try {
      const response = await api.get('/communities/');
      let communities = response.data.results || response.data || [];
      if (!Array.isArray(communities)) {
        communities = [];
      }
      
      communities.sort((a, b) => b.member_count - a.member_count);
      setPopularCommunities(communities.slice(0, 3));
    } catch (error) {
      console.error('Error fetching popular communities:', error);
    }
  };

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/like/`);
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: response.data.liked,
            likes_count: response.data.likes_count
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleShare = async (postId: number) => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={14} className="text-yellow-500" />;
    if (index === 1) return <Award size={14} className="text-gray-400" />;
    if (index === 2) return <Award size={14} className="text-orange-600" />;
    return null;
  };

  const getCommunityIcon = (post: Post) => {
    const community = communitiesMap[post.community_slug];
    const communityDP = community?.display_picture;
    
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6a00] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
        {getImageUrl(communityDP) ? (
          <Image
            src={getImageUrl(communityDP)!}
            alt={post.community_name}
            width={20}
            height={20}
            className="object-cover w-full h-full"
          />
        ) : (
          post.community_name[0].toUpperCase()
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto flex gap-3 px-3 py-5">
        <Sidebar />

        <main className="flex-1 min-w-0">
          {/* Filter Tabs */}
          <div className="flex items-center gap-3 mb-4 bg-[#1a1a1b] border border-[#343536] rounded-lg p-2">
            <button
              onClick={() => setFilter('new')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'new'
                  ? 'bg-[#272729] text-white'
                  : 'text-[#818384] hover:bg-[#272729]'
              }`}
            >
              <Clock size={16} />
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
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#d93900] border-t-transparent rounded-full animate-spin"></div>
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
                className="inline-block px-6 py-2 bg-[#d93900] hover:bg-[#c13300] text-white font-semibold rounded-full transition-colors"
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
                          post.is_liked ? 'text-[#d93900]' : 'text-[#818384]'
                        }`}
                      >
                        <ArrowBigUp size={24} fill={post.is_liked ? 'currentColor' : 'none'} />
                      </button>
                      <span className={`text-xs font-bold ${
                        post.is_liked ? 'text-[#d93900]' : 'text-[#d7dadc]'
                      }`}>
                        {post.likes_count}
                      </span>
                      <button
                        onClick={() => handleVote(post.id, 'down')}
                        className="p-1 rounded hover:bg-[#272729] transition-colors text-[#818384] hover:text-blue-500"
                      >
                        <ArrowBigDown size={24} />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-3">
                      {/* Post Header */}
                      <div className="flex items-center gap-2 text-xs text-[#818384] mb-2">
                        <button
                          onClick={() => router.push(`/communities/${post.community_slug}`)}
                          className="flex items-center gap-1 hover:underline"
                        >
                          {getCommunityIcon(post)}
                          <span className="font-bold text-[#d7dadc]">c/{post.community_name}</span>
                        </button>
                        <span>•</span>
                        <span>Posted by</span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/users/${post.author.id}`);
                          }}
                          className="hover:underline cursor-pointer text-white font-semibold"
                        >
                          u/{post.author.username}
                        </span>
                        <span>•</span>
                        <span>{formatTime(post.created_at)}</span>
                      </div>

                      {/* Post Content */}
                      <h2 
                        onClick={() => router.push(`/posts/${post.id}`)}
                        className="text-lg font-semibold text-[#d7dadc] mb-2 hover:underline cursor-pointer"
                      >
                        {post.content}
                      </h2>

                      {/* Post Image */}
                      {getImageUrl(post.image) && (
                        <div 
                          onClick={() => router.push(`/posts/${post.id}`)}
                          className="mb-3 rounded-lg overflow-hidden cursor-pointer"
                        >
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
                        <button
                          onClick={() => router.push(`/posts/${post.id}`)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]"
                        >
                          <MessageSquare size={18} />
                          <span>{post.comments_count} Comments</span>
                        </button>

                        <button 
                          onClick={() => handleShare(post.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]"
                        >
                          <Share2 size={18} />
                          <span>Share</span>
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
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-14 space-y-4">
            {/* Home Card */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg overflow-hidden">
              <div className="h-12 bg-gradient-to-r from-[#d93900] to-[#a62d00]"></div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold">
                    O
                  </div>
                  <h3 className="font-semibold">Home</h3>
                </div>
                <p className="text-sm text-[#818384] mb-4">
                  Your personal OpenCircle frontpage. Come here to check in with your favorite communities.
                </p>
                <Link
                  href="/communities/create"
                  className="block w-full py-2 bg-[#d93900] hover:bg-[#c13300] text-white text-center font-semibold rounded-full transition-colors"
                >
                  Create Community
                </Link>
              </div>
            </div>

            {/* Popular Communities */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#d93900]" />
                Top Communities
              </h3>
              
              {popularCommunities.length > 0 ? (
                <div className="space-y-3">
                  {popularCommunities.map((community, index) => (
                    <button
                      key={community.id}
                      onClick={() => router.push(`/communities/${community.slug}`)}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-[#272729] rounded-lg transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <span className={`text-sm font-bold ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          'text-orange-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                      
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#d93900] to-[#a62d00] flex items-center justify-center text-white text-base font-bold flex-shrink-0 overflow-hidden border-2 border-[#343536] group-hover:border-[#d93900] group-hover:scale-105 transition-all shadow-lg">
                        {getImageUrl(community.display_picture) ? (
                          <Image
                            src={getImageUrl(community.display_picture)!}
                            alt={community.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-xl drop-shadow-lg">{community.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-[#d93900] transition-colors">
                          c/{community.name}
                        </p>
                        <p className="text-xs text-[#818384]">
                          {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#818384]">No communities yet</p>
              )}
              
              <Link
                href="/popular"
                className="block mt-4 text-sm text-[#818384] hover:text-[#d93900] transition-colors font-semibold"
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
