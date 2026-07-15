import "server-only";

import { createClient } from "@supabase/supabase-js";

// Supabase publishable keys are designed for public applications. Environment
// variables override these fallbacks without being required for a Vercel import.
const supabaseUrl =
  process.env.SUPABASE_URL ?? "https://thotqegvhgeqppayokrv.supabase.co";
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_w70E50KOQ7HUBPr9TP07Lg__jEgOQZq";

export function createPlanClient(code: string) {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-camplist-code": code,
      },
    },
  });
}
