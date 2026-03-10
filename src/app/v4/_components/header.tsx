'use client';

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-[#2F3336]">
      <div className="px-4 py-3">
        <div className="flex gap-0 border-b border-transparent -mb-[13px]">
          <button
            className="flex-1 flex justify-center pb-4 relative group"
            aria-label="For you"
          >
            <span className="text-[15px] font-bold text-[#E7E9EA]">For you</span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-[56px] rounded-full bg-[#1D9BF0]" />
          </button>
          <button
            className="flex-1 flex justify-center pb-4 relative group"
            aria-label="Following"
          >
            <span className="text-[15px] font-medium text-[#71767B] group-hover:text-[#E7E9EA] transition-colors">
              Following
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
