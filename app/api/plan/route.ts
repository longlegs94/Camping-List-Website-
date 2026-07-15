import { createPlanClient } from "../../../db/supabase";

type Category = "food" | "camping" | "kitchen";
type IngredientInput = { name?: unknown; amount?: unknown; unit?: unknown };

type Trip = {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  notes: string;
};

type Member = { id: string; name: string; notes: string };
type Meal = {
  id: string;
  day: string;
  slot: string;
  name: string;
  servings: number;
  menu: string;
  ingredientsJson: string;
  assignedMemberId: string | null;
  complete: number | boolean;
};
type Item = {
  id: string;
  name: string;
  normalizedName: string;
  category: Category;
  section: string;
  amount: number;
  unit: string;
  assignedMemberId: string | null;
  status: string;
  notes: string;
};
type PersonalItem = { id: string; memberId: string; name: string; status: string };
type PlanData = {
  trip: Trip;
  members: Member[];
  meals: Meal[];
  items: Item[];
  personalItems: PersonalItem[];
};

const inviteCodePattern = /^[A-Z0-9]{10}$/;
const itemStatuses = new Set(["Unassigned", "Assigned", "Confirmed", "Purchased", "Packed", "Complete"]);
const personalChecklist = [
  "Clothes & warm layers",
  "Pajamas, socks & underwear",
  "Hat & sunglasses",
  "Sandals & closed-toe shoes",
  "Swimsuit",
  "Towel",
  "Toiletries",
  "Medication",
  "Phone charger & battery pack",
  "Reusable water bottle",
  "Pillow & sleeping bag",
  "Camping chair",
];

class RequestProblem extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function cleanText(value: unknown, fallback = "", maxLength = 200) {
  return String(value ?? fallback).trim().slice(0, maxLength);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getInviteCode(request: Request) {
  const code = (new URL(request.url).searchParams.get("code") ?? "").trim().toUpperCase();
  if (!inviteCodePattern.test(code)) {
    throw new RequestProblem("Enter the 10-character CampList invite code.", 400);
  }
  return code;
}

function assertPlan(value: unknown): asserts value is PlanData {
  const plan = value as Partial<PlanData> | null;
  if (
    !plan ||
    typeof plan !== "object" ||
    !plan.trip ||
    !Array.isArray(plan.members) ||
    !Array.isArray(plan.meals) ||
    !Array.isArray(plan.items) ||
    !Array.isArray(plan.personalItems)
  ) {
    throw new Error("The saved trip data is not in a supported format.");
  }
}

async function readPlan(code: string) {
  const client = createPlanClient(code);
  const { data, error } = await client
    .from("camplist_plans")
    .select("state")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestProblem("That CampList invite code was not found.", 404);

  const state = data.state as unknown;
  assertPlan(state);
  return structuredClone(state);
}

async function writePlan(code: string, state: PlanData) {
  const client = createPlanClient(code);
  const { data, error } = await client
    .from("camplist_plans")
    .update({
      state,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code)
    .select("state")
    .single();

  if (error) throw error;
  const saved = data.state as unknown;
  assertPlan(saved);
  return saved;
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof RequestProblem) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("CampList API error", error);
  return Response.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const code = getInviteCode(request);
    return Response.json(await readPlan(code));
  } catch (error) {
    return errorResponse(error, "Could not load the trip plan.");
  }
}

