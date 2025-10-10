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
import { Users, TrendingUp, Plus, Search } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-5">
        <Sidebar />

        <main className="flex-1">
          {/* Header */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Communities</h1>
                <p className="text-[#818384]">Discover and join amazing communities</p>
              </div>
              {user && (
                <Link
                  href="/communities/create"
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors"
                >
                  <Plus size={20} />
                  Create
                </Link>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={20} />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#272729] border border-[#343536] rounded-lg text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
              />
            </div>
          </div>

          {/* Filters */}
          {user && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-[#ff4500] text-white'
                    : 'bg-[#272729] text-[#818384] hover:bg-[#343536]'
                }`}
              >
                All Communities
              </button>
              <button
                onClick={() => setFilter('my')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filter === 'my'
                    ? 'bg-[#ff4500] text-white'
                    : 'bg-[#272729] text-[#818384] hover:bg-[#343536]'
                }`}
              >
                My Communities
              </button>
            </div>
          )}

          {/* Communities Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-[#818384]" />
              <h3 className="text-xl font-semibold mb-2">No communities found</h3>
              <p className="text-[#818384]">
                {searchQuery ? 'Try a different search' : 'Be the first to create one!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommunities.map((community) => {
                const coverUrl = getImageUrl(community.cover_image);
                const dpUrl = getImageUrl(community.display_picture);

                return (
                  <div
                    key={community.id}
                    className="bg-[#1a1a1b] border border-[#343536] rounded-lg overflow-hidden hover:border-[#474748] transition-colors"
                  >
                    {/* Cover */}
                    <div className="h-24 bg-gradient-to-r from-[#ff4500] to-[#ff6a00] relative">
                      {coverUrl && (
                        <Image
                          src={coverUrl}
                          alt={community.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Display Picture */}
                      <div className="relative -mt-10 mb-3">
                        <div className="w-16 h-16 rounded-full border-4 border-[#1a1a1b] bg-[#272729] overflow-hidden">
                          {dpUrl ? (
                            <Image
                              src={dpUrl}
                              alt={community.name}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#ff4500]">
                              {community.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <Link href={`/communities/${community.slug}`}>
                        <h3 className="font-bold text-lg mb-2 hover:underline line-clamp-1">
                          c/{community.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-[#818384] mb-3 line-clamp-2">
                        {community.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-[#343536]">
                        <div className="flex items-center gap-1 text-sm text-[#818384]">
                          <Users size={16} />
                          <span>{community.member_count}</span>
                        </div>
                        
                        {community.is_member ? (
                          <Link
                            href={`/communities/${community.slug}`}
                            className="px-4 py-1.5 bg-[#272729] hover:bg-[#343536] text-sm font-semibold rounded-full transition-colors"
                          >
                            View
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleJoinCommunity(community.slug)}
                            className="px-4 py-1.5 bg-[#ff4500] hover:bg-[#ff5414] text-white text-sm font-semibold rounded-full transition-colors"
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
        </main>
      </div>
    </div>
  );
}
