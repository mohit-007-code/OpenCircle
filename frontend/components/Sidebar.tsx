// components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { Home, TrendingUp, Users, Plus, Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: TrendingUp, label: 'Popular', href: '/popular' },
    { icon: Compass, label: 'Explore', href: '/communities' },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div 
          className={`fixed top-12 left-0 h-[calc(100vh-48px)] overflow-y-auto border-r border-[#343536] bg-[#0b0f14] transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-[#272729] text-white font-medium'
                      : 'text-[#818384] hover:bg-[#272729] hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {user && (
              <>
                <div className="h-px bg-[#343536] my-3"></div>
                <Link
                  href="/communities/create"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#818384] hover:bg-[#272729] hover:text-white transition-colors"
                  title={isCollapsed ? 'Create Community' : ''}
                >
                  <Plus size={20} />
                  {!isCollapsed && <span>Create Community</span>}
                </Link>
              </>
            )}

            {!isCollapsed && (
              <>
                <div className="h-px bg-[#343536] my-3"></div>
                
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-[#818384] uppercase mb-2">Your Communities</h3>
                  <Link
                    href="/communities"
                    className="block py-1 text-sm text-[#818384] hover:text-white transition-colors"
                  >
                    View all →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden lg:flex fixed top-16 z-50 items-center justify-center w-8 h-8 bg-[#1a1a1b] border border-[#343536] rounded-full hover:bg-[#272729] transition-all duration-300 ${
          isCollapsed ? 'left-12' : 'left-60'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight size={16} className="text-[#818384]" />
        ) : (
          <ChevronLeft size={16} className="text-[#818384]" />
        )}
      </button>
    </>
  );
}
