'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/v4', label: 'Home', icon: Home },
  { href: '/v4/explore', label: 'Explore', icon: Search },
  { href: '/v4/algorithm', label: 'Algorithm', icon: Cpu },
] as const;

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-8 fill-[#E7E9EA]" aria-label="X">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full px-2 py-3 xl:px-3">
      <Link
        href="/v4"
        className="flex items-center justify-center xl:justify-start p-3 mb-2 rounded-full hover:bg-white/5 transition-colors w-fit"
      >
        <XLogo />
      </Link>

      <div className="flex flex-col gap-0.5 mt-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/v4' ? pathname === '/v4' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 rounded-full transition-all duration-150 group w-fit xl:w-full',
                'hover:bg-white/10',
                isActive ? 'font-bold' : 'font-normal',
              )}
            >
              <Icon
                className={cn(
                  'size-[26px] shrink-0',
                  isActive ? 'text-[#E7E9EA]' : 'text-[#E7E9EA]',
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  'hidden xl:block text-[20px] leading-[24px] text-[#E7E9EA]',
                  isActive ? 'font-bold' : 'font-normal',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
