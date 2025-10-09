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
import { Users, Plus, Search } from 'lucide-react';

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

  const getImageUrl = (imageUrl: string | null) => {
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white w-full">
      <Navbar />

      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Communities</h1>
              <p className="text-zinc-400">Discover and join amazing communities</p>
            </div>
            {user && (
              <Link
                href="/communities/create"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all hover:scale-105"
              >
                <Plus size={20} />
                Create Community
              </Link>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {user && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('my')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    filter === 'my'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  My Communities
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCommunities.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-900 flex items-center justify-center">
                <Users size={40} className="text-zinc-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No communities found</h3>
              <p className="text-zinc-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search'
                  : filter === 'my'
                  ? "You haven't joined any communities yet"
                  : 'Be the first to create one!'}
              </p>
              {user && filter === 'my' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-blue-500 hover:text-blue-400 font-medium"
                >
                  Explore All Communities →
                </button>
              )}
            </div>
          )}

          {/* Communities Grid */}
          {!loading && filteredCommunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map((community) => {
                const coverUrl = getImageUrl(community.cover_image);
                const dpUrl = getImageUrl(community.display_picture);

                return (
                  <div
                    key={community.id}
                    className="group bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 overflow-hidden transition-all hover:scale-[1.02]"
                  >
                    {/* Cover Image */}
                    <div className="h-40 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
                      {coverUrl && (
                        <Image
                          src={coverUrl}
                          alt={community.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Display Picture */}
                      <div className="relative -mt-16 mb-4">
                        <div className="w-20 h-20 rounded-xl border-4 border-zinc-900 bg-zinc-800 overflow-hidden">
                          {dpUrl ? (
                            <Image
                              src={dpUrl}
                              alt={community.name}
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-600">
                              {community.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <Link href={`/communities/${community.slug}`}>
                        <h3 className="text-xl font-bold mb-2 hover:text-blue-500 transition-colors line-clamp-1">
                          {community.name}
                        </h3>
                      </Link>
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {community.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <Users size={16} />
                          <span className="font-medium">{community.member_count}</span>
                          <span>members</span>
                        </div>
                        
                        {community.is_member ? (
                          <Link
                            href={`/communities/${community.slug}`}
                            className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                          >
                            View →
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleJoinCommunity(community.slug)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
