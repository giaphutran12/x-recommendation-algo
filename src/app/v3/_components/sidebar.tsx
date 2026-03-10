'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Settings2, User, Bell, Mail, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWER_USERNAME = 'alice_tech';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/v3', icon: Home, label: 'Home' },
  { href: '/v3/explore', icon: Compass, label: 'Explore' },
  { href: '/v3/notifications', icon: Bell, label: 'Notifications' },
  { href: '/v3/messages', icon: Mail, label: 'Messages' },
  { href: '/v3/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '#algorithm', icon: Settings2, label: 'Algorithm' },
  { href: `/v3/profile/${VIEWER_USERNAME}`, icon: User, label: 'Profile' },
];

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href.startsWith('#')) return false;
    if (href === '/v3') return pathname === '/v3';
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col h-full py-2 px-2 xl:px-4" aria-label="Main navigation">
      <Link
        href="/v3"
        className="flex items-center justify-center xl:justify-start p-3 mb-1 rounded-full hover:bg-[#E7E9EA]/10 text-[#1D9BF0] transition-colors w-fit"
        aria-label="X home"
      >
        <XLogo />
      </Link>

      <ul className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-full transition-colors group w-fit xl:w-full',
                  'hover:bg-[#E7E9EA]/10',
                  active ? 'font-bold text-[#E7E9EA]' : 'text-[#E7E9EA]',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('w-7 h-7 flex-shrink-0', active && 'stroke-[2.5px]')} />
                <span className="hidden xl:block text-xl">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
