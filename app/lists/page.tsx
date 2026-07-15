"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { buildGroceryList } from "@/lib/grocery";
import { Card, PageHeader } from "@/components/ui";

export default function ListsPage() {
  const { state } = useStore();
  const grocery = buildGroceryList(state);
  const myPersonal = state.currentMemberId
    ? state.personal[state.currentMemberId]?.length ?? 0
    : 0;

  const lists = [
    {
      href: "/food",
      label: "Combined Grocery List",
      icon: "🛒",
      count: `${grocery.length} items`,
    },
    {
      href: "/gear",
      label: "Camping Gear",
      icon: "⛺",
      count: `${state.gear.length} items`,
    },
    {
      href: "/kitchen",
      label: "Kitchen Supplies",
      icon: "🍽️",
      count: `${state.kitchen.length} items`,
    },
    {
      href: "/personal",
      label: "Personal Packing",
      icon: "🎒",
      count: state.currentMemberId ? `${myPersonal} items` : "Pick your name",
    },
  ];

  return (
    <div>
      <PageHeader title="Lists" subtitle="All your checklists in one place" />
      <div className="space-y-3">
        {lists.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="flex items-center gap-3 transition hover:border-brand-300 hover:shadow">
              <span className="text-2xl">{l.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-brand-800">{l.label}</div>
                <div className="text-xs text-gray-500">{l.count}</div>
              </div>
              <span className="text-brand-300">›</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
