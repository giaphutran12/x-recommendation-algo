import type { Metadata } from 'next';
import { Sidebar } from './_components/sidebar';

export const metadata: Metadata = {
  title: 'X Feed — V4',
  description: 'X recommendation algorithm — V4 implementation',
};

export default function V4Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-[#E7E9EA]">
      <div className="mx-auto flex max-w-[1265px] min-h-screen">
        <aside className="sticky top-0 h-screen w-[68px] shrink-0 xl:w-[275px] flex flex-col">
          <Sidebar />
        </aside>

        <main className="flex-1 min-w-0 border-x border-[#2F3336]">
          {children}
        </main>

        <aside
          id="v4-algorithm-panel"
          className="hidden lg:block w-[350px] shrink-0 sticky top-0 h-screen overflow-y-auto"
        />
      </div>
    </div>
  );
}
