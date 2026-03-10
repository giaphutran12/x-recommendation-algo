import type { ReactNode } from 'react';
import { Sidebar } from './_components/sidebar';

export default function V1Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black text-[#E7E9EA]">
      <aside className="sticky top-0 h-screen w-20 shrink-0 xl:w-72 flex flex-col border-r border-[#2F3336]">
        <Sidebar />
      </aside>

      <main className="flex-1 flex justify-center border-r border-[#2F3336] min-w-0">
        <div className="w-full max-w-[600px]">
          {children}
        </div>
      </main>

      <aside
        id="v1-algorithm-panel"
        className="hidden lg:block w-[350px] xl:w-[390px] shrink-0 sticky top-0 h-screen overflow-y-auto"
      />
    </div>
  );
}
