// app/popular/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Community } from '@/types';
import Image from 'next/image';
import { TrendingUp, Users, Calendar, Award, Crown, Flame, Plus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';


export default function PopularPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchPopularCommunities();
  }, []);


  const fetchPopularCommunities = async () => {
    try {
      const response = await api.get('/communities/');
      
      let allCommunities = response.data.results || response.data || [];
      if (!Array.isArray(allCommunities)) {
        allCommunities = [];
      }
      
      allCommunities.sort((a: Community, b: Community) => b.member_count - a.member_count);
      const top5 = allCommunities.slice(0, 5);
      
      setCommunities(top5);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
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


  const getRankBadge = (index: number) => {
    if (index === 0) {
      return <Crown size={28} className="text-yellow-500 flex-shrink-0" />;
    } else if (index === 1) {
      return <Award size={24} className="text-gray-400 flex-shrink-0" />;
    } else if (index === 2) {
      return <Award size={24} className="text-orange-600 flex-shrink-0" />;
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center">
        <span className="text-lg font-bold text-zinc-400">#{index + 1}</span>
      </div>
    );
  };


  const CommunitySkeleton = () => (
    <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      {/* ✨ FIXED LAYOUT - Proper container */}
      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />


        {/* ✨ MAIN CONTENT - Proper flex-1 */}
        <main className="flex-1 min-w-0">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-5 transition-colors group"
            suppressHydrationWarning
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </motion.button>


          {/* ✨ WHITE THEME HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              {/* ✨ WHITE ICON */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/20">
                <Flame size={28} className="text-zinc-950" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Top 5 Communities</h1>
            </div>
            <p className="text-zinc-400 text-sm sm:text-base">
              The hottest communities with the most members on OpenCircle
            </p>
          </motion.div>


          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <CommunitySkeleton key={i} />
              ))}
            </div>
          ) : communities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 sm:p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users size={40} className="text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No communities yet</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Create a community to get started and be the first on the leaderboard!
              </p>
              <button
                onClick={() => router.push('/communities/create')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
                suppressHydrationWarning
              >
                <Plus size={20} />
                Create Community
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {communities.map((community, index) => (
                  <motion.article
                    key={community.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass-effect bg-zinc-900/50 backdrop-blur-xl border-2 rounded-2xl hover:border-white/30 transition-all duration-300 overflow-hidden group ${
                      index === 0 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 
                      index === 1 ? 'border-gray-400/50 shadow-lg shadow-gray-400/10' : 
                      index === 2 ? 'border-orange-600/50 shadow-lg shadow-orange-600/10' : 
                      'border-zinc-800/50'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 pt-1">
                          {getRankBadge(index)}
                        </div>


                        {/* ✨ WHITE DISPLAY PICTURE */}
                        <button
                          onClick={() => router.push(`/communities/${community.slug}`)}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white flex items-center justify-center text-zinc-950 text-2xl sm:text-3xl font-bold overflow-hidden flex-shrink-0 hover:scale-110 transition-all duration-300 shadow-lg shadow-white/20 group-hover:shadow-white/30"
                          suppressHydrationWarning
                        >
                          {getImageUrl(community.display_picture) ? (
                            <Image
                              src={getImageUrl(community.display_picture)!}
                              alt={community.name}
                              width={80}
                              height={80}
                              priority={index === 0}
                              className="object-cover"
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            community.name[0].toUpperCase()
                          )}
                        </button>


                        {/* Community Details */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => router.push(`/communities/${community.slug}`)}
                            className="text-lg sm:text-xl font-bold text-white hover:text-zinc-300 transition-colors text-left mb-2 line-clamp-1"
                            suppressHydrationWarning
                          >
                            c/{community.name}
                          </button>
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                            {community.description}
                          </p>


                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-white" />
                              <span className="font-bold text-zinc-100">{community.member_count.toLocaleString()}</span>
                              <span className="text-zinc-500">members</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-zinc-500" />
                              <span className="text-zinc-500" suppressHydrationWarning>Created {formatTime(community.created_at)}</span>
                            </div>
                          </div>


                          {/* ✨ WHITE BUTTON */}
                          <button
                            onClick={() => router.push(`/communities/${community.slug}`)}
                            className="px-6 py-2 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
                            suppressHydrationWarning
                          >
                            View Community
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>


        {/* ✨ RIGHT SIDEBAR - Proper layout */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* ✨ WHITE THEME - How It Works Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden"
            >
              <div className="h-16 bg-gradient-to-br from-white via-white to-zinc-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40"></div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                  <Flame size={20} className="text-white" />
                  How It Works
                </h3>
                <p className="text-sm text-zinc-400 mb-5">
                  Rankings are based on member count. The more members, the higher the rank!
                </p>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <Crown size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-500">#1 Top Community</p>
                      <p className="text-zinc-500">Most members</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <Award size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-400">#2 Runner-up</p>
                      <p className="text-zinc-500">High membership</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <Award size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-600">#3 Rising Star</p>
                      <p className="text-zinc-500">Growing fast</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* ✨ WHITE THEME - Call to Action Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg mb-2 text-white">Want to be on top?</h3>
              <p className="text-sm text-zinc-400 mb-5">
                Create an engaging community and watch it climb the ranks!
              </p>
              {/* ✨ WHITE BUTTON */}
              <button
                onClick={() => router.push('/communities/create')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
                suppressHydrationWarning
              >
                <Plus size={18} />
                Create Community
              </button>
            </motion.div>
          </div>
        </aside>
      </div>
    </div>
  );
}
