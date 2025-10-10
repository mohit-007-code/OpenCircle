// components/Navbar.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Plus, Bell, MessageSquare, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" size={18} />
              <input
                type="text"
                placeholder="Search OpenCircle"
                className="w-full pl-10 pr-4 py-1.5 bg-[#272729] border border-[#343536] rounded-full text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
              />
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6a00] flex items-center justify-center text-white font-semibold text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm">{user.username}</span>
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
                  placeholder="Search OpenCircle"
                  className="w-full pl-10 pr-4 py-2 bg-[#272729] border border-[#343536] rounded-full text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                />
              </div>
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
