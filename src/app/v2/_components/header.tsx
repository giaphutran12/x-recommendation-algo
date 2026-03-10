export function Header() {
  return (
    <div
      className="sticky top-0 z-10 flex items-center px-4 h-[53px] border-b border-[#2F3336]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
    >
      <h2 className="text-[#E7E9EA] text-[20px] font-extrabold">For You</h2>
    </div>
  );
}
