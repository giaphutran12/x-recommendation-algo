import Sidebar from './_components/sidebar';

export default function V5Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1265px]">
      {/* Left: Sidebar */}
      <Sidebar />

      {/* Center: Main content */}
      <main className="min-h-screen w-full max-w-[620px] border-r border-[#2F3336] md:border-l">
        {children}
      </main>

      {/* Right: Algorithm panel (portal target) */}
      <aside className="hidden lg:block lg:w-[350px] xl:w-[390px]">
        <div id="v5-algorithm-panel" />
      </aside>
    </div>
  );
}
