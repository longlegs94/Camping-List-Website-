import type { AppState, ChecklistItem, Meal } from "./types";

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

// ---- Sample meals (menus/ingredients kept light, easy to edit) ----------
const MEALS: Meal[] = [
  {
    id: uid("meal"),
    name: "Friday Dinner",
    date: "",
    type: "dinner",
    servings: 6,
    menu: "Burgers & salad",
    ingredients: [
      { id: uid("ing"), name: "Burger buns", quantity: 6, unit: "pcs", category: "Bread" },
      { id: uid("ing"), name: "Ground beef", quantity: 2, unit: "lb", category: "Meat" },
      { id: uid("ing"), name: "Lettuce", quantity: 1, unit: "head", category: "Produce" },
      { id: uid("ing"), name: "Tomatoes", quantity: 3, unit: "pcs", category: "Produce" },
      { id: uid("ing"), name: "Cheese slices", quantity: 6, unit: "pcs", category: "Dairy" },
    ],
    assignedMemberId: null,
    notes: "",
    dietaryOptions: "Veggie burgers available",
  },
  {
    id: uid("meal"),
    name: "Saturday Breakfast",
    date: "",
    type: "breakfast",
    servings: 6,
    menu: "Eggs & toast",
    ingredients: [
      { id: uid("ing"), name: "Eggs", quantity: 12, unit: "pcs", category: "Breakfast" },
      { id: uid("ing"), name: "Bread", quantity: 1, unit: "loaf", category: "Bread" },
      { id: uid("ing"), name: "Butter", quantity: 1, unit: "pack", category: "Dairy" },
      { id: uid("ing"), name: "Coffee", quantity: 1, unit: "bag", category: "Drinks" },
    ],
    assignedMemberId: null,
    notes: "",
    dietaryOptions: "",
  },
];

export function defaultState(): AppState {
  return {
    trip: {
      name: "Our Camping Trip",
      location: "",
      arrivalDate: "",
      departureDate: "",
      adults: 0,
      children: 0,
      inviteCode: uid("trip").slice(-6).toUpperCase(),
      notes: "",
      emergencyContacts: "",
      campgroundRules: "",
    },
    members: [],
    meals: MEALS,
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
