"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { uid, listFromTemplate } from "@/lib/seed";
import { sharedChecklistItems } from "@/lib/utils";
import { buildGroceryList } from "@/lib/grocery";

export default function MembersPage() {
  const { state, update } = useStore();
  const [name, setName] = useState("");
  const [diet, setDiet] = useState("");
  const [allergies, setAllergies] = useState("");

  const grocery = buildGroceryList(state);
  const items = sharedChecklistItems(state);

  const addMember = () => {
    if (!name.trim()) return;
    const id = uid("mem");
    update((d) => {
      d.members.push({
        id,
        name: name.trim(),
        dietaryRestrictions: diet.trim(),
        allergies: allergies.trim(),
      });
      d.personal[id] = listFromTemplate(d.personal);
      // First member becomes the current user on this device if none set.
      if (!d.currentMemberId) d.currentMemberId = id;
    });
    setName("");
    setDiet("");
    setAllergies("");
  };

  const responsibilities = (memberId: string) => {
    const assignedItems = items.filter((i) => i.assignedMemberId === memberId);
    const assignedGrocery = grocery.filter(
      (g) => g.assignedMemberId === memberId
    );
    const personal = state.personal[memberId] ?? [];
    const doneCount =
      assignedItems.filter(
        (i) => i.status === "packed" || i.status === "complete"
      ).length +
      assignedGrocery.filter((g) => g.packed).length +
      personal.filter((i) => i.status === "packed" || i.status === "complete")
        .length;
    const total = assignedItems.length + assignedGrocery.length + personal.length;
    return {
      assignedItems,
      assignedGrocery,
      personal,
      doneCount,
      total,
      percent: total === 0 ? 0 : Math.round((doneCount / total) * 100),
    };
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Group Members"
        subtitle="Add people, then set who you are"
      />

      <Card className="no-print space-y-2">
        <label className="text-xs font-medium text-gray-500">Add member</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            placeholder="Dietary restrictions"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Allergies"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <Button onClick={addMember}>Add member</Button>
      </Card>

      {state.members.length === 0 && (
        <EmptyState>No members yet. Add the first one above.</EmptyState>
      )}

      <div className="space-y-3">
        {state.members.map((m) => {
          const r = responsibilities(m.id);
          const isMe = state.currentMemberId === m.id;
          return (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-800">
                      {m.name}
                    </span>
                    {isMe && (
                      <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        You
                      </span>
                    )}
                  </div>
                  {(m.dietaryRestrictions || m.allergies) && (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {m.dietaryRestrictions && (
                        <span>🥗 {m.dietaryRestrictions} </span>
                      )}
                      {m.allergies && <span>⚠️ {m.allergies}</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-brand-600">
                    {r.percent}%
                  </span>
                  {!isMe && (
                    <button
                      onClick={() =>
                        update((d) => {
                          d.currentMemberId = m.id;
                          if (!d.personal[m.id])
                            d.personal[m.id] = listFromTemplate(d.personal);
                        })
                      }
                      className="no-print text-xs font-medium text-brand-600 underline"
                    >
                      This is me
                    </button>
                  )}
                  <button
                    onClick={() =>
                      update((d) => {
                        d.members = d.members.filter((x) => x.id !== m.id);
                        if (d.currentMemberId === m.id) d.currentMemberId = null;
                        // Unassign this member from everything.
                        for (const it of [...d.gear, ...d.kitchen])
                          if (it.assignedMemberId === m.id) {
                            it.assignedMemberId = null;
                            it.status = "unassigned";
                          }
                        for (const meal of d.meals)
                          if (meal.assignedMemberId === m.id)
                            meal.assignedMemberId = null;
                        delete d.personal[m.id];
                      })
                    }
                    className="no-print text-xs text-gray-300 hover:text-red-400"
                  >
                    remove
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-brand-50 py-1">
                  <div className="font-bold text-brand-700">
                    {r.assignedItems.length + r.assignedGrocery.length}
                  </div>
                  <div className="text-gray-500">items</div>
                </div>
                <div className="rounded-lg bg-brand-50 py-1">
                  <div className="font-bold text-brand-700">
                    {r.doneCount}/{r.total}
                  </div>
                  <div className="text-gray-500">packed</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