export async function POST(request: Request) {
  try {
    const code = getInviteCode(request);
    const body = await request.json() as Record<string, unknown>;
    const action = cleanText(body.action, "", 40);
    const plan = await readPlan(code);

    if (action === "addMember") {
      const name = cleanText(body.name, "", 80);
      if (!name) throw new RequestProblem("Please enter a member name.", 400);
      const id = crypto.randomUUID();
      plan.members.push({
        id,
        name,
        notes: cleanText(body.notes, "", 500),
      });
      plan.personalItems.push(
        ...personalChecklist.map((itemName, index) => ({
          id: `personal-${id}-${index}`,
          memberId: id,
          name: itemName,
          status: "Not packed",
        })),
      );
    } else if (action === "updateTrip") {
      plan.trip = {
        ...plan.trip,
        name: cleanText(body.name, "Weekend Camping Trip", 100),
        location: cleanText(body.location, "", 120),
        start_date: cleanText(body.startDate, "", 80),
        end_date: cleanText(body.endDate, "", 80),
        notes: cleanText(body.notes, "", 1000),
      };
    } else if (action === "addItem") {
      const name = cleanText(body.name, "", 120);
      if (!name) throw new RequestProblem("Please enter an item name.", 400);
      const category = cleanText(body.category, "camping", 20);
      if (!["food", "camping", "kitchen"].includes(category)) {
        throw new RequestProblem("Choose a valid list.", 400);
      }
      plan.items.push({
        id: crypto.randomUUID(),
        name,
        normalizedName: normalize(name),
        category: category as Category,
        section: cleanText(body.section, "Other", 80),
        amount: Math.max(0, Number(body.amount ?? 1) || 0),
        unit: cleanText(body.unit, "item", 40) || "item",
        assignedMemberId: null,
        status: "Unassigned",
        notes: cleanText(body.notes, "", 500),
      });
    } else if (action === "updateItem") {
      const item = plan.items.find((candidate) => candidate.id === cleanText(body.id, "", 80));
      if (!item) throw new RequestProblem("That checklist item was not found.", 404);
      const memberId = body.assignedMemberId ? cleanText(body.assignedMemberId, "", 80) : null;
      const requestedStatus = cleanText(body.status, "Assigned", 20);
      item.assignedMemberId = memberId;
      item.status = memberId && itemStatuses.has(requestedStatus) ? requestedStatus : "Unassigned";
    } else if (action === "addMeal") {
      const name = cleanText(body.name, "", 120);
      if (!name) throw new RequestProblem("Please enter a meal name.", 400);
      const ingredients = (Array.isArray(body.ingredients) ? body.ingredients : [])
        .slice(0, 50)
        .map((raw) => {
          const ingredient = raw as IngredientInput;
          return {
            name: cleanText(ingredient.name, "", 120),
            amount: Math.max(0, Number(ingredient.amount ?? 1) || 0),
            unit: cleanText(ingredient.unit, "item", 40) || "item",
          };
        })
        .filter((ingredient) => ingredient.name);

      plan.meals.push({
        id: crypto.randomUUID(),
        day: cleanText(body.day, "Saturday", 30),
        slot: cleanText(body.slot, "Dinner", 30),
        name,
        servings: Math.max(1, Math.round(Number(body.servings ?? 9) || 9)),
        menu: cleanText(body.menu, "", 500),
        ingredientsJson: JSON.stringify(ingredients),
        assignedMemberId: body.assignedMemberId ? cleanText(body.assignedMemberId, "", 80) : null,
        complete: 0,
      });

      for (const ingredient of ingredients) {
        const normalizedName = normalize(ingredient.name);
        const existing = plan.items.find(
          (item) =>
            item.category === "food" &&
            item.normalizedName === normalizedName &&
            item.unit === ingredient.unit,
        );
        if (existing) {
          existing.amount = Number(existing.amount) + ingredient.amount;
        } else {
          plan.items.push({
            id: crypto.randomUUID(),
            name: ingredient.name,
            normalizedName,
            category: "food",
            section: "Meals",
            amount: ingredient.amount,
            unit: ingredient.unit,
            assignedMemberId: null,
            status: "Unassigned",
            notes: `Added from ${name}`,
          });
        }
      }
    } else if (action === "updateMeal") {
      const meal = plan.meals.find((candidate) => candidate.id === cleanText(body.id, "", 80));
      if (!meal) throw new RequestProblem("That meal was not found.", 404);
      meal.assignedMemberId = body.assignedMemberId ? cleanText(body.assignedMemberId, "", 80) : null;
      meal.complete = Boolean(body.complete);
    } else if (action === "updatePersonal") {
      const item = plan.personalItems.find((candidate) => candidate.id === cleanText(body.id, "", 120));
      if (!item) throw new RequestProblem("That personal item was not found.", 404);
      item.status = body.status === "Packed" ? "Packed" : "Not packed";
    } else {
      throw new RequestProblem("Unknown action.", 400);
    }

    return Response.json(await writePlan(code, plan));
  } catch (error) {
    return errorResponse(error, "Could not save that change.");
  }
}
