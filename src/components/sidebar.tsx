import Link from "next/link";
import { Home, Search, Settings } from "lucide-react";

const XLogoSVG = (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="w-8 h-8 fill-current text-[#1d9bf0]"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const navItems = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/explore", label: "Explore", Icon: Search },
  { href: "#algorithm-panel", label: "Algorithm", Icon: Settings },
];

export default function Sidebar() {
  return (
    <nav
      className="sticky top-0 h-screen flex flex-col px-2 xl:px-4 py-2"
      aria-label="Main navigation"
    >
      <div className="mb-2 px-3 py-3">
        <Link href="/" aria-label="X Algorithm Lab home">
          {XLogoSVG}
        </Link>
      </div>

      <ul className="flex flex-col gap-1" role="list">
        {navItems.map(({ href, label, Icon }) => (
          <li key={href} role="listitem">
            <Link
              href={href}
              className="flex items-center gap-4 px-4 py-3 rounded-full h-auto w-fit xl:w-full text-[#e7e9ea] hover:bg-[#e7e9ea]/10 transition-colors duration-150"
            >
              <Icon className="flex-shrink-0 size-[26px]" aria-hidden="true" />
              <span className="hidden xl:block text-[18px] font-normal leading-6 truncate">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
