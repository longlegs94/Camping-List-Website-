"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { computeProgress, formatDate } from "@/lib/utils";
import { Card, PageHeader, ProgressBar, Stat } from "@/components/ui";
import { Welcome } from "@/components/Welcome";

const LINKS = [
  { href: "/meals", label: "Meals", icon: "🍳" },
  { href: "/food", label: "Food", icon: "🛒" },
  { href: "/gear", label: "Camping Gear", icon: "⛺" },
  { href: "/kitchen", label: "Kitchen Supplies", icon: "🍽️" },
  { href: "/personal", label: "Personal Items", icon: "🎒" },
  { href: "/assignments", label: "Assignments", icon: "🤝" },
  { href: "/members", label: "Group Members", icon: "👥" },
  { href: "/tools", label: "Tools & Info", icon: "🧰" },
];

export default function Dashboard() {
  const { state } = useStore();
  const p = computeProgress(state);
  const { trip } = state;

  return (
    <div className="space-y-5">
      <PageHeader
        title={trip.name || "Our Camping Trip"}
        subtitle={trip.location || "Add a location in Trip settings"}
      />

      <Welcome />

      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-700">Overall progress</span>
          <span className="font-bold text-brand-700">{p.percent}%</span>
        </div>
        <ProgressBar percent={p.percent} />
        <p className="mt-2 text-xs text-gray-500">
          {p.packedItems} of {p.totalItems} items packed
        </p>
      </Card>

      {/* Trip facts */}
      <Card className="!p-3 text-center">
        <div className="text-xs font-medium text-gray-500">Trip dates</div>
        <div className="font-semibold text-brand-700">
          {trip.arrivalDate || trip.departureDate
            ? `${formatDate(trip.arrivalDate)} → ${formatDate(
                trip.departureDate
              )}`
            : "Set dates in Trip settings"}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Adults" value={trip.adults} />
        <Stat label="Children" value={trip.children} />
        <Stat label="Members" value={state.members.length} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Meals" value={p.mealsPlanned} />
        <Stat label="To buy" value={p.toBuy} hint="groceries" />
        <Stat label="Unassigned" value={p.unassignedItems} hint="items" />
        <Stat label="Unpacked" value={p.unpackedItems} hint="items" />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
          Quick links
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="flex items-center gap-3 transition hover:border-brand-300 hover:shadow">
                <span className="text-2xl">{l.icon}</span>
                <span className="font-semibold text-brand-800">{l.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/trip">
          <Card className="text-center font-semibold text-brand-700 transition hover:border-brand-300">
            ⚙️ Trip settings
          </Card>
        </Link>
        <Link href="/my-items">
          <Card className="text-center font-semibold text-brand-700 transition hover:border-brand-300">
            ✅ Show only my items
          </Card>
        </Link>
      </div>
    </div>
  );
}
