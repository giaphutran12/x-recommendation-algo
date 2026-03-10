'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/v7', label: 'Home', icon: Home },
  { href: '/v7/explore', label: 'Explore', icon: Compass },
  { href: '/v7/algorithm', label: 'Algorithm', icon: SlidersHorizontal },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-20 xl:w-72 flex-shrink-0 hidden md:flex flex-col bg-background border-r border-border">
      <div className="flex flex-col items-start h-full px-3 xl:px-5 py-4">
        <Link
          href="/v7"
          aria-label="X home"
          className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-full transition-colors hover:bg-primary/10"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-7 w-7 fill-primary"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Link>

        <nav className="flex flex-col gap-2 w-full" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/v7'
                ? pathname === '/v7' || pathname === '/v7/'
                : pathname.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-5 rounded-full px-3 py-3 transition-colors hover:bg-foreground/10',
                  isActive && 'font-bold'
                )}
              >
                <Icon
                  aria-hidden="true"
                  className="h-7 w-7 shrink-0 text-foreground"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'hidden xl:inline text-xl leading-snug',
                    isActive ? 'text-foreground font-bold' : 'text-muted-foreground'
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
