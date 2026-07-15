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
  toBuy: number;
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
    toBuy: grocery.filter((g) => !g.purchased && !g.packed).length,
  };
}

// Order meals sensibly: dated ones first (by date, then breakfast → lunch
// → dinner → snack), undated ones at the end grouped as "Anytime".
const MEAL_TYPE_ORDER: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

export function sortMeals<T extends { date: string; type: string }>(
  meals: T[]
): T[] {
  return [...meals].sort((a, b) => {
    const da = a.date || "9999-99-99";
    const db = b.date || "9999-99-99";
    if (da !== db) return da.localeCompare(db);
    // Undated meals keep their original order (sort is stable).
    if (!a.date && !b.date) return 0;
    return (MEAL_TYPE_ORDER[a.type] ?? 9) - (MEAL_TYPE_ORDER[b.type] ?? 9);
  });
}

export const MEAL_TYPE_ICON: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🥪",
  dinner: "🍲",
  snack: "🍿",
};

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
