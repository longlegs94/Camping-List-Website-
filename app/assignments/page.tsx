"use client";

import { useStore } from "@/lib/store";
import { buildGroceryList } from "@/lib/grocery";
import { Card, EmptyState, MemberSelect, PageHeader } from "@/components/ui";
import { sharedChecklistItems } from "@/lib/utils";
import type { GroceryLine } from "@/lib/types";

export default function AssignmentsPage() {
  const { state, update } = useStore();
  const grocery = buildGroceryList(state);
  // Personal packing items are per-person by definition, so only shared
  // gear & kitchen items take part in assignment.
  const items = sharedChecklistItems(state);

  // Reassign helpers.
  const reassignChecklist = (id: string, memberId: string | null) =>
    update((d) => {
      for (const it of [...d.gear, ...d.kitchen]) {
        if (it.id === id) {
          it.assignedMemberId = memberId;
          if (memberId && it.status === "unassigned") it.status = "assigned";
          if (!memberId) it.status = "unassigned";
        }
      }
    });

  const reassignGrocery = (line: GroceryLine, memberId: string | null) =>
    update((d) => {
      if (line.manualId) {
        const m = d.manualGrocery.find((x) => x.id === line.manualId);
        if (m) m.assignedMemberId = memberId;
      } else {
        d.groceryOverrides[line.key] = {
          ...d.groceryOverrides[line.key],
          assignedMemberId: memberId,
        };
      }
    });

  const unassignedItems = items.filter((i) => !i.assignedMemberId);
  const unassignedGrocery = grocery.filter((g) => !g.assignedMemberId);
  const missingQty = items.filter((i) => i.quantityNeeded === 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments"
        subtitle="Who is bringing what — and what's still open"
      />

      {/* Alerts */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {unassignedItems.length + unassignedGrocery.length}
          </div>
          <div className="text-xs text-gray-500">Unassigned items</div>
        </Card>
        <Card className="!p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {missingQty.length}
          </div>
          <div className="text-xs text-gray-500">Missing quantities</div>
        </Card>
      </div>

      {/* Per member */}
      {state.members.length === 0 && (
        <EmptyState>Add members to start assigning items.</EmptyState>
      )}

      {state.members.map((m) => {
        const myItems = items.filter((i) => i.assignedMemberId === m.id);
        const myGrocery = grocery.filter((g) => g.assignedMemberId === m.id);
        const total = myItems.length + myGrocery.length;
        return (
          <Card key={m.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-brand-800">{m.name}</span>
              <span className="text-xs text-gray-400">{total} assigned</span>
            </div>
            {total === 0 ? (
              <p className="text-sm text-gray-400">Nothing assigned yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {myItems.map((x) => (
                  <li key={x.id}>
                    📦 {x.name}{" "}
                    <span className="text-xs text-gray-400">({x.status})</span>
                  </li>
                ))}
                {myGrocery.map((x) => (
                  <li key={x.key}>
                    🛒 {x.name} — {x.quantity} {x.unit}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      {/* Unassigned bucket with quick reassign */}
      <div>
        <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-amber-600">
          Unassigned
        </h2>
        <div className="space-y-2">
          {unassignedItems.map((x) => (
            <Card key={x.id} className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">📦 {x.name}</span>
                <MemberSelect
                  members={state.members}
                  value={null}
                  onChange={(id) => reassignChecklist(x.id, id)}
                />
              </div>
            </Card>
          ))}
          {unassignedGrocery.map((x) => (
            <Card key={x.key} className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  🛒 {x.name} — {x.quantity} {x.unit}
                </span>
                <MemberSelect
                  members={state.members}
                  value={null}
                  onChange={(id) => reassignGrocery(x, id)}
                />
              </div>
            </Card>
          ))}
          {unassignedItems.length === 0 && unassignedGrocery.length === 0 && (
            <EmptyState>Everything is assigned. 🎉</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
