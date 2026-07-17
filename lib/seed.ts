import type { AppState, ChecklistItem, Ingredient, Meal } from "./types";

// Small id helper (good enough for a client-side app).
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function item(
  name: string,
  category: string,
  quantityNeeded = 1
): ChecklistItem {
  return {
    id: uid("chk"),
    name,
    category,
    quantityNeeded,
    quantityAssigned: 0,
    assignedMemberId: null,
    status: "unassigned",
    notes: "",
  };
}

// ---- Camping gear (grouped by category) ---------------------------------
const GEAR: ChecklistItem[] = [
  item("Tent", "Tent & Shelter"),
  item("Tarp", "Tent & Shelter"),
  item("Stakes & guylines", "Tent & Shelter"),
  item("Sleeping bags", "Sleeping"),
  item("Air mattresses", "Sleeping"),
  item("Mattress pump", "Sleeping"),
  item("Camping chairs", "Camp Furniture"),
  item("Folding table", "Camp Furniture"),
  item("Lanterns", "Lighting"),
  item("Flashlights", "Lighting"),
  item("Headlamps", "Lighting"),
  item("Fire starter", "Fire Supplies"),
  item("Matches / lighter", "Fire Supplies"),
  item("Firewood", "Fire Supplies"),
  item("Propane", "Fire Supplies"),
  item("Axe", "Fire Supplies"),
  item("Hammer / mallet", "Fire Supplies"),
  item("Rope", "Safety"),
  item("First-aid kit", "Safety"),
  item("Bug spray", "Safety"),
  item("Sunscreen", "Safety"),
  item("Fire extinguisher", "Safety"),
  item("Cards & games", "Recreation"),
  item("Ball / frisbee", "Recreation"),
  item("Rain jackets", "Weather Protection"),
  item("Extra tarp", "Weather Protection"),
  item("Pack-n-play", "Baby & Child Gear"),
  item("Baby monitor", "Baby & Child Gear"),
];

// ---- Kitchen supplies ---------------------------------------------------
const KITCHEN: ChecklistItem[] = [
  item("Grill", "Cooking"),
  item("Camp stove", "Cooking"),
  item("Propane", "Cooking"),
  item("Pots", "Cookware"),
  item("Pans", "Cookware"),
  item("Tongs", "Utensils"),
  item("Spatula", "Utensils"),
  item("Wooden spoon", "Utensils"),
  item("Knife", "Utensils"),
  item("Cutting board", "Utensils"),
  item("Plates", "Tableware"),
  item("Cups", "Tableware"),
  item("Cutlery", "Tableware"),
  item("Paper towel", "Cleanup"),
  item("Garbage bags", "Cleanup"),
  item("Dish soap", "Cleanup"),
  item("Sponge", "Cleanup"),
  item("Foil", "Cooking"),
  item("Food storage bags", "Storage"),
  item("Coolers", "Storage"),
  item("Ice packs", "Storage"),
  item("Water container", "Water"),
  item("Water pump", "Water"),
];

// ---- Personal packing list (template each member starts from) -----------
const PERSONAL_TEMPLATE: ChecklistItem[] = [
  item("Clothes", "Clothing"),
  item("Warm clothes", "Clothing"),
  item("Pajamas", "Clothing"),
  item("Socks", "Clothing"),
  item("Underwear", "Clothing"),
  item("Hat", "Clothing"),
  item("Sunglasses", "Clothing"),
  item("Sandals", "Footwear"),
  item("Closed-toe shoes", "Footwear"),
  item("Swimsuit", "Clothing"),
  item("Towel", "Toiletries"),
  item("Toiletries", "Toiletries"),
  item("Toothbrush", "Toiletries"),
  item("Toothpaste", "Toiletries"),
  item("Medication", "Health"),
  item("Phone charger", "Electronics"),
  item("Battery pack", "Electronics"),
  item("Water bottle", "Gear"),
  item("Pillow", "Sleep"),
  item("Sleeping bag", "Sleep"),
  item("Camping chair", "Gear"),
];

// ---- Meal plan (ingredient quantities sized for 9 adults; shared items
// like eggs/onions/peppers are split across meals so the combined grocery
// list sums them back to the full shopping amounts) ----------------------
type Ing = [name: string, qty: number, unit: string, cat: Ingredient["category"]];

function meal(
  name: string,
  type: Meal["type"],
  menu: string,
  ingredients: Ing[],
  dietaryOptions = "",
  date = ""
): Meal {
  return {
    id: uid("meal"),
    name,
    date,
    type,
    servings: 9,
    menu,
    ingredients: ingredients.map(([n, q, u, c]) => ({
      id: uid("ing"),
      name: n,
      quantity: q,
      unit: u,
      category: c,
    })),
    assignedMemberId: null,
    notes: "",
    dietaryOptions,
  };
}

