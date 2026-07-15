// Core data model for the Group Camping Planner.
// Everything is kept generic — no preassigned people or family names.

export type Status =
  | "unassigned"
  | "assigned"
  | "confirmed"
  | "purchased"
  | "packed"
  | "complete";

export const STATUSES: Status[] = [
  "unassigned",
  "assigned",
  "confirmed",
  "purchased",
  "packed",
  "complete",
];

export const STATUS_LABEL: Record<Status, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  confirmed: "Confirmed",
  purchased: "Purchased",
  packed: "Packed",
  complete: "Complete",
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

// Grocery categories used to organise the combined grocery list.
export const FOOD_CATEGORIES = [
  "Produce",
  "Dairy",
  "Bread",
  "Meat",
  "Vegetarian protein",
  "Snacks",
  "Drinks",
  "Condiments",
  "Spices",
  "Breakfast",
  "Other",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
}

export interface Meal {
  id: string;
  name: string;
  date: string; // ISO date (yyyy-mm-dd)
  type: MealType;
  servings: number;
  menu: string;
  ingredients: Ingredient[];
  assignedMemberId: string | null;
  notes: string;
  dietaryOptions: string;
}

export interface Member {
  id: string;
  name: string;
  dietaryRestrictions: string;
  allergies: string;
}

// A generic checklist item used by gear, kitchen and personal lists.
export interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  quantityNeeded: number;
  quantityAssigned: number;
  assignedMemberId: string | null;
  status: Status;
  notes: string;
  custom?: boolean;
}

// Manual quantity / status overrides applied on top of the auto-combined
// grocery list. Keyed by a normalised "name|unit" key.
export interface GroceryOverride {
  quantity?: number; // manual override of the summed quantity
  unit?: string;
  category?: FoodCategory;
  assignedMemberId?: string | null;
  purchased?: boolean;
  packed?: boolean;
}

// A manually-added grocery item that is not tied to any meal.
export interface ManualGroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  assignedMemberId: string | null;
  purchased: boolean;
  packed: boolean;
}

export interface Trip {
  name: string;
  location: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  inviteCode: string;
  notes: string;
  emergencyContacts: string;
  campgroundRules: string;
}

export interface AppState {
  trip: Trip;
  members: Member[];
  meals: Meal[];
  gear: ChecklistItem[];
  kitchen: ChecklistItem[];
  // Personal packing lists are per member. Keyed by member id.
  // The special key "template" holds the default list new members start with.
  personal: Record<string, ChecklistItem[]>;
  groceryOverrides: Record<string, GroceryOverride>;
  manualGrocery: ManualGroceryItem[];
  currentMemberId: string | null; // "who am I" on this device
}

// A combined grocery line derived from meals + manual items + overrides.
export interface GroceryLine {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  meals: string[]; // meal names this item belongs to
  assignedMemberId: string | null;
  purchased: boolean;
  packed: boolean;
  manualId?: string; // set when the line comes from a manual grocery item
}
