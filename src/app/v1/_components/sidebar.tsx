'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/v1', label: 'Home', icon: Home },
  { href: '/v1/explore', label: 'Explore', icon: Compass },
  { href: '/v1/algorithm', label: 'Algorithm', icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full px-2 xl:px-4 py-4 gap-1">
      <Link href="/v1" className="flex items-center justify-center xl:justify-start mb-4 px-2 xl:px-3">
        <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="#1D9BF0">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Link>

      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/v1' ? pathname === '/v1' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-4 rounded-full px-3 py-3 xl:px-4 transition-colors',
              'hover:bg-[#E7E9EA]/10',
              isActive ? 'font-bold text-[#E7E9EA]' : 'text-[#E7E9EA]'
            )}
          >
            <Icon
              className={cn('w-7 h-7 shrink-0', isActive ? 'stroke-[2.5]' : 'stroke-[1.75]')}
            />
            <span className="hidden xl:block text-xl">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
