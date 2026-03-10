import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "X Algorithm Lab",
  description:
    "Interactive demo of X's tweet recommendation algorithm — explore how engagement signals, candidate retrieval, and neural ranking combine to build your feed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="bg-bg text-text min-h-screen">
        <div className="flex justify-center">
          <div className="flex w-full max-w-[1265px]">
            <aside className="flex-shrink-0 w-[68px] xl:w-[275px] border-r border-border">
              <Sidebar />
            </aside>

            <main className="flex-1 min-w-0 max-w-[600px] border-r border-border">
              {children}
            </main>

            <aside
              id="algorithm-panel"
              className="hidden lg:block flex-shrink-0 w-[350px]"
            />
          </div>
        </div>
      </body>
    </html>
  );
}
