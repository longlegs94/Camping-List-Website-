import { createClient } from "@supabase/supabase-js";

// The publishable key is safe to ship in client code (it only grants what
// row-level security allows). Env vars override these for other projects.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://thotqegvhgeqppayokrv.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_w70E50KOQ7HUBPr9TP07Lg__jEgOQZq";

export const supabase = createClient(url, key);

export const TRIPS_TABLE = "shared_trips";
