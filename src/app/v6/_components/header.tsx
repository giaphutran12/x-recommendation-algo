'use client';

export function Header() {
  return (
    <header
      className="sticky top-0 z-20 flex border-b border-[#2F3336]"
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <button
        type="button"
        className="flex-1 py-4 text-center text-[15px] font-bold text-[#E7E9EA] hover:bg-white/5 transition-colors relative"
      >
        For You
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[3px] rounded-full bg-[#1D9BF0]" />
      </button>
      <button
        type="button"
        className="flex-1 py-4 text-center text-[15px] font-medium text-[#71767B] hover:bg-white/5 transition-colors"
      >
        Following
      </button>
    </header>
  );
}
