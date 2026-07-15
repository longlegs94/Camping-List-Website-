"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { buildGroceryList } from "@/lib/grocery";
import { computeProgress, memberName, formatDate } from "@/lib/utils";
import { Button, Card, PageHeader } from "@/components/ui";

export default function ToolsPage() {
  const { state } = useStore();
  const { trip } = state;
  const progress = computeProgress(state);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const buildSummary = () => {
    const unassignedTotal = progress.unassignedItems;
    const perPerson = state.members
      .map((m) => {
        const grocery = buildGroceryList(state).filter(
          (g) => g.assignedMemberId === m.id
        ).length;
        const gear = state.gear.filter((i) => i.assignedMemberId === m.id)
          .length;
        const kitchen = state.kitchen.filter(
          (i) => i.assignedMemberId === m.id
        ).length;
        const meals = state.meals.filter((x) => x.assignedMemberId === m.id)
          .length;
        return `- ${m.name}: ${grocery + gear + kitchen} items, ${meals} meals`;
      })
      .join("\n");

    return [
      `🏕️ ${trip.name || "Camping Trip"}`,
      trip.location && `📍 ${trip.location}`,
      (trip.arrivalDate || trip.departureDate) &&
        `📅 ${formatDate(trip.arrivalDate)} → ${formatDate(trip.departureDate)}`,
      `👥 ${trip.adults} adults, ${trip.children} children`,
      "",
      `Progress: ${progress.percent}% packed`,
      `Meals planned: ${progress.mealsPlanned}`,
      `Unassigned items: ${unassignedTotal}`,
      "",
      perPerson ? "Assigned per person:" : "",
      perPerson,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const copySummary = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(buildSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard errors */
    }
  };

  const grocery = buildGroceryList(state);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return {
      meals: state.meals.filter((m) => m.name.toLowerCase().includes(q)),
      grocery: grocery.filter((g) => g.name.toLowerCase().includes(q)),
      gear: state.gear.filter((i) => i.name.toLowerCase().includes(q)),
      kitchen: state.kitchen.filter((i) => i.name.toLowerCase().includes(q)),
      personal: Object.entries(state.personal)
        .filter(([k]) => k !== "template")
        .flatMap(([memberId, items]) =>
          items
            .filter((i) => i.name.toLowerCase().includes(q))
            .map((i) => ({ ...i, memberId }))
        ),
    };
  }, [search, state, grocery]);

  const resultCount = results
    ? results.meals.length +
      results.grocery.length +
      results.gear.length +
      results.kitchen.length +
      results.personal.length
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Tools & Info" subtitle="Sharing, printing and search" />

      <Card className="no-print space-y-2">
        <div className="text-xs font-medium text-gray-500">
          Share progress
        </div>
        <Button onClick={copySummary}>
          {copied ? "Copied!" : "Copy summary for WhatsApp"}
        </Button>
      </Card>

      <Card className="no-print space-y-2">
        <div className="text-xs font-medium text-gray-500">
          Print &amp; export
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => window.print()}>
            Print-friendly view
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            Export to PDF
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          In the print dialog, choose &quot;Save as PDF&quot; as the
          destination to export a PDF copy.
        </p>
      </Card>

      <Card className="no-print space-y-2">
        <div className="text-xs font-medium text-gray-500">Search everything</div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals, groceries, gear, kitchen, personal…"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        {results && (
          <div className="space-y-3 pt-1">
            {resultCount === 0 && (
              <p className="text-sm text-gray-400">No matches.</p>
            )}
            {results.meals.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Meals
                </div>
                <ul className="space-y-1 text-sm">
                  {results.meals.map((m) => (
                    <li key={m.id}>🍽️ {m.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {results.grocery.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Grocery
                </div>
                <ul className="space-y-1 text-sm">
                  {results.grocery.map((g) => (
                    <li key={g.key}>
                      🛒 {g.name} — {g.quantity} {g.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.gear.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Camping Gear
                </div>
                <ul className="space-y-1 text-sm">
                  {results.gear.map((i) => (
                    <li key={i.id}>⛺ {i.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {results.kitchen.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Kitchen Supplies
                </div>
                <ul className="space-y-1 text-sm">
                  {results.kitchen.map((i) => (
                    <li key={i.id}>🍳 {i.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {results.personal.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Personal Packing
                </div>
                <ul className="space-y-1 text-sm">
                  {results.personal.map((i) => (
                    <li key={i.id}>
                      🎒 {i.name}{" "}
                      <span className="text-xs text-gray-400">
                        ({memberName(state.members, i.memberId)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500">
            Emergency contacts
          </div>
          <Link
            href="/trip"
            className="no-print text-xs font-medium text-brand-600 underline"
          >
            Edit in Trip settings
          </Link>
        </div>
        <p className="whitespace-pre-wrap text-sm">
          {trip.emergencyContacts || (
            <span className="text-gray-400">Not set yet.</span>
          )}
        </p>
      </Card>

      <Card className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500">
            Campground rules
          </div>
          <Link
            href="/trip"
            className="no-print text-xs font-medium text-brand-600 underline"
          >
            Edit in Trip settings
          </Link>
        </div>
        <p className="whitespace-pre-wrap text-sm">
          {trip.campgroundRules || (
            <span className="text-gray-400">Not set yet.</span>
          )}
        </p>
      </Card>

      <Card className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500">Notes</div>
          <Link
            href="/trip"
            className="no-print text-xs font-medium text-brand-600 underline"
          >
            Edit in Trip settings
          </Link>
        </div>
        <p className="whitespace-pre-wrap text-sm">
          {trip.notes || <span className="text-gray-400">Not set yet.</span>}
        </p>
      </Card>

      <div className="no-print grid grid-cols-2 gap-3">
        <Link href="/assignments">
          <Card className="text-center font-semibold text-brand-700 transition hover:border-brand-300">
            🤝 Show all unassigned items
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
