"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const BOTTOM = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/meals", label: "Meals", icon: "🍳" },
  { href: "/lists", label: "Lists", icon: "📋" },
  { href: "/assignments", label: "Assign", icon: "🤝" },
  { href: "/my-items", label: "My Items", icon: "✅" },
];

const SYNC_LABEL: Record<string, { text: string; cls: string }> = {
  local: { text: "· offline", cls: "text-gray-300" },
  saving: { text: "· saving…", cls: "text-amber-500" },
  synced: { text: "· live", cls: "text-brand-500" },
  error: { text: "· offline", cls: "text-red-400" },
};

export function TopBar() {
  const { state, syncStatus } = useStore();
  const me = state.members.find((m) => m.id === state.currentMemberId);
  const sync = SYNC_LABEL[syncStatus];
  return (
    <header className="no-print sticky top-0 z-20 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🏕️</span>
          <span className="font-bold text-brand-800">
            {state.trip.name || "Camping Planner"}
          </span>
          <span className={`text-[10px] font-medium ${sync.cls}`}>
            {sync.text}
          </span>
        </Link>
        <Link
          href="/members"
          className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
        >
          {me ? `👤 ${me.name}` : "Choose name"}
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-3xl">
        {BOTTOM.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-brand-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
