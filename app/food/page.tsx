"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { buildGroceryList } from "@/lib/grocery";
import {
  Button,
  Card,
  EmptyState,
  MemberSelect,
  PageHeader,
  ProgressBar,
} from "@/components/ui";
import { FOOD_CATEGORIES } from "@/lib/types";
import type { GroceryLine, FoodCategory, GroceryOverride } from "@/lib/types";
import { uid } from "@/lib/seed";

export default function FoodPage() {
  const { state, update } = useStore();
  const lines = buildGroceryList(state);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newUnit, setNewUnit] = useState("pcs");
  const [newCat, setNewCat] = useState<FoodCategory>("Other");

  // Apply a change to either the manual item or the override map.
  const patchLine = (line: GroceryLine, patch: Partial<GroceryOverride>) =>
    update((d) => {
      if (line.manualId) {
        const m = d.manualGrocery.find((x) => x.id === line.manualId);
        if (!m) return;
        if (patch.quantity !== undefined) m.quantity = patch.quantity;
        if (patch.assignedMemberId !== undefined)
          m.assignedMemberId = patch.assignedMemberId;
        if (patch.purchased !== undefined) m.purchased = patch.purchased;
        if (patch.packed !== undefined) m.packed = patch.packed;
        if (patch.category) m.category = patch.category;
      } else {
        d.groceryOverrides[line.key] = {
          ...d.groceryOverrides[line.key],
          ...patch,
        };
      }
    });

  const filtered = useMemo(() => {
    return lines.filter((l) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (catFilter && l.category !== catFilter) return false;
      if (personFilter) {
        if (personFilter === "unassigned" && l.assignedMemberId) return false;
        if (
          personFilter !== "unassigned" &&
          l.assignedMemberId !== personFilter
        )
          return false;
      }
      if (statusFilter === "purchased" && !l.purchased) return false;
      if (statusFilter === "packed" && !l.packed) return false;
      if (statusFilter === "todo" && (l.purchased || l.packed)) return false;
      return true;
    });
  }, [lines, search, catFilter, personFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryLine[]>();
    for (const l of filtered) {
      const arr = map.get(l.category) ?? [];
      arr.push(l);
      map.set(l.category, arr);
    }
    // Within each category, items still to buy come first.
    for (const arr of map.values())
      arr.sort(
        (a, b) =>
          Number(a.purchased || a.packed) - Number(b.purchased || b.packed) ||
          a.name.localeCompare(b.name)
      );
    return Array.from(map.entries());
  }, [filtered]);

  const bought = lines.filter((l) => l.purchased || l.packed).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Grocery List"
        subtitle="Auto-combined from all meal ingredients"
      />

      {lines.length > 0 && (
        <Card>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-brand-700">Shopping done</span>
            <span className="font-bold text-brand-700">
              {bought} / {lines.length}
            </span>
          </div>
          <ProgressBar
            percent={Math.round((bought / lines.length) * 100)}
          />
        </Card>
      )}

      <Card className="no-print space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groceries…"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1"
          >
            <option value="">All categories</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1"
          >
            <option value="">All people</option>
            <option value="unassigned">Unassigned</option>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1"
          >
            <option value="">All</option>
            <option value="todo">To buy</option>
            <option value="purchased">Purchased</option>
            <option value="packed">Packed</option>
          </select>
        </div>
      </Card>

      {/* Add manual grocery item */}
      <Card className="no-print">
        <div className="mb-1 text-xs font-medium text-gray-500">
          Add extra grocery item
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Item"
            className="min-w-[120px] flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            type="number"
            min={0}
            value={newQty}
            onChange={(e) => setNewQty(Number(e.target.value))}
            className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value as FoodCategory)}
            className="rounded-lg border border-gray-200 px-1 py-1 text-sm"
          >
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              if (!newName.trim()) return;
              update((d) => {
                d.manualGrocery.push({
                  id: uid("gro"),
                  name: newName.trim(),
                  quantity: newQty,
                  unit: newUnit,
                  category: newCat,
                  assignedMemberId: null,
                  purchased: false,
                  packed: false,
                });
              });
              setNewName("");
              setNewQty(1);
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      {grouped.length === 0 && (
        <EmptyState>
          No grocery items yet. Add ingredients to your meals.
        </EmptyState>
      )}

      {grouped.map(([cat, catLines]) => {
        const catBought = catLines.filter(
          (l) => l.purchased || l.packed
        ).length;
        return (
        <div key={cat}>
          <h3 className="mb-2 flex items-center justify-between px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
            {cat}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal ${
                catBought === catLines.length
                  ? "bg-brand-500 text-white"
                  : "bg-brand-100 text-brand-700"
              }`}
            >
              {catBought}/{catLines.length}
            </span>
          </h3>
          <div className="space-y-2">
            {catLines.map((l) => (
              <Card key={l.key} className="!p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="big-check mt-0.5"
                    checked={l.packed}
                    onChange={() => patchLine(l, { packed: !l.packed })}
                    aria-label={`Mark ${l.name} packed`}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-medium ${
                        l.purchased || l.packed
                          ? "text-gray-400 line-through"
                          : ""
                      }`}
                    >
                      {l.name}
                      {l.meals.length > 0 && (
                        <span className="ml-2 text-[11px] text-gray-400">
                          {l.meals.join(", ")}
                        </span>
                      )}
                      {l.manualId && (
                        <span className="ml-2 rounded bg-brand-50 px-1.5 text-[10px] text-brand-600">
                          extra
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <label className="flex items-center gap-1">
                        Qty
                        <input
                          type="number"
                          min={0}
                          value={l.quantity}
                          onChange={(e) =>
                            patchLine(l, { quantity: Number(e.target.value) })
                          }
                          className="w-16 rounded border border-gray-200 px-1 py-0.5"
                        />
                        <span>{l.unit}</span>
                      </label>
                      <MemberSelect
                        members={state.members}
                        value={l.assignedMemberId}
                        onChange={(id) => patchLine(l, { assignedMemberId: id })}
                      />
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={l.purchased}
                          onChange={() =>
                            patchLine(l, { purchased: !l.purchased })
                          }
                        />
                        Purchased
                      </label>
                    </div>
                  </div>
                  {l.manualId && (
                    <button
                      onClick={() =>
                        update((d) => {
                          d.manualGrocery = d.manualGrocery.filter(
                            (x) => x.id !== l.manualId
                          );
                        })
                      }
                      className="no-print text-gray-300 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}
