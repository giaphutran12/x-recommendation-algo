import type { ReactNode } from 'react';
import { Sidebar } from './_components/sidebar';

export const metadata = {
  title: 'X Feed — V2',
};

export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-[#E7E9EA]">
      <div className="flex max-w-[1400px] mx-auto">
        <aside className="sticky top-0 h-screen w-[68px] xl:w-[275px] shrink-0 flex flex-col border-r border-[#2F3336]">
          <Sidebar />
        </aside>

        <main className="flex-1 min-w-0 border-r border-[#2F3336]">
          {children}
        </main>

        <aside
          id="v2-algorithm-panel"
          className="hidden lg:block w-[350px] xl:w-[390px] shrink-0"
        />
      </div>
    </div>
  );
}
