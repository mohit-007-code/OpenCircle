// components/Navbar.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Bell, MessageSquare, User, LogOut, Menu, X, Home } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

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
      
      const filtered = communities.filter((community: Community) =>
        community.name.toLowerCase().includes(query.toLowerCase()) ||
        community.description.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered.slice(0, 5));
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching communities:', error);
    }
  };

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
    setMobileMenuOpen(false);
    router.push(`/communities/${slug}`);
  };

  return (
    <>
      {/* Top Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 glass-effect backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800/50 shadow-lg shadow-black/5"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14">
            {/* ✨ Logo - White */}
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:bg-zinc-800/50 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white flex items-center justify-center font-bold text-zinc-950 shadow-lg shadow-white/10 group-hover:shadow-white/20 transition-all duration-300">
                O
              </div>
              <span className="font-bold text-lg sm:text-xl hidden sm:block text-white">OpenCircle</span>
            </Link>

            {/* Desktop Search Bar */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 backdrop-blur-sm hover:bg-zinc-800/70"
                />
                
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full mt-2 w-full glass-effect bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl max-h-80 overflow-y-auto"
                    >
                      {searchResults.map((community, index) => (
                        <motion.button
                          key={community.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleCommunityClick(community.slug)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-all duration-300 text-left border-b border-zinc-800/30 last:border-0 group"
                        >
                          {/* ✨ White icon */}
                          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-zinc-950 text-sm font-bold flex-shrink-0 overflow-hidden shadow-lg group-hover:shadow-white/20 transition-all duration-300 group-hover:scale-110">
                            {getImageUrl(community.display_picture) ? (
                              <Image
                                src={getImageUrl(community.display_picture)!}
                                alt={community.name}
                                width={44}
                                height={44}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              community.name[0].toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-zinc-100 group-hover:text-white transition-colors">
                              c/{community.name}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{community.description}</p>
                            <p className="text-xs text-zinc-600">{community.member_count} members</p>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showSearchResults && searchResults.length === 0 && searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 w-full glass-effect bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl p-4 text-center text-zinc-500 text-sm"
                    >
                      No communities found for "{searchQuery}"
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {/* ✨ Create button - White */}
                  <Link
                    href="/communities/create"
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 group shadow-lg shadow-white/10"
                  >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="hidden lg:inline">Create</span>
                  </Link>

                  <button className="p-2.5 hover:bg-zinc-800/50 rounded-xl transition-all duration-300 hover:scale-105 relative group">
                    <Bell size={20} className="group-hover:animate-pulse" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50 animate-pulse"></span>
                  </button>

                  <button className="p-2.5 hover:bg-zinc-800/50 rounded-xl transition-all duration-300 hover:scale-105">
                    <MessageSquare size={20} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      {/* ✨ White avatar border */}
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-zinc-950 font-semibold text-sm overflow-hidden border-2 border-zinc-700/50 shadow-lg shadow-white/10">
                        {getImageUrl(userProfilePic) ? (
                          <Image
                            src={getImageUrl(userProfilePic)!}
                            alt={user.username}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          user.username[0].toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium hidden lg:inline text-white">{user.username}</span>
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-52 glass-effect bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden"
                        >
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center text-white  gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-all duration-300 group"
                          >
                            <User size={18} className="group-hover:scale-110 transition-transform" />
                            <span>Profile</span>
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-all duration-300 text-red-400 hover:text-red-300 group"
                          >
                            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 lg:px-6 py-2 text-sm font-semibold text-white hover:bg-zinc-800/50 rounded-2xl transition-all duration-300 hover:scale-105"
                  >
                    Log In
                  </Link>
                  {/* ✨ Sign Up - White button */}
                  <Link
                    href="/register"
                    className="px-4 lg:px-6 py-2 bg-white text-zinc-950 hover:bg-zinc-100 text-sm font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-white/20 hover:shadow-white/30"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden pb-4 overflow-hidden"
              >
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search communities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 glass-effect bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl max-h-60 overflow-y-auto"
                      >
                        {searchResults.map((community) => (
                          <button
                            key={community.id}
                            onClick={() => handleCommunityClick(community.slug)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-all duration-300 text-left border-b border-zinc-800/30 last:border-0"
                          >
                            {/* ✨ White icon */}
                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-zinc-950 text-sm font-bold flex-shrink-0 overflow-hidden shadow-lg">
                              {getImageUrl(community.display_picture) ? (
                                <Image
                                  src={getImageUrl(community.display_picture)!}
                                  alt={community.name}
                                  width={44}
                                  height={44}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                community.name[0].toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate text-zinc-100">c/{community.name}</p>
                              <p className="text-xs text-zinc-500">{community.member_count} members</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {user ? (
                  <div className="space-y-1">
                    <Link
                      href="/communities/create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center text-white gap-3 px-4 py-3 hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
                    >
                      <Plus size={20} />
                      <span>Create Community</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center text-white gap-3 px-4 py-3 hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
                    >
                      <User size={20} />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 rounded-xl transition-all duration-300 text-red-400"
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
                      className="block text-center px-4 py-2.5 text-white hover:bg-zinc-800/50 rounded-2xl transition-all duration-300"
                    >
                      Log In
                    </Link>
                    {/* ✨ Sign Up - White */}
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center px-4 py-2.5 bg-white text-zinc-950 rounded-2xl transition-all duration-300 shadow-lg shadow-white/20"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      <div className="h-14"></div>
    </>
  );
}
