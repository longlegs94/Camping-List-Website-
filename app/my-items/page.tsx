"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { buildGroceryList } from "@/lib/grocery";
import {
  Card,
  EmptyState,
  MemberSelect,
  PageHeader,
  ProgressBar,
} from "@/components/ui";
import { uid, listFromTemplate } from "@/lib/seed";
import type { ChecklistItem } from "@/lib/types";

function isDone(status: ChecklistItem["status"]): boolean {
  return status === "packed" || status === "complete";
}

export default function MyItemsPage() {
  const { state, update } = useStore();
  const memberId = state.currentMemberId;
  const member = state.members.find((m) => m.id === memberId);

  const chooseMember = (id: string | null) =>
    update((d) => {
      d.currentMemberId = id;
      if (id && !d.personal[id]) d.personal[id] = listFromTemplate(d.personal);
    });

  if (state.members.length === 0) {
    return (
      <div>
        <PageHeader title="My Items" subtitle="Your personal to-do list" />
        <EmptyState>
          <p className="mb-3">No group members yet.</p>
          <Link href="/members" className="font-semibold text-brand-600">
            Add group members first →
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (!memberId || !member) {
    return (
      <div>
        <PageHeader title="My Items" subtitle="Your personal to-do list" />
        <EmptyState>
          <p className="mb-3">Choose who you are to see your items.</p>
          <MemberSelect
            members={state.members}
            value={null}
            placeholder="Pick your name"
            onChange={chooseMember}
          />
        </EmptyState>
      </div>
    );
  }

  const myMeals = state.meals.filter((m) => m.assignedMemberId === memberId);
  const myChecklistItems = [
    ...state.gear.map((i) => ({ ...i, source: "gear" as const })),
    ...state.kitchen.map((i) => ({ ...i, source: "kitchen" as const })),
  ].filter((i) => i.assignedMemberId === memberId);
  const myGrocery = buildGroceryList(state).filter(
    (g) => g.assignedMemberId === memberId
  );
  const myPersonal = state.personal[memberId] ?? [];

  const toggleChecklistItem = (id: string, source: "gear" | "kitchen") =>
    update((d) => {
      const list = source === "gear" ? d.gear : d.kitchen;
      const it = list.find((x) => x.id === id);
      if (!it) return;
      it.status = isDone(it.status) ? "assigned" : "packed";
    });

  const toggleGrocery = (line: (typeof myGrocery)[number]) =>
    update((d) => {
      if (line.manualId) {
        const m = d.manualGrocery.find((x) => x.id === line.manualId);
        if (m) m.packed = !m.packed;
      } else {
        d.groceryOverrides[line.key] = {
          ...d.groceryOverrides[line.key],
          packed: !line.packed,
        };
      }
    });

  const togglePersonal = (id: string) =>
    update((d) => {
      const it = d.personal[memberId]?.find((x) => x.id === id);
      if (!it) return;
      it.status = isDone(it.status) ? "assigned" : "packed";
    });

  const doneCount =
    myChecklistItems.filter((i) => isDone(i.status)).length +
    myGrocery.filter((g) => g.packed).length +
    myPersonal.filter((i) => isDone(i.status)).length;
  const totalCount = myChecklistItems.length + myGrocery.length + myPersonal.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="space-y-5">
      <PageHeader title="My Items" subtitle="Your personal to-do list" />

      <Card className="no-print flex items-center gap-2 text-sm">
        <span className="text-gray-500">Viewing as</span>
        <MemberSelect
          members={state.members}
          value={memberId}
          placeholder="Pick your name"
          onChange={chooseMember}
        />
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-700">Your progress</span>
          <span className="font-bold text-brand-700">{percent}%</span>
        </div>
        <ProgressBar percent={percent} />
        <p className="mt-2 text-xs text-gray-500">
          {doneCount} of {totalCount} items done
        </p>
      </Card>

      {/* Assigned meals */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
          Assigned Meals
        </h3>
        {myMeals.length === 0 ? (
          <EmptyState>No meals assigned to you.</EmptyState>
        ) : (
          <div className="space-y-2">
            {myMeals.map((m) => (
              <Card key={m.id} className="!p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span>🍽️</span>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs text-gray-400">
                    ({m.type}
                    {m.date ? `, ${m.date}` : ""})
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Gear & kitchen */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
          Assigned Gear &amp; Kitchen
        </h3>
        {myChecklistItems.length === 0 ? (
          <EmptyState>No gear or kitchen items assigned to you.</EmptyState>
        ) : (
          <div className="space-y-2">
            {myChecklistItems.map((i) => (
              <Card key={i.id} className="!p-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="big-check"
                    checked={isDone(i.status)}
                    onChange={() => toggleChecklistItem(i.id, i.source)}
                    aria-label={`Mark ${i.name} packed`}
                  />
                  <span
                    className={`flex-1 font-medium ${
                      isDone(i.status) ? "text-gray-400 line-through" : ""
                    }`}
                  >
                    {i.source === "gear" ? "⛺" : "🍽️"} {i.name}
                  </span>
                  <span className="text-xs text-gray-400">{i.category}</span>
                </label>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Grocery */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
          My Grocery Items
        </h3>
        {myGrocery.length === 0 ? (
          <EmptyState>No grocery items assigned to you.</EmptyState>
        ) : (
          <div className="space-y-2">
            {myGrocery.map((g) => (
              <Card key={g.key} className="!p-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="big-check"
                    checked={g.packed}
                    onChange={() => toggleGrocery(g)}
                    aria-label={`Mark ${g.name} packed`}
                  />
                  <span
                    className={`flex-1 font-medium ${
                      g.packed ? "text-gray-400 line-through" : ""
                    }`}
                  >
                    🛒 {g.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {g.quantity} {g.unit}
                  </span>
                </label>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Personal packing */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
          My Personal Packing
        </h3>
        {myPersonal.length === 0 ? (
          <EmptyState>Your personal packing list is empty.</EmptyState>
        ) : (
          <div className="space-y-2">
            {myPersonal.map((i) => (
              <Card key={i.id} className="!p-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="big-check"
                    checked={isDone(i.status)}
                    onChange={() => togglePersonal(i.id)}
                    aria-label={`Mark ${i.name} packed`}
                  />
                  <span
                    className={`flex-1 font-medium ${
                      isDone(i.status) ? "text-gray-400 line-through" : ""
                    }`}
                  >
                    🎒 {i.name}
                  </span>
                  <span className="text-xs text-gray-400">{i.category}</span>
                </label>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
