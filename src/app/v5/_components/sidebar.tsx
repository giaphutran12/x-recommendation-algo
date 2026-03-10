'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/v5', label: 'Home', icon: Home },
  { href: '/v5#explore', label: 'Explore', icon: Search },
  { href: '/v5#algorithm', label: 'Algorithm', icon: SlidersHorizontal },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen flex-shrink-0 hidden md:flex flex-col items-end border-r border-[#2F3336]">
      <div className="flex flex-col items-start xl:w-[275px] w-[68px] h-full px-2 py-3">
        {/* X Logo */}
        <Link
          href="/v5"
          className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full transition-colors hover:bg-[#E7E9EA]/10"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#E7E9EA]">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 w-full">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href === '/v5' && pathname === '/v5');
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  'group flex items-center gap-5 rounded-full px-3 py-3 transition-colors hover:bg-[#E7E9EA]/10',
                  isActive && 'font-bold'
                )}
              >
                <Icon
                  className={cn(
                    'h-[26px] w-[26px] shrink-0',
                    isActive ? 'text-[#E7E9EA]' : 'text-[#E7E9EA]'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'hidden xl:inline text-xl',
                    isActive ? 'text-[#E7E9EA] font-bold' : 'text-[#E7E9EA]'
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
