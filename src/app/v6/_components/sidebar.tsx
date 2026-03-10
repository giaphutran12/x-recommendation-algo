'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/v6', label: 'Home', icon: Home },
  { href: '/v6/explore', label: 'Explore', icon: Compass },
  { href: '/v6/algorithm', label: 'Algorithm', icon: Settings2 },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-full flex flex-col px-2 xl:px-3 py-3" style={{ backgroundColor: '#000000' }}>
      <Link
        href="/v6"
        className="flex items-center justify-center xl:justify-start p-3 mb-1 rounded-full hover:bg-white/10 transition-colors w-fit"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 fill-[#E7E9EA]">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Link>

      <div className="flex flex-col gap-1 mt-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/v6' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-[#E7E9EA] hover:bg-white/10',
                'text-xl font-normal xl:text-[19px]',
                active && 'font-bold'
              )}
            >
              <Icon size={26} strokeWidth={active ? 2.5 : 2} />
              <span className="hidden xl:block">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