export function mealPlan(): Meal[] {
  return [
    meal("Friday Dinner", "dinner", "Pizza & Maggi noodles", [
      ["Frozen pizza", 5, "large", "Other"],
      ["Maggi noodles", 12, "packs", "Other"],
    ]),
    meal(
      "Saturday Breakfast",
      "breakfast",
      "Breakfast wraps",
      [
        ["Tortilla wraps", 24, "large", "Bread"],
        ["Hash browns", 2, "bags", "Breakfast"],
        ["Eggs", 2, "dozen", "Breakfast"],
        ["Bacon (for Ricky)", 1, "pack", "Meat"],
        ["Bell peppers", 2, "pcs", "Produce"],
        ["Onions", 2, "large", "Produce"],
        ["Shredded cheese", 1, "kg", "Dairy"],
        ["Salsa", 1, "large jar", "Condiments"],
        ["Chai supplies", 12, "cups", "Drinks"],
        ["Coffee", 12, "cups", "Drinks"],
      ],
      "Bacon cooked separately"
    ),
    meal(
      "Saturday Lunch",
      "lunch",
      "Smash burgers & sweet kale salad",
      [
        ["Brioche burger buns", 24, "buns", "Bread"],
        ["Ground beef", 3, "kg", "Meat"],
        ["Veggie burger patties", 12, "patties", "Vegetarian protein"],
        ["Onions", 2, "large", "Produce"],
        ["Lettuce", 2, "heads", "Produce"],
        ["Pickles", 1, "large jar", "Produce"],
        ["Burger cheese slices", 24, "slices", "Dairy"],
        ["Mayo", 1, "large bottle", "Condiments"],
        ["Ketchup", 1, "large bottle", "Condiments"],
        ["Mustard", 1, "bottle", "Condiments"],
        ["Sweet kale salad", 3, "large bags", "Produce"],
      ],
      "Veggie patties available"
    ),
    meal(
      "Saturday Dinner",
      "dinner",
      "Foil packets + corn on the cob",
      [
        ["Beef (foil packets)", 1.5, "kg", "Meat"],
        ["Chicken (foil packets)", 1.5, "kg", "Meat"],
        ["Paneer", 3, "400g packs", "Vegetarian protein"],
        ["Zucchini", 5, "pcs", "Produce"],
        ["Bell peppers", 6, "pcs", "Produce"],
        ["Onions", 4, "large", "Produce"],
        ["Mushrooms", 2, "large packs", "Produce"],
        ["Corn on the cob", 12, "pcs", "Produce"],
        ["Butter", 1, "large block", "Dairy"],
        ["Salt", 1, "pcs", "Spices"],
        ["Pepper", 1, "pcs", "Spices"],
        ["Garlic powder", 1, "pcs", "Spices"],
        ["Cajun seasoning", 1, "pcs", "Spices"],
      ],
      "Paneer packets (vegetarian)"
    ),
    meal(
      "Sunday Breakfast",
      "breakfast",
      "Pancakes & eggs",
      [
        ["Pancake mix", 1, "box (30-35)", "Breakfast"],
        ["Eggs", 2, "dozen", "Breakfast"],
        ["Syrup", 1, "large bottle", "Breakfast"],
        ["Strawberries", 2, "containers", "Produce"],
        ["Milk", 4, "L", "Dairy"],
        ["Chai supplies", 12, "cups", "Drinks"],
        ["Coffee", 12, "cups", "Drinks"],
      ]
    ),
    meal("Snacks", "snack", "Grazing all weekend", [
      ["Trail mix", 1, "large bag", "Snacks"],
      ["Blueberries", 2, "containers", "Snacks"],
      ["Assorted fruit", 2, "types", "Snacks"],
      ["Watermelon", 1, "large", "Snacks"],
      ["Tortilla chips", 3, "large bags", "Snacks"],
      ["Salsa", 1, "large jar", "Condiments"],
      ["Chips", 4, "large bags", "Snacks"],
      ["Rice Krispies", 2, "boxes", "Snacks"],
      ["Chocolate chips", 1, "large bag", "Snacks"],
      ["Granola bars", 2, "boxes", "Snacks"],
    ]),
  ];
}

export function defaultState(): AppState {
  return {
    trip: {
      name: "Our Camping Trip",
      location: "",
      arrivalDate: "",
      departureDate: "",
      adults: 9,
      children: 0,
      inviteCode: uid("trip").slice(-6).toUpperCase(),
      notes: "",
      emergencyContacts: "",
      campgroundRules: "",
    },
    members: [],
    meals: mealPlan(),
    gear: GEAR,
    kitchen: KITCHEN,
    personal: { template: PERSONAL_TEMPLATE },
    groceryOverrides: {},
    manualGrocery: [],
    currentMemberId: null,
  };
}

export function personalTemplate(): ChecklistItem[] {
  return PERSONAL_TEMPLATE.map((i) => ({ ...i, id: uid("chk") }));
}

// Seed a member's personal list from the trip's live template (which may
// have been extended with group-wide items), falling back to the built-in
// default. Each item gets a fresh id.
export function listFromTemplate(
  personal: Record<string, ChecklistItem[]>
): ChecklistItem[] {
  const src = personal["template"] ?? PERSONAL_TEMPLATE;
  return src.map((i) => ({ ...i, id: uid("chk") }));
}
