'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/v2', icon: Home, label: 'Home' },
  { href: '/v2/explore', icon: Search, label: 'Explore' },
  { href: '/v2/algorithm', icon: Sliders, label: 'Algorithm' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full px-2 xl:px-4 py-3">
      <Link href="/v2" className="flex items-center justify-center xl:justify-start mb-6 p-2 rounded-full hover:bg-white/5 transition-colors w-fit">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#1D9BF0]" aria-label="X">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/v2' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-4 p-3 rounded-full transition-colors',
                'hover:bg-white/5',
                isActive ? 'font-bold' : 'font-normal'
              )}
            >
              <Icon
                className={cn('w-7 h-7 shrink-0', isActive ? 'text-[#E7E9EA]' : 'text-[#E7E9EA]')}
              />
              <span className="hidden xl:block text-[#E7E9EA] text-[19px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
