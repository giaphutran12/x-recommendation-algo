import Sidebar from "@/components/sidebar";

export default function V0Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[1280px]">
        <aside className="flex-shrink-0 w-[68px] xl:w-[275px] border-r border-border">
          <Sidebar />
        </aside>
        <main className="flex-1 min-w-0 max-w-[620px] border-r border-border">
          {children}
        </main>
        <aside id="algorithm-panel" className="hidden lg:block flex-shrink-0 w-[350px]" />
      </div>
    </div>
  );
}
