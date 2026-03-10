import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import VersionSwitcher from "@/components/version-switcher";

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
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="bg-background text-foreground min-h-screen">
        <TooltipProvider>
          {children}
          <VersionSwitcher />
        </TooltipProvider>
      </body>
    </html>
  );
}
