export default function Header() {
  return (
    <header
      className="sticky top-0 z-10 border-b border-[#2F3336]"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="flex"
        role="tablist"
        aria-label="Feed tabs"
      >
        <button
          className="flex-1 py-4 text-[#E7E9EA] font-bold text-[15px] border-b-2 border-[#1D9BF0] hover:bg-[#E7E9EA]/5 transition-colors"
          role="tab"
          aria-selected={true}
        >
          For You
        </button>
        <button
          className="flex-1 py-4 text-[#71767B] font-bold text-[15px] hover:bg-[#E7E9EA]/5 transition-colors"
          role="tab"
          aria-selected={false}
        >
          Following
        </button>
      </div>
    </header>
  );
}
