// components/Navbar.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Bell, MessageSquare, User, LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

interface Community {
  id: number;
  name: string;
  slug: string;
  description: string;
  display_picture: string | null;
  member_count: number;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch user profile picture
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUserProfilePic(response.data.profile_picture);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Search communities
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchCommunities(searchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const searchCommunities = async (query: string) => {
    try {
      const response = await api.get('/communities/');
      let communities = response.data.results || response.data || [];
      
      // Filter communities by search query
      const filtered = communities.filter((community: Community) =>
        community.name.toLowerCase().includes(query.toLowerCase()) ||
        community.description.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered.slice(0, 5)); // Show max 5 results
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching communities:', error);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8000${imageUrl}`;
  };

  const handleCommunityClick = (slug: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    router.push(`/communities/${slug}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1a1a1b] border-b border-[#343536]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:bg-[#272729] px-2 py-1 rounded transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#ff4500] flex items-center justify-center font-bold text-white">
              O
            </div>
            <span className="font-bold text-xl hidden sm:block">OpenCircle</span>
          </Link>

          {/* Search Bar with Dropdown */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={18} />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-1.5 bg-[#272729] border border-[#343536] rounded-full text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#1a1a1b] border border-[#343536] rounded-lg shadow-xl max-h-80 overflow-y-auto animate-slideDown">
                  {searchResults.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => handleCommunityClick(community.slug)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#272729] transition-colors text-left border-b border-[#343536] last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6a00] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                        {getImageUrl(community.display_picture) ? (
                          <Image
                            src={getImageUrl(community.display_picture)!}
                            alt={community.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          community.name[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">c/{community.name}</p>
                        <p className="text-xs text-[#818384] truncate">{community.description}</p>
                        <p className="text-xs text-[#818384]">{community.member_count} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSearchResults && searchResults.length === 0 && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-[#1a1a1b] border border-[#343536] rounded-lg shadow-xl p-4 text-center text-[#818384] text-sm animate-slideDown">
                  No communities found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/communities/create"
                  className="flex items-center gap-1 px-3 py-1.5 hover:bg-[#272729] rounded text-sm transition-colors"
                >
                  <Plus size={18} />
                  <span>Create</span>
                </Link>

                <button className="p-2 hover:bg-[#272729] rounded transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ff4500] rounded-full"></span>
                </button>

                <button className="p-2 hover:bg-[#272729] rounded transition-colors">
                  <MessageSquare size={20} />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-[#272729] rounded transition-colors"
                  >
                    {/* User Profile Picture */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6a00] flex items-center justify-center text-white font-semibold text-sm overflow-hidden border-2 border-[#343536]">
                      {getImageUrl(userProfilePic) ? (
                        <Image
                          src={getImageUrl(userProfilePic)!}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        user.username[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium">{user.username}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1b] border border-[#343536] rounded-lg shadow-xl animate-slideDown">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#272729] transition-colors"
                      >
                        <User size={18} />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#272729] transition-colors text-[#ff4500]"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-1.5 text-sm font-semibold hover:bg-[#272729] rounded-full transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-1.5 bg-[#ff4500] hover:bg-[#ff5414] text-white text-sm font-semibold rounded-full transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-[#272729] rounded transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-slideDown">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={18} />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#272729] border border-[#343536] rounded-full text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                />
              </div>
              
              {/* Mobile Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="mt-2 bg-[#1a1a1b] border border-[#343536] rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => {
                        handleCommunityClick(community.slug);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#272729] transition-colors text-left border-b border-[#343536] last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6a00] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                        {getImageUrl(community.display_picture) ? (
                          <Image
                            src={getImageUrl(community.display_picture)!}
                            alt={community.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          community.name[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">c/{community.name}</p>
                        <p className="text-xs text-[#818384]">{community.member_count} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/communities/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#272729] rounded transition-colors"
                >
                  <Plus size={20} />
                  <span>Create Community</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#272729] rounded transition-colors"
                >
                  <User size={20} />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#272729] rounded transition-colors text-[#ff4500]"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2 hover:bg-[#272729] rounded-full transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
