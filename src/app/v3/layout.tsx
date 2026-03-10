import Sidebar from './_components/sidebar';

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center bg-black min-h-screen">
      <div className="flex w-full max-w-[1280px]">
        <aside className="flex-shrink-0 w-[68px] xl:w-[275px] border-r border-[#2F3336] self-start sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </aside>

        <main className="flex-1 min-w-0 max-w-[620px] border-r border-[#2F3336]">
          {children}
        </main>

        <aside
          id="v3-algorithm-panel"
          className="hidden lg:block flex-shrink-0 w-[350px] self-start sticky top-0 h-screen overflow-y-auto"
          aria-label="Algorithm control panel"
        />
      </div>
    </div>
  );
}
