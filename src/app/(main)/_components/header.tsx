'use client';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/60 backdrop-blur-[12px]">
      <div className="flex h-[53px] items-center mx-4 px-8">
        <h1 className="text-[20px] font-bold leading-none text-foreground">
          For You
        </h1>
      </div>
    </header>
  );
}
