import type { ReactNode } from 'react';
import Sidebar from './_components/sidebar';

export default function V7Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-background">
      <Sidebar />
      <main className="w-full max-w-[700px] border-x border-border min-h-screen">
        {children}
      </main>
      <aside
        id="v7-algorithm-panel"
        className="sticky top-0 h-screen w-[480px] flex-shrink-0 hidden lg:block overflow-hidden border-l border-border"
      />
    </div>
  );
}
