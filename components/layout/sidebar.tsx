"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { navigationItems, isActiveRoute } from "./navigation";

type SidebarProps = {
  profile?: { name: string; businessName: string };
};

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  return (
      <aside className="hidden lg:flex flex-col w-52 bg-white border-r border-slate-100 flex-shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <Logo />
        </div>

        <nav aria-label="Main navigation" className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActiveRoute(pathname, item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={isActiveRoute(pathname, item.href) ? 'text-indigo-600' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {profile && (
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F43F5E, #A855F7)' }} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-700 truncate">{profile.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{profile.businessName}</div>
            </div>
          </div>
        </div>
        )}
      </aside>
  );
}
