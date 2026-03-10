export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#2F3336] bg-[#000000]/70 backdrop-blur-xl">
      <div className="flex h-[53px] items-center px-4">
        <div className="relative flex h-full items-center">
          <span className="text-[15px] font-bold text-[#E7E9EA]">For You</span>
          <div className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#1D9BF0]" />
        </div>
      </div>
    </header>
  );
}
