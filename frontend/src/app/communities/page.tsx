// app/communities/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Community } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Users, Plus, Search, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';


export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const router = useRouter();


  useEffect(() => {
    fetchCommunities();
  }, [filter]);


  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'my' ? '/communities/my/' : '/communities/';
      const response = await api.get(endpoint);
      
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setCommunities(data);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };


  const handleJoinCommunity = async (slug: string) => {
    if (!user) {
      router.push('/login');
      return;
    }


    try {
      await api.post(`/communities/${slug}/join/`);
      fetchCommunities();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join community');
    }
  };


  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8000${imageUrl}`;
  };


  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const CommunitySkeleton = () => (
    <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
      <Skeleton className="h-24 w-full" />
      <div className="p-4">
        <Skeleton className="w-16 h-16 rounded-full -mt-10 mb-3" />
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />


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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Communities</h1>
                <p className="text-zinc-400 text-sm sm:text-base">Discover and join amazing communities</p>
              </div>
              {user && (
                <Link
                  href="/communities/create"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Create</span>
                </Link>
              )}
            </div>


            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300"
                suppressHydrationWarning
              />
            </div>
          </motion.div>


          {/* ✨ WHITE THEME FILTERS */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 mb-5"
            >
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-white text-zinc-950 shadow-lg shadow-white/20'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
                suppressHydrationWarning
              >
                All Communities
              </button>
              <button
                onClick={() => setFilter('my')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filter === 'my'
                    ? 'bg-white text-zinc-950 shadow-lg shadow-white/20'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
                suppressHydrationWarning
              >
                My Communities
              </button>
            </motion.div>
          )}


          {/* Communities Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CommunitySkeleton key={i} />
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 sm:p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users size={40} className="text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No communities found</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                {searchQuery ? 'Try a different search term' : 'Be the first to create one!'}
              </p>
              {!searchQuery && (
                <Link
                  href="/communities/create"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
                >
                  <Plus size={20} />
                  Create Community
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredCommunities.map((community, index) => {
                  const coverUrl = getImageUrl(community.cover_image);
                  const dpUrl = getImageUrl(community.display_picture);


                  return (
                    <motion.div
                      key={community.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-300 group"
                    >
                     {/* ✨ WHITE COVER (if no image) */}
<div className="h-24 bg-white relative overflow-hidden">
  {coverUrl && (
    <Image
      src={coverUrl}
      alt={community.name}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={index === 0}
      className="object-cover group-hover:scale-110 transition-transform duration-300"
    />
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent" />
</div>

{/* Content */}
<div className="p-4">
  {/* ✨ WHITE DISPLAY PICTURE */}
  <div className="relative -mt-10 mb-3">
    <div className="w-16 h-16 rounded-2xl border-4 border-zinc-900 bg-white overflow-hidden shadow-lg group-hover:shadow-white/30 transition-all duration-300 group-hover:scale-110">
      {dpUrl ? (
        <Image
          src={dpUrl}
          alt={community.name}
          width={64}
          height={64}
          priority={index === 0}
          className="object-cover"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-950">
          {community.name[0].toUpperCase()}
        </div>
      )}
    </div>
  </div>



                        <Link href={`/communities/${community.slug}`}>
                          <h3 className="font-bold text-lg mb-2 text-white hover:text-zinc-300 transition-colors line-clamp-1">
                            c/{community.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                          {community.description}
                        </p>


                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                          <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                            <Users size={16} className="text-white" />
                            <span className="font-medium text-zinc-300">{community.member_count.toLocaleString()}</span>
                          </div>
                          
                          {community.is_member ? (
                            <Link
                              href={`/communities/${community.slug}`}
                              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                            >
                              View
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleJoinCommunity(community.slug)}
                              className="px-4 py-1.5 bg-white text-zinc-950 hover:bg-zinc-100 text-sm font-semibold rounded-lg transition-all duration-300 shadow-md shadow-white/20 hover:shadow-white/30 hover:scale-105"
                              suppressHydrationWarning
                            >
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
