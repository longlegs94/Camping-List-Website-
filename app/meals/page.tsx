"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  EmptyState,
  MemberSelect,
  PageHeader,
  inputCls,
} from "@/components/ui";
import { uid } from "@/lib/seed";
import { FOOD_CATEGORIES, MEAL_TYPES } from "@/lib/types";
import type { Meal, MealType, FoodCategory } from "@/lib/types";
import { formatDate, sortMeals, MEAL_TYPE_ICON, memberName } from "@/lib/utils";

export default function MealsPage() {
  const { state, update } = useStore();
  const [open, setOpen] = useState<string | null>(null);

  const addMeal = () => {
    const id = uid("meal");
    update((d) => {
      d.meals.push({
        id,
        name: "New Meal",
        date: "",
        type: "dinner",
        servings: state.trip.adults + state.trip.children || 4,
        menu: "",
        ingredients: [],
        assignedMemberId: null,
        notes: "",
        dietaryOptions: "",
      });
    });
    setOpen(id);
  };

  const patchMeal = (id: string, patch: Partial<Meal>) =>
    update((d) => {
      const m = d.meals.find((x) => x.id === id);
      if (m) Object.assign(m, patch);
    });

  // Group sorted meals under one heading per day ("" = Anytime, at the end).
  const dayGroups: [string, Meal[]][] = [];
  for (const m of sortMeals(state.meals)) {
    const last = dayGroups[dayGroups.length - 1];
    if (last && last[0] === m.date) last[1].push(m);
    else dayGroups.push([m.date, [m]]);
  }

  const renderMeal = (meal: Meal) => {
    const isOpen = open === meal.id;
    const cook = memberName(state.members, meal.assignedMemberId);
    return (
      <Card key={meal.id}>
        <button
          onClick={() => setOpen(isOpen ? null : meal.id)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 text-xl">
              {MEAL_TYPE_ICON[meal.type] ?? "🍽️"}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-brand-800">{meal.name}</div>
              {meal.menu && (
                <div className="truncate text-sm text-gray-600">
                  {meal.menu}
                </div>
              )}
              <div className="text-xs text-gray-400">
                {meal.servings} servings · {meal.ingredients.length}{" "}
                ingredients{cook ? ` · 👤 ${cook}` : " · needs a cook"}
              </div>
            </div>
          </div>
          <span className="shrink-0 text-brand-300">
            {isOpen ? "▲" : "▼"}
          </span>
        </button>

            {isOpen && (
              <div className="mt-4 space-y-3 border-t border-brand-50 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Meal name">
                    <input
                      value={meal.name}
                      onChange={(e) =>
                        patchMeal(meal.id, { name: e.target.value })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Date">
                    <input
                      type="date"
                      value={meal.date}
                      onChange={(e) =>
                        patchMeal(meal.id, { date: e.target.value })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Meal type">
                    <select
                      value={meal.type}
                      onChange={(e) =>
                        patchMeal(meal.id, {
                          type: e.target.value as MealType,
                        })
                      }
                      className={inputCls}
                    >
                      {MEAL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Servings">
                    <input
                      type="number"
                      min={0}
                      value={meal.servings}
                      onChange={(e) =>
                        patchMeal(meal.id, { servings: Number(e.target.value) })
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Menu">
                  <input
                    value={meal.menu}
                    onChange={(e) =>
                      patchMeal(meal.id, { menu: e.target.value })
                    }
                    placeholder="e.g. Burgers & salad"
                    className={inputCls}
                  />
                </Field>

                <Field label="Assigned cook">
                  <MemberSelect
                    members={state.members}
                    value={meal.assignedMemberId}
                    onChange={(id) =>
                      patchMeal(meal.id, { assignedMemberId: id })
                    }
                  />
                </Field>

                <Field label="Dietary options">
                  <input
                    value={meal.dietaryOptions}
                    onChange={(e) =>
                      patchMeal(meal.id, { dietaryOptions: e.target.value })
                    }
                    placeholder="e.g. veggie option, gluten-free"
                    className={inputCls}
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    value={meal.notes}
                    onChange={(e) =>
                      patchMeal(meal.id, { notes: e.target.value })
                    }
                    rows={2}
                    className={inputCls}
                  />
                </Field>

                {/* Ingredients */}
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-600">
                    Ingredients
                  </div>
                  <div className="space-y-2">
                    {meal.ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex flex-wrap items-center gap-1.5"
                      >
                        <input
                          value={ing.name}
                          onChange={(e) =>
                            update((d) => {
                              const m = d.meals.find((x) => x.id === meal.id);
                              const g = m?.ingredients.find(
                                (y) => y.id === ing.id
                              );
                              if (g) g.name = e.target.value;
                            })
                          }
                          placeholder="Ingredient"
                          className="min-w-[110px] flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                        />
                        <input
                          type="number"
                          min={0}
                          value={ing.quantity}
                          onChange={(e) =>
                            update((d) => {
                              const m = d.meals.find((x) => x.id === meal.id);
                              const g = m?.ingredients.find(
                                (y) => y.id === ing.id
                              );
                              if (g) g.quantity = Number(e.target.value);
                            })
                          }
                          className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                        />
                        <input
                          value={ing.unit}
                          onChange={(e) =>
                            update((d) => {
                              const m = d.meals.find((x) => x.id === meal.id);
                              const g = m?.ingredients.find(
                                (y) => y.id === ing.id
                              );
                              if (g) g.unit = e.target.value;
                            })
                          }
                          placeholder="unit"
                          className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                        />
                        <select
                          value={ing.category}
                          onChange={(e) =>
                            update((d) => {
                              const m = d.meals.find((x) => x.id === meal.id);
                              const g = m?.ingredients.find(
                                (y) => y.id === ing.id
                              );
                              if (g) g.category = e.target.value as FoodCategory;
                            })
                          }
                          className="rounded-lg border border-gray-200 px-1 py-1 text-sm"
                        >
                          {FOOD_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            update((d) => {
                              const m = d.meals.find((x) => x.id === meal.id);
                              if (m)
                                m.ingredients = m.ingredients.filter(
                                  (y) => y.id !== ing.id
                                );
                            })
                          }
                          className="text-gray-300 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      update((d) => {
                        const m = d.meals.find((x) => x.id === meal.id);
                        m?.ingredients.push({
                          id: uid("ing"),
                          name: "",
                          quantity: 1,
                          unit: "pcs",
                          category: "Other",
                        });
                      })
                    }
                    className="mt-2 text-sm font-semibold text-brand-600"
                  >
                    + Add ingredient
                  </button>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    onClick={() =>
                      update((d) => {
                        d.meals = d.meals.filter((x) => x.id !== meal.id);
                      })
                    }
                  >
                    Delete meal
                  </Button>
                </div>
              </div>
            )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Meal Planner"
        subtitle="Plan by day & time — ingredients build the grocery list"
        action={
          <Button onClick={addMeal} className="no-print">
            + Meal
          </Button>
        }
      />

      {state.meals.length === 0 && (
        <EmptyState>No meals yet. Add your first meal.</EmptyState>
      )}

      {dayGroups.map(([date, meals]) => (
        <div key={date || "anytime"}>
          <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-brand-600">
            {date ? formatDate(date) : "Anytime"}
          </h3>
          <div className="space-y-3">{meals.map(renderMeal)}</div>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
