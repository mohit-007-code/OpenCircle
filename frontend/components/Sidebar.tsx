// components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { Home, TrendingUp, Plus, Compass, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';


export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);


  const isActive = (path: string) => {
    if (path === '/communities/create') {
      return pathname === '/communities/create';
    }
    if (path === '/communities') {
      return pathname === '/communities' || (pathname.startsWith('/communities/') && pathname !== '/communities/create');
    }
    if (path === '/profile') {
      return pathname === '/profile' || pathname.startsWith('/profile/');
    }
    if (path === '/popular') {
      return pathname === '/popular';
    }
    if (path === '/') {
      return pathname === '/';
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
      {/* Desktop Sidebar */}
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
          <LayoutGroup id="desktop-sidebar">
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
                          ? 'text-zinc-900 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      {active && (
                        <>
                          <motion.div
                            layoutId="desktopActiveTab"
                            className="absolute inset-0 bg-white rounded-xl shadow-lg"
                            transition={{ 
                              type: "spring", 
                              stiffness: 500,
                              damping: 30,
                              mass: 0.8
                            }}
                          />
                          <motion.div
                            layoutId="desktopActiveBar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                            transition={{ 
                              type: "spring", 
                              stiffness: 500,
                              damping: 30,
                              mass: 0.8
                            }}
                          />
                        </>
                      )}
                      
                      <Icon 
                        size={20} 
                        className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                          active ? 'text-zinc-950' : 'group-hover:scale-110'
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
                          ? 'text-zinc-900 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                      }`}
                      title={isCollapsed ? 'Create Community' : ''}
                    >
                      {isActive('/communities/create') && (
                        <>
                          <motion.div
                            layoutId="desktopActiveTab"
                            className="absolute inset-0 bg-white rounded-xl shadow-lg"
                            transition={{ 
                              type: "spring", 
                              stiffness: 500,
                              damping: 30,
                              mass: 0.8
                            }}
                          />
                          <motion.div
                            layoutId="desktopActiveBar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                            transition={{ 
                              type: "spring", 
                              stiffness: 500,
                              damping: 30,
                              mass: 0.8
                            }}
                          />
                        </>
                      )}

                      <Plus 
                        size={20} 
                        className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                          isActive('/communities/create') ? 'text-zinc-950' : 'group-hover:rotate-90 group-hover:scale-110'
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
                        className="flex items-center justify-between py-1.5 px-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-lg transition-all duration-300 group"
                      >
                        <span>View all</span>
                        <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
        </div>
      </aside>


      {/* Desktop Toggle Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`hidden lg:flex fixed top-20 z-50 items-center justify-center w-10 h-10 glass-effect bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/50 transition-all duration-300 shadow-lg hover:shadow-white/10 group ${
          isCollapsed ? 'left-12' : 'left-60'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        suppressHydrationWarning
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
              <ChevronRight size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
            </motion.div>
          ) : (
            <motion.div
              key="left"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>


      {/* ✅ FINAL FIX: Mobile Floating Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]" style={{ pointerEvents: 'auto' }}>
        <LayoutGroup>
          <motion.div 
            layout
            className="glass-effect backdrop-blur-2xl bg-white/10 dark:bg-zinc-900/90 border border-zinc-700/30 rounded-full shadow-2xl shadow-black/30 px-2 py-2"
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 0.8
            }}
          >
            <div className="flex items-center justify-center gap-1">
              {/* Home */}
              <Link
                href="/"
                className="relative flex items-center gap-2 px-4 py-3 rounded-full transition-colors duration-200"
                style={{ overflow: 'hidden' }}
              >
                {isActive('/') && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      backgroundColor: '#ffffff',
                      zIndex: 0
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8
                    }}
                  />
                )}
                
                <Home 
                  size={20} 
                  strokeWidth={isActive('/') ? 2.5 : 2}
                  className="relative transition-all duration-200"
                  style={{ 
                    color: isActive('/') ? '#18181b' : '#a1a1aa',
                    zIndex: 10
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {isActive('/') && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500,
                        damping: 30
                      }}
                      className="font-semibold text-sm whitespace-nowrap overflow-hidden text-zinc-900"
                      style={{ position: 'relative', zIndex: 10 }}
                    >
                      Home
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>


              {/* Popular */}
              <Link
                href="/popular"
                className="relative flex items-center gap-2 px-4 py-3 rounded-full transition-colors duration-200"
                style={{ overflow: 'hidden' }}
              >
                {isActive('/popular') && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      backgroundColor: '#ffffff',
                      zIndex: 0
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8
                    }}
                  />
                )}
                
                <TrendingUp 
                  size={20} 
                  strokeWidth={isActive('/popular') ? 2.5 : 2}
                  className="relative transition-all duration-200"
                  style={{ 
                    color: isActive('/popular') ? '#18181b' : '#a1a1aa',
                    zIndex: 10
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {isActive('/popular') && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500,
                        damping: 30
                      }}
                      className="font-semibold text-sm whitespace-nowrap overflow-hidden text-zinc-900"
                      style={{ position: 'relative', zIndex: 10 }}
                    >
                      Popular
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>


              {/* Create */}
              {user && (
                <Link
                  href="/communities/create"
                  className="relative flex items-center gap-2 px-4 py-3 rounded-full transition-colors duration-200"
                  style={{ overflow: 'hidden' }}
                >
                  {isActive('/communities/create') && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute inset-0 rounded-full"
                      style={{ 
                        backgroundColor: '#ffffff',
                        zIndex: 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8
                      }}
                    />
                  )}

                  <Plus 
                    size={20} 
                    strokeWidth={isActive('/communities/create') ? 2.5 : 2}
                    className="relative transition-all duration-200"
                    style={{ 
                      color: isActive('/communities/create') ? '#18181b' : '#a1a1aa',
                      zIndex: 10
                    }}
                  />

                  <AnimatePresence mode="wait">
                    {isActive('/communities/create') && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500,
                          damping: 30
                        }}
                        className="font-semibold text-sm whitespace-nowrap overflow-hidden text-zinc-900"
                        style={{ position: 'relative', zIndex: 10 }}
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
                className="relative flex items-center gap-2 px-4 py-3 rounded-full transition-colors duration-200"
                style={{ overflow: 'hidden' }}
              >
                {isActive('/communities') && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      backgroundColor: '#ffffff',
                      zIndex: 0
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8
                    }}
                  />
                )}
                
                <Compass 
                  size={20} 
                  strokeWidth={isActive('/communities') ? 2.5 : 2}
                  className="relative transition-all duration-200"
                  style={{ 
                    color: isActive('/communities') ? '#18181b' : '#a1a1aa',
                    zIndex: 10
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {isActive('/communities') && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500,
                        damping: 30
                      }}
                      className="font-semibold text-sm whitespace-nowrap overflow-hidden text-zinc-900"
                      style={{ position: 'relative', zIndex: 10 }}
                    >
                      Explore
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>


              {/* ✅ Profile - COMPLETELY FIXED */}
              {user && (
                <Link
                  href="/profile"
                  className="relative flex items-center gap-2 px-4 py-3 rounded-full transition-colors duration-200"
                  style={{ overflow: 'hidden' }}
                >
                  {isActive('/profile') && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute inset-0 rounded-full"
                      style={{ 
                        backgroundColor: '#ffffff',
                        zIndex: 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8
                      }}
                    />
                  )}
                  
                  <User 
                    size={20} 
                    strokeWidth={isActive('/profile') ? 2.5 : 2}
                    className="relative transition-all duration-200"
                    style={{ 
                      color: isActive('/profile') ? '#18181b' : '#a1a1aa',
                      zIndex: 10
                    }}
                  />
                  
                  <AnimatePresence mode="wait">
                    {isActive('/profile') && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500,
                          damping: 30
                        }}
                        className="font-semibold text-sm whitespace-nowrap overflow-hidden text-zinc-900"
                        style={{ position: 'relative', zIndex: 10 }}
                      >
                        Profile
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}
            </div>
          </motion.div>
        </LayoutGroup>

        <div className="absolute inset-0 rounded-full bg-zinc-900/20 blur-xl -z-10" />
      </nav>

      {/* Mobile Bottom Spacer */}
      <div className="lg:hidden h-20" />
    </>
  );
}
