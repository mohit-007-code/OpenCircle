// components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { Home, TrendingUp, Users, Plus, Compass } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: TrendingUp, label: 'Popular', href: '/popular' },
    { icon: Compass, label: 'Explore', href: '/communities' },
  ];

  return (
    <aside className="hidden lg:block w-64 h-[calc(100vh-48px)] sticky top-12 overflow-y-auto">
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
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user && (
          <>
            <div className="h-px bg-[#343536] my-3"></div>
            <Link
              href="/communities/create"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#818384] hover:bg-[#272729] hover:text-white transition-colors"
            >
              <Plus size={20} />
              <span>Create Community</span>
            </Link>
          </>
        )}

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
      </div>
    </aside>
  );
}
