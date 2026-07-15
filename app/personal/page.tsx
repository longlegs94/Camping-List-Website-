"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Checklist } from "@/components/Checklist";
import { Card, PageHeader, EmptyState, MemberSelect } from "@/components/ui";
import { uid, personalTemplate } from "@/lib/seed";
import type { ChecklistItem } from "@/lib/types";

const CATEGORIES = [
  "Clothing",
  "Footwear",
  "Toiletries",
  "Health",
  "Electronics",
  "Gear",
  "Sleep",
  "Other",
];

export default function PersonalPage() {
  const { state, update } = useStore();
  const memberId = state.currentMemberId;
  const member = state.members.find((m) => m.id === memberId);

  // Ensure the selected member has a personal list (seeded from template).
  const ensureList = (id: string) =>
    update((d) => {
      if (!d.personal[id]) d.personal[id] = personalTemplate();
    });

  if (!memberId || !member) {
    return (
      <div>
        <PageHeader title="Personal Packing" />
        <EmptyState>
          <p className="mb-3">Choose who you are to see your packing list.</p>
          {state.members.length > 0 ? (
            <MemberSelect
              members={state.members}
              value={null}
              placeholder="Pick your name"
              onChange={(id) => {
                if (id) {
                  ensureList(id);
                  update((d) => {
                    d.currentMemberId = id;
                  });
                }
              }}
            />
          ) : (
            <Link href="/members" className="font-semibold text-brand-600">
              Add group members first →
            </Link>
          )}
        </EmptyState>
      </div>
    );
  }

  const items = state.personal[memberId] ?? [];
  if (!state.personal[memberId]) {
    ensureList(memberId);
  }

  return (
    <div>
      <PageHeader
        title="Personal Packing"
        subtitle={`${member.name}'s list`}
      />
      <Card className="no-print mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Viewing as</span>
        <MemberSelect
          members={state.members}
          value={memberId}
          placeholder="Pick your name"
          onChange={(id) => {
            if (id) ensureList(id);
            update((d) => {
              d.currentMemberId = id;
            });
          }}
        />
      </Card>

      <Checklist
        items={items}
        members={state.members}
        categories={CATEGORIES}
        hideAssign
        onPatch={(id, patch) =>
          update((d) => {
            const it = d.personal[memberId]?.find((x) => x.id === id);
            if (it) Object.assign(it, patch);
          })
        }
        onAdd={(name, category) =>
          update((d) => {
            const it: ChecklistItem = {
              id: uid("chk"),
              name,
              category,
              quantityNeeded: 1,
              quantityAssigned: 0,
              assignedMemberId: memberId,
              status: "assigned",
              notes: "",
              custom: true,
            };
            if (!d.personal[memberId]) d.personal[memberId] = [];
            d.personal[memberId].push(it);
          })
        }
        onRemove={(id) =>
          update((d) => {
            if (d.personal[memberId])
              d.personal[memberId] = d.personal[memberId].filter(
                (x) => x.id !== id
              );
          })
        }
      />
    </div>
  );
}
