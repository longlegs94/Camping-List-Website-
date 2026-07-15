import type { AppState, GroceryLine, FoodCategory } from "./types";

// Normalise an ingredient into a combine key so duplicates merge.
function keyFor(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
}

// Build the combined grocery list from all meal ingredients (duplicates
// summed), then layer in manual items and any per-line overrides.
export function buildGroceryList(state: AppState): GroceryLine[] {
  const map = new Map<string, GroceryLine>();

  for (const meal of state.meals) {
    for (const ing of meal.ingredients) {
      if (!ing.name.trim()) continue;
      const key = keyFor(ing.name, ing.unit);
      const existing = map.get(key);
      if (existing) {
        existing.quantity += ing.quantity;
        if (!existing.meals.includes(meal.name)) existing.meals.push(meal.name);
      } else {
        map.set(key, {
          key,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          meals: [meal.name],
          assignedMemberId: null,
          purchased: false,
          packed: false,
        });
      }
    }
  }

  // Apply overrides (manual quantity edits, assignment, purchased/packed).
  for (const line of map.values()) {
    const ov = state.groceryOverrides[line.key];
    if (ov) {
      if (typeof ov.quantity === "number") line.quantity = ov.quantity;
      if (ov.unit) line.unit = ov.unit;
      if (ov.category) line.category = ov.category as FoodCategory;
      if (ov.assignedMemberId !== undefined)
        line.assignedMemberId = ov.assignedMemberId;
      if (ov.purchased !== undefined) line.purchased = ov.purchased;
      if (ov.packed !== undefined) line.packed = ov.packed;
    }
  }

  // Manual grocery items become their own lines.
  for (const m of state.manualGrocery) {
    map.set(`manual_${m.id}`, {
      key: `manual_${m.id}`,
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      category: m.category,
      meals: [],
      assignedMemberId: m.assignedMemberId,
      purchased: m.purchased,
      packed: m.packed,
      manualId: m.id,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
}
