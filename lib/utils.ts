import type { AppState, ChecklistItem, Member, Status } from "./types";
import { buildGroceryList } from "./grocery";

export function memberName(
  members: Member[],
  id: string | null | undefined
): string {
  if (!id) return "";
  return members.find((m) => m.id === id)?.name ?? "";
}

export function allChecklistItems(state: AppState): ChecklistItem[] {
  const personal = Object.entries(state.personal)
    .filter(([k]) => k !== "template")
    .flatMap(([, items]) => items);
  return [...state.gear, ...state.kitchen, ...personal];
}

function itemDone(status: Status): boolean {
  return status === "packed" || status === "complete";
}

export interface Progress {
  totalItems: number;
  packedItems: number;
  unpackedItems: number;
  unassignedItems: number;
  mealsPlanned: number;
  percent: number;
}

export function computeProgress(state: AppState): Progress {
  const items = allChecklistItems(state);
  const grocery = buildGroceryList(state);

  const checklistPacked = items.filter((i) => itemDone(i.status)).length;
  const groceryPacked = grocery.filter((g) => g.packed).length;

  const totalItems = items.length + grocery.length;
  const packedItems = checklistPacked + groceryPacked;
  const unpackedItems = totalItems - packedItems;

  const unassignedChecklist = items.filter((i) => !i.assignedMemberId).length;
  const unassignedGrocery = grocery.filter((g) => !g.assignedMemberId).length;
  const unassignedItems = unassignedChecklist + unassignedGrocery;

  const percent =
    totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  return {
    totalItems,
    packedItems,
    unpackedItems,
    unassignedItems,
    mealsPlanned: state.meals.length,
    percent,
  };
}

export function statusColor(status: Status): string {
  switch (status) {
    case "unassigned":
      return "bg-gray-100 text-gray-600";
    case "assigned":
      return "bg-blue-100 text-blue-700";
    case "confirmed":
      return "bg-indigo-100 text-indigo-700";
    case "purchased":
      return "bg-amber-100 text-amber-700";
    case "packed":
      return "bg-brand-100 text-brand-700";
    case "complete":
      return "bg-brand-500 text-white";
  }
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
