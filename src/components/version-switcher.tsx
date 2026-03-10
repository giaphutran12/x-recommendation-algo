'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const VERSIONS = [
  { label: 'V0', path: '/' },
  { label: 'V1', path: '/v1' },
  { label: 'V1.1', path: '/v1.1' },
  { label: 'V2', path: '/v2' },
  { label: 'V3', path: '/v3' },
  { label: 'V4', path: '/v4' },
  { label: 'V5', path: '/v5' },
  { label: 'V6', path: '/v6' },
  { label: 'V7', path: '/v7' },
  { label: 'V8', path: '/v8' },
  { label: 'V9', path: '/v9' },
];

export default function VersionSwitcher() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/(v0)') || pathname.startsWith('/profile');
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1 px-2 py-1.5 bg-[#16181C]/90 backdrop-blur-xl border border-[#2f3336] rounded-full shadow-lg shadow-black/50">
      {VERSIONS.map((version) => (
        <Link
          key={version.label}
          href={version.path}
          prefetch={true}
          className={cn(
            'px-3 py-1 rounded-full text-sm transition-colors',
            isActive(version.path)
              ? 'bg-[#1D9BF0] text-white font-semibold'
              : 'text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#ffffff08]'
          )}
        >
          {version.label}
        </Link>
      ))}
    </div>
  );
}
