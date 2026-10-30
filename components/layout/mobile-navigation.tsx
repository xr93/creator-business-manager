"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { navigationItems, isActiveRoute } from "./navigation";

export function MobileHeader() {
  const pathname = usePathname();
  const active = navigationItems.find((item) => isActiveRoute(pathname, item.href));
  const title = active?.href === "/collaborations" ? "Collaborations" : active?.label;
  return (
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <Logo />
          <span className="text-sm font-semibold text-slate-600">{title}</span>
        </header>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  return (
        <nav aria-label="Mobile navigation" className="lg:hidden flex border-t border-slate-100 bg-white flex-shrink-0">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                isActiveRoute(pathname, item.href) ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.icon}
              <span className="text-[9px] sm:text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>
  );
}
