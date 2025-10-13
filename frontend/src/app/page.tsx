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
import { Heart, MessageSquare, Share2, TrendingUp, Sparkles, Clock, Crown, Award, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularCommunities, setPopularCommunities] = useState<Community[]>([]);
  const [communitiesMap, setCommunitiesMap] = useState<{ [key: string]: Community }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'new' | 'top' | 'best'>('new');
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);


  useEffect(() => {
    fetchFeed();
    fetchPopularCommunities();
  }, [filter]);


  const fetchFeed = async () => {
    if (posts.length === 0) setLoading(true);
    
    try {
      const response = await api.get('/posts/feed/');
      let allPosts = Array.isArray(response.data) ? response.data : [];
      let filteredPosts = [...allPosts];


      if (filter === 'new') {
        filteredPosts.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (filter === 'top') {
        filteredPosts.sort((a: Post, b: Post) => b.likes_count - a.likes_count);
      } else if (filter === 'best') {
        filteredPosts.sort((a: Post, b: Post) => {
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
      if (!Array.isArray(allCommunities)) allCommunities = [];


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
      if (!Array.isArray(communities)) communities = [];


      communities.sort((a: Community, b: Community) => b.member_count - a.member_count);
      setPopularCommunities(communities.slice(0, 3));
    } catch (error) {
      console.error('Error fetching popular communities:', error);
    }
  };


  const handleVote = async (postId: number) => {
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
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };


  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
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
    if (index === 0) return <Crown size={16} className="text-yellow-500" />;
    if (index === 1) return <Award size={16} className="text-gray-400" />;
    if (index === 2) return <Award size={16} className="text-orange-600" />;
    return null;
  };


  const getCommunityIcon = (post: Post) => {
    const community = communitiesMap[post.community_slug];
    const communityDP = community?.display_picture;


    return (
      <div className="w-6 h-6 rounded-xl bg-white flex items-center justify-center text-zinc-950 text-xs font-bold flex-shrink-0 overflow-hidden shadow-sm relative">
        {getImageUrl(communityDP) ? (
          <Image
            src={getImageUrl(communityDP)!}
            alt={post.community_name}
            fill
            sizes="24px"
            className="object-cover"
          />
        ) : (
          post.community_name[0].toUpperCase()
        )}
      </div>
    );
  };


  const PostSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-zinc-800 rounded animate-pulse" />
          </div>
          
          <div 
            className="w-full bg-zinc-800 rounded-xl animate-pulse" 
            style={{ height: `${200 + (i * 50)}px` }}
          />
          
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );


  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />


        <main className="flex-1 min-w-0">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6 glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-2"
          >
            <button
              onClick={() => setFilter('new')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === 'new'
                  ? 'bg-white text-zinc-950 shadow-lg shadow-white/10'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
              suppressHydrationWarning
            >
              <Clock size={16} />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => setFilter('top')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === 'top'
                  ? 'bg-white text-zinc-950 shadow-lg shadow-white/10'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
              suppressHydrationWarning
            >
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Top</span>
            </button>
            <button
              onClick={() => setFilter('best')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === 'best'
                  ? 'bg-white text-zinc-950 shadow-lg shadow-white/10'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
              suppressHydrationWarning
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Best</span>
            </button>
          </motion.div>


          {loading ? (
            <PostSkeleton />
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 sm:p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
                <MessageSquare size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">No posts yet</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Be the first to share something amazing with the community!
              </p>
              <Link
                href="/communities"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
              >
                Explore Communities
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {posts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => router.push(`/posts/${post.id}`)}
                    className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl hover:border-zinc-700/50 transition-all duration-300 overflow-hidden cursor-pointer group"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/communities/${post.community_slug}`);
                          }}
                          className="flex items-center gap-2 hover:text-white transition-colors group/community"
                          suppressHydrationWarning
                        >
                          {getCommunityIcon(post)}
                          <span className="font-bold text-zinc-300 group-hover/community:text-white">
                            c/{post.community_name}
                          </span>
                        </button>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">Posted by</span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user && post.author.id === user.id) {
                              router.push('/profile');
                            } else {
                              router.push(`/users/${post.author.id}`);
                            }
                          }}
                          className={`hover:text-white cursor-pointer transition-colors font-semibold ${
                            user && post.author.id === user.id ? 'text-blue-400' : ''
                          }`}
                          suppressHydrationWarning
                        >
                          u/{post.author.username}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span suppressHydrationWarning>{formatTime(post.created_at)}</span>
                      </div>


                      <h2 className="text-base sm:text-lg font-semibold text-zinc-100 mb-3 hover:text-white transition-colors line-clamp-3">
                        {post.content}
                      </h2>


                      {getImageUrl(post.image) && (
                        <div className="mb-4 rounded-xl overflow-hidden">
                          <img
                            src={getImageUrl(post.image)!}
                            alt="Post"
                            className="w-full h-auto object-cover rounded-xl"
                            style={{ maxHeight: '400px' }}
                            loading={index < 3 ? 'eager' : 'lazy'}
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
                          suppressHydrationWarning
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
                          suppressHydrationWarning
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
                          suppressHydrationWarning
                        >
                          <Share2 size={18} className="group-hover/share:scale-110 transition-transform" />
                          <span className="hidden sm:inline">
                            {copiedPostId === post.id ? 'Copied!' : 'Share'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>


        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-zinc-950 font-bold text-2xl shadow-lg shadow-white/20">
                  O
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">Home</h3>
                  <p className="text-xs text-zinc-500">OpenCircle</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                Your personal frontpage. Check in with your favorite communities.
              </p>
              <Link
                href="/communities/create"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
              >
                <Plus size={18} />
                Create Community
              </Link>
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                <TrendingUp size={20} className="text-white" />
                Top Communities
              </h3>
              
              {popularCommunities.length > 0 ? (
                <div className="space-y-3">
                  {popularCommunities.map((community, index) => (
                    <motion.button
                      key={community.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1) }}
                      onClick={() => router.push(`/communities/${community.slug}`)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-xl transition-all duration-300 text-left group"
                      suppressHydrationWarning
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
                      
                      <div className="relative w-12 h-12 rounded-xl bg-white flex items-center justify-center text-zinc-950 font-bold flex-shrink-0 overflow-hidden shadow-lg group-hover:scale-110 transition-all duration-300">
                        {getImageUrl(community.display_picture) ? (
                          <Image
                            src={getImageUrl(community.display_picture)!}
                            alt={community.name}
                            fill
                            sizes="48px"
                            priority={index === 0}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xl">{community.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate text-white group-hover:text-zinc-300 transition-colors">
                          c/{community.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {community.member_count.toLocaleString()} {community.member_count === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No communities yet</p>
              )}
              
              <Link
                href="/popular"
                className="block mt-4 text-sm text-zinc-400 hover:text-white transition-colors font-semibold group"
              >
                View all <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>
        </aside>
      </div>
    </div>
  );
}
