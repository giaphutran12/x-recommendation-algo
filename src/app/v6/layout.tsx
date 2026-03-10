import type { ReactNode } from 'react';
import { Sidebar } from './_components/sidebar';

export const metadata = {
  title: 'X Feed — v6',
};

export default function V6Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: '#000000', color: '#E7E9EA' }}
    >
      <div className="fixed left-0 top-0 h-full w-16 xl:w-64 z-30 border-r border-[#2F3336]">
        <Sidebar />
      </div>

      <main className="flex-1 ml-16 xl:ml-64 mr-0 lg:mr-80 xl:mr-[350px] flex justify-center border-x border-[#2F3336] min-h-screen">
        <div className="w-full max-w-[600px]">{children}</div>
      </main>

      <div
        id="v6-algorithm-panel"
        className="hidden lg:flex fixed right-0 top-0 h-full w-80 xl:w-[350px] flex-col overflow-y-auto border-l border-[#2F3336]"
        style={{ backgroundColor: '#000000' }}
      />
    </div>
  );
}
