"use client";

import { useMemo, useState } from "react";
import type { ChecklistItem, Member, Status } from "@/lib/types";
import { STATUSES, STATUS_LABEL } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  MemberSelect,
  StatusSelect,
} from "./ui";

interface Props {
  items: ChecklistItem[];
  members: Member[];
  // Mutators operate on a single item by id.
  onPatch: (id: string, patch: Partial<ChecklistItem>) => void;
  onAdd: (name: string, category: string) => void;
  onRemove: (id: string) => void;
  categories: string[];
  // When set, hides the per-item assignment control (used for personal lists).
  hideAssign?: boolean;
}

export function Checklist({
  items,
  members,
  onPatch,
  onAdd,
  onRemove,
  categories,
  hideAssign = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState(categories[0] ?? "Other");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (catFilter && i.category !== catFilter) return false;
      if (personFilter) {
        if (personFilter === "unassigned" && i.assignedMemberId) return false;
        if (
          personFilter !== "unassigned" &&
          i.assignedMemberId !== personFilter
        )
          return false;
      }
      if (statusFilter && i.status !== statusFilter) return false;
      return true;
    });
  }, [items, search, catFilter, personFilter, statusFilter]);

  // Group filtered items by category for clean headings.
  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const i of filtered) {
      const arr = map.get(i.category) ?? [];
      arr.push(i);
      map.set(i.category, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggleDone = (i: ChecklistItem) => {
    const done = i.status === "packed" || i.status === "complete";
    onPatch(i.id, { status: done ? "assigned" : "packed" });
  };

  return (
    <div className="space-y-4">
      {/* Tools: search + filters */}
      <Card className="no-print space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!hideAssign && (
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1"
            >
              <option value="">All people</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Add custom item */}
      <Card className="no-print">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500">
              Add custom item
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="rounded-xl border border-gray-200 px-2 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              if (!newName.trim()) return;
              onAdd(newName.trim(), newCat);
              setNewName("");
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      {grouped.length === 0 && (
        <EmptyState>No items match your filters.</EmptyState>
      )}

      {grouped.map(([cat, catItems]) => (
        <div key={cat}>
          <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
            {cat}
          </h3>
          <div className="space-y-2">
            {catItems.map((i) => {
              const done = i.status === "packed" || i.status === "complete";
              return (
                <Card key={i.id} className="!p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="big-check mt-0.5"
                      checked={done}
                      onChange={() => toggleDone(i)}
                      aria-label={`Mark ${i.name} packed`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            done ? "text-gray-400 line-through" : ""
                          }`}
                        >
                          {i.name}
                        </span>
                        {i.custom && (
                          <span className="rounded bg-brand-50 px-1.5 text-[10px] text-brand-600">
                            custom
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-gray-500">
                          Qty
                          <input
                            type="number"
                            min={0}
                            value={i.quantityNeeded}
                            onChange={(e) =>
                              onPatch(i.id, {
                                quantityNeeded: Number(e.target.value),
                              })
                            }
                            className="w-14 rounded border border-gray-200 px-1 py-0.5"
                          />
                        </label>
                        {!hideAssign && (
                          <MemberSelect
                            members={members}
                            value={i.assignedMemberId}
                            onChange={(id) =>
                              onPatch(i.id, {
                                assignedMemberId: id,
                                status:
                                  id && i.status === "unassigned"
                                    ? "assigned"
                                    : i.status,
                              })
                            }
                          />
                        )}
                        <StatusSelect
                          value={i.status}
                          onChange={(s: Status) => onPatch(i.id, { status: s })}
                        />
                      </div>

                      <input
                        value={i.notes}
                        onChange={(e) => onPatch(i.id, { notes: e.target.value })}
                        placeholder="Notes…"
                        className="mt-2 w-full rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-xs focus:border-brand-300 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => onRemove(i.id)}
                      className="no-print text-gray-300 hover:text-red-400"
                      aria-label={`Remove ${i.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
