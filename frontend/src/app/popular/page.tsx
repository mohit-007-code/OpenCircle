// app/popular/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Community } from '@/types';
import Image from 'next/image';
import { TrendingUp, Users, Calendar, Award, Crown, Flame } from 'lucide-react';

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
      console.log('Communities response:', response.data); // DEBUG
      
      // Handle paginated response (results) or direct array
      let allCommunities = response.data.results || response.data || [];
      if (!Array.isArray(allCommunities)) {
        allCommunities = [];
      }
      
      console.log('Total communities:', allCommunities.length); // DEBUG
      
      // Sort by member count
      allCommunities.sort((a, b) => b.member_count - a.member_count);
      
      // Take top 5
      const top5 = allCommunities.slice(0, 5);
      console.log('Top 5:', top5); // DEBUG
      
      setCommunities(top5);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
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
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="flex flex-col items-center">
          <Crown size={28} className="text-yellow-500" />
          <span className="text-xs text-yellow-500 font-bold mt-1">#1</span>
        </div>
      );
    } else if (index === 1) {
      return (
        <div className="flex flex-col items-center">
          <Award size={24} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-bold mt-1">#2</span>
        </div>
      );
    } else if (index === 2) {
      return (
        <div className="flex flex-col items-center">
          <Award size={24} className="text-orange-600" />
          <span className="text-xs text-orange-600 font-bold mt-1">#3</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-[#818384]">#{index + 1}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-5">
        <Sidebar />

        <main className="flex-1 max-w-4xl">
          {/* Header */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Flame size={32} className="text-[#ff4500]" />
              <h1 className="text-3xl font-bold">Top 5 Communities</h1>
            </div>
            <p className="text-[#818384]">
              The hottest communities with the most members on OpenCircle 🔥
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : communities.length === 0 ? (
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-[#818384]" />
              <h3 className="text-xl font-semibold mb-2">No communities yet</h3>
              <p className="text-[#818384] mb-6">Create a community to get started!</p>
              <button
                onClick={() => router.push('/communities/create')}
                className="px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors"
              >
                Create Community
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {communities.map((community, index) => (
                <article
                  key={community.id}
                  className={`bg-[#1a1a1b] border-2 rounded-lg hover:border-[#ff4500] transition-colors overflow-hidden ${
                    index === 0 ? 'border-yellow-500/50' : 
                    index === 1 ? 'border-gray-400/50' : 
                    index === 2 ? 'border-orange-600/50' : 
                    'border-[#343536]'
                  }`}
                >
                  <div className="flex">
                    {/* Rank Section */}
                    <div className="flex items-center justify-center bg-[#161617] px-6">
                      {getRankBadge(index)}
                    </div>

                    {/* Community Info */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start gap-4">
                        {/* Display Picture */}
                        <button
                          onClick={() => router.push(`/communities/${community.slug}`)}
                          className="w-20 h-20 rounded-full bg-[#ff4500] flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity border-2 border-[#ff4500]"
                        >
                          {getImageUrl(community.display_picture) ? (
                            <Image
                              src={getImageUrl(community.display_picture)!}
                              alt={community.name}
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          ) : (
                            community.name[0].toUpperCase()
                          )}
                        </button>

                        {/* Community Details */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => router.push(`/communities/${community.slug}`)}
                            className="text-2xl font-bold hover:underline text-left flex items-center gap-2"
                          >
                            c/{community.name}
                            {index === 0 && <Crown size={20} className="text-yellow-500" />}
                            {index === 1 && <Award size={18} className="text-gray-400" />}
                            {index === 2 && <Award size={18} className="text-orange-600" />}
                          </button>
                          <p className="text-sm text-[#818384] mt-2 line-clamp-2">
                            {community.description}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Users size={18} className="text-[#ff4500]" />
                              <span className="font-bold text-[#d7dadc]">{community.member_count}</span>
                              <span className="text-[#818384]">members</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={18} className="text-[#818384]" />
                              <span className="text-[#818384]">Created {formatTime(community.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* View Button */}
                        <button
                          onClick={() => router.push(`/communities/${community.slug}`)}
                          className="px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors flex-shrink-0 self-start"
                        >
                          View
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
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg overflow-hidden">
              <div className="h-12 bg-gradient-to-r from-[#ff4500] to-[#ff6a00]"></div>
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Flame size={18} className="text-[#ff4500]" />
                  How It Works
                </h3>
                <p className="text-sm text-[#818384] mb-4">
                  Rankings are based on member count. The more members, the higher the rank!
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Crown size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-500">#1 Top Community</p>
                      <p className="text-[#818384]">Most members</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-400">#2 Runner-up</p>
                      <p className="text-[#818384]">High membership</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-600">#3 Rising Star</p>
                      <p className="text-[#818384]">Growing fast</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-2">Want to be on top?</h3>
              <p className="text-sm text-[#818384] mb-4">
                Create an engaging community and watch it climb the ranks!
              </p>
              <button
                onClick={() => router.push('/communities/create')}
                className="w-full py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors"
              >
                Create Community
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
