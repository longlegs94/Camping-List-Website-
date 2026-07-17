"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { buildGroceryList } from "@/lib/grocery";
import { listFromTemplate } from "@/lib/seed";
import { downloadMyListPdf, downloadSharedListPdf } from "@/lib/pdf";
import { Button, Card, MemberSelect, PageHeader } from "@/components/ui";

export default function ListsPage() {
  const { state, update } = useStore();
  const grocery = buildGroceryList(state);
  const memberId = state.currentMemberId;
  const myPersonal = memberId ? state.personal[memberId]?.length ?? 0 : 0;
  const [busy, setBusy] = useState<string | null>(null);

  const withBusy = async (key: string, job: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await job();
    } finally {
      setBusy(null);
    }
  };

  const chooseMember = (id: string | null) =>
    update((d) => {
      d.currentMemberId = id;
      if (id && !d.personal[id]) d.personal[id] = listFromTemplate(d.personal);
    });

  const lists = [
    {
      href: "/food",
      label: "Combined Grocery List",
      icon: "🛒",
      count: `${grocery.length} items`,
      pdf: "grocery" as const,
    },
    {
      href: "/gear",
      label: "Camping Gear",
      icon: "⛺",
      count: `${state.gear.length} items`,
      pdf: "gear" as const,
    },
    {
      href: "/kitchen",
      label: "Kitchen Supplies",
      icon: "🍽️",
      count: `${state.kitchen.length} items`,
      pdf: "kitchen" as const,
    },
    {
      href: "/personal",
      label: "Personal Packing",
      icon: "🎒",
      count: memberId ? `${myPersonal} items` : "Pick your name",
      pdf: null,
    },
  ];

  return (
    <div>
      <PageHeader title="Lists" subtitle="All your checklists in one place" />

      {/* Print / download the current member's full sheet */}
      {state.members.length > 0 && (
        <Card className="no-print mb-4 space-y-2">
          <div className="font-semibold text-brand-800">
            🖨️ Print your list
          </div>
          <p className="text-xs text-gray-500">
            One PDF with your personal packing list, the gear &amp; kitchen
            items you&apos;re bringing, and the groceries you&apos;re buying.
          </p>
          {memberId ? (
            <Button
              onClick={() =>
                withBusy("me", () => downloadMyListPdf(state, memberId))
              }
              disabled={busy !== null}
            >
              {busy === "me" ? "Preparing…" : "Download my list (PDF)"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">I am</span>
              <MemberSelect
                members={state.members}
                value={null}
                placeholder="Pick your name"
                onChange={chooseMember}
              />
            </div>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {lists.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="flex items-center gap-3 transition hover:border-brand-300 hover:shadow">
              <span className="text-2xl">{l.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-brand-800">{l.label}</div>
                <div className="text-xs text-gray-500">{l.count}</div>
              </div>
              {l.pdf && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void withBusy(l.pdf, () =>
                      downloadSharedListPdf(state, l.pdf)
                    );
                  }}
                  disabled={busy !== null}
                  className="no-print rounded-lg border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                  aria-label={`Download ${l.label} as PDF`}
                >
                  {busy === l.pdf ? "…" : "PDF"}
                </button>
              )}
              <span className="text-brand-300">›</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
