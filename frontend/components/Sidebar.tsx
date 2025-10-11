// components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { Home, TrendingUp, Plus, Compass, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only animate on first mount, not on route changes
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    // Special handling for create page
    if (path === '/communities/create') {
      return pathname === '/communities/create';
    }
    // For communities page, only match exact path
    if (path === '/communities') {
      return pathname === '/communities';
    }
    return pathname === path;
  };

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: TrendingUp, label: 'Popular', href: '/popular' },
    { icon: Compass, label: 'Explore', href: '/communities' },
  ];

  return (
    <>
      {/* Desktop Sidebar - NO RELOAD ANIMATION */}
      <aside 
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div 
          className={`fixed top-14 left-0 h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden border-r border-zinc-800/50 glass-effect bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      active
                        ? 'text-cyan-400 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    {/* Smooth Active Indicator - Only this animates */}
                    {active && (
                      <motion.div
                        layoutId="desktopActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-600/20 rounded-xl shadow-lg shadow-cyan-500/10"
                        transition={{ 
                          type: "spring", 
                          bounce: 0.15, 
                          duration: 0.8,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      />
                    )}

                    {/* Active Bar */}
                    {active && (
                      <motion.div
                        layoutId="desktopActiveBar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 to-violet-600 rounded-r-full"
                        transition={{ 
                          type: "spring", 
                          bounce: 0.15, 
                          duration: 0.8,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      />
                    )}
                    
                    <Icon 
                      size={20} 
                      className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                        active ? 'text-cyan-400' : 'group-hover:scale-110'
                      }`}
                    />
                    
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={false}
                          className="whitespace-nowrap relative z-10"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </div>
              );
            })}

            {user && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent my-3" />
                
                <div>
                  <Link
                    href="/communities/create"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive('/communities/create')
                        ? 'text-cyan-400 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-cyan-400'
                    }`}
                    title={isCollapsed ? 'Create Community' : ''}
                  >
                    {/* Active Indicator for Create */}
                    {isActive('/communities/create') && (
                      <>
                        <motion.div
                          layoutId="desktopActiveTab"
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-600/20 rounded-xl shadow-lg shadow-cyan-500/10"
                          transition={{ 
                            type: "spring", 
                            bounce: 0.15, 
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                        />
                        <motion.div
                          layoutId="desktopActiveBar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 to-violet-600 rounded-r-full"
                          transition={{ 
                            type: "spring", 
                            bounce: 0.15, 
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                        />
                      </>
                    )}

                    <Plus 
                      size={20} 
                      className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                        isActive('/communities/create') ? 'text-cyan-400' : 'group-hover:rotate-90 group-hover:scale-110'
                      }`}
                    />
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={false}
                          className="whitespace-nowrap relative z-10"
                        >
                          Create Community
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </div>
              </>
            )}

            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <div>
                  <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent my-3" />
                  
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                      Your Communities
                    </h3>
                    <Link
                      href="/communities"
                      className="flex items-center justify-between py-1.5 px-2 text-sm text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/30 rounded-lg transition-all duration-300 group"
                    >
                      <span>View all</span>
                      <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </Link>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
        </div>
      </aside>

      {/* Desktop Toggle Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`hidden lg:flex fixed top-20 z-50 items-center justify-center w-10 h-10 glass-effect bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 group ${
          isCollapsed ? 'left-12' : 'left-60'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div
              key="right"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={18} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
            </motion.div>
          ) : (
            <motion.div
              key="left"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft size={18} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Floating Bottom Navigation - WITH EXPANDING TEXT */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        {/* Dynamic Width Navigation Bar */}
        <motion.div 
          layout
          className="glass-effect backdrop-blur-2xl bg-white/10 dark:bg-zinc-900/90 border border-zinc-700/30 rounded-full shadow-2xl shadow-black/30 px-2 py-2"
        >
          <div className="flex items-center justify-center gap-1">
            {/* Home */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                isActive('/') 
                  ? 'text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {isActive('/') && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                  transition={{ 
                    type: "spring", 
                    bounce: 0.15,
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              )}
              
              <Home 
                size={20} 
                strokeWidth={isActive('/') ? 2.5 : 2}
                className="relative z-10 transition-all duration-300"
              />
              
              <AnimatePresence mode="wait">
                {isActive('/') && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden"
                  >
                    Home
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Popular */}
            <Link
              href="/popular"
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                isActive('/popular') 
                  ? 'text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {isActive('/popular') && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                  transition={{ 
                    type: "spring", 
                    bounce: 0.15,
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              )}
              
              <TrendingUp 
                size={20} 
                strokeWidth={isActive('/popular') ? 2.5 : 2}
                className="relative z-10 transition-all duration-300"
              />
              
              <AnimatePresence mode="wait">
                {isActive('/popular') && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden"
                  >
                    Popular
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Create - Now with Active State */}
            {user && (
              <Link
                href="/communities/create"
                className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                  isActive('/communities/create')
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {isActive('/communities/create') && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                    transition={{ 
                      type: "spring", 
                      bounce: 0.15,
                      duration: 0.8,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  />
                )}

                <Plus 
                  size={20} 
                  strokeWidth={isActive('/communities/create') ? 2.5 : 2}
                  className="relative z-10 transition-all duration-300"
                />

                <AnimatePresence mode="wait">
                  {isActive('/communities/create') && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden"
                    >
                      Create
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}

            {/* Explore */}
            <Link
              href="/communities"
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                isActive('/communities') 
                  ? 'text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {isActive('/communities') && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                  transition={{ 
                    type: "spring", 
                    bounce: 0.15,
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              )}
              
              <Compass 
                size={20} 
                strokeWidth={isActive('/communities') ? 2.5 : 2}
                className="relative z-10 transition-all duration-300"
              />
              
              <AnimatePresence mode="wait">
                {isActive('/communities') && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden"
                  >
                    Explore
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Profile - Only if user logged in */}
            {user && (
              <Link
                href="/profile"
                className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                  isActive('/profile') 
                    ? 'text-zinc-900 dark:text-zinc-100' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {isActive('/profile') && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                    transition={{ 
                      type: "spring", 
                      bounce: 0.15,
                      duration: 0.8,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  />
                )}
                
                <User 
                  size={20} 
                  strokeWidth={isActive('/profile') ? 2.5 : 2}
                  className="relative z-10 transition-all duration-300"
                />
                
                <AnimatePresence mode="wait">
                  {isActive('/profile') && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden"
                    >
                      Profile
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Subtle shadow underneath */}
        <div className="absolute inset-0 rounded-full bg-zinc-900/20 blur-xl -z-10" />
      </nav>

      {/* Reduced padding for compact nav */}
      <div className="lg:hidden h-20"></div>
    </>
  );
}
