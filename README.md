# Group Camping Planner

A mobile-first web app for planning a group camping trip: meals, the
combined grocery list, shared gear, kitchen supplies, personal packing
lists, and who's responsible for what.

## How it stores data

This app runs **zero-config** — there is no backend, database, or sign-up.
Everything (trip details, members, meals, checklists, grocery list) is
stored in your browser's `localStorage`, under the key
`camping-planner-state-v1`. That means:

- No account needed, nothing to deploy or configure to try it out.
- Your data lives on **this device, in this browser**. Clearing site data
  or switching browsers/devices starts you over.
- "Sharing" a trip (see below) works great when your group is looking at
  the same browser/device, but does **not** sync data across separate
  phones or computers on its own.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

To build for production:

```bash
npm run build
npm run start
```

## Features

- **Meals** — plan meals with a menu, servings, ingredients and an assigned
  cook.
- **Combined grocery list** — automatically built and summed from every
  meal's ingredients, plus manually-added extras, grouped by category.
- **Camping gear & kitchen supplies checklists** — shared lists with
  quantities, assignment, and status tracking (unassigned → assigned →
  confirmed → purchased → packed → complete).
- **Personal packing lists** — a per-person packing checklist, seeded from a
  sensible default template.
- **Assignments view** — see everything assigned to each person, and
  quickly reassign anything that's still unassigned.
- **My Items** — a single page showing only what's assigned to you (meals,
  gear/kitchen, groceries, personal packing) with big, easy checkboxes.
- **Trip settings** — edit trip details, get a shareable invite link,
  duplicate the trip for a new outing, or reset everything.
- **Tools & Info** — copy a WhatsApp-friendly trip summary, print or export
  a PDF, search across every list, and read emergency contacts/campground
  rules/notes at a glance.

## Group sharing today

Trip settings shows an **invite code** and a **share link**
(`/?join=<code>`). Sending that link to your group is meant for the
"everyone's looking at the same browser/device" case — for example, a
shared tablet at the campsite, or planning together on one laptop during a
video call.

**Limitation to know:** because state lives in `localStorage`, opening the
share link on a different phone or browser starts a *separate, empty* copy
of the data — it does not pull down the group's existing trip. Real
multi-device sync requires a shared backend, which is what the Supabase
option below adds.

## Going multi-device with Supabase

If you want everyone to see the same live data from their own devices, the
next step is to swap the local persistence for a real database.

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL
   editor — it creates `trips`, `members`, `meals`, `ingredients`,
   `checklist_items`, and `grocery_items` tables that mirror the shapes in
   `lib/types.ts`, with a comment block explaining each piece.
3. Add these environment variables (e.g. in `.env.local` and in your
   hosting provider's project settings):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Replace the persistence in `lib/store.tsx` (currently
   `window.localStorage.getItem`/`setItem`) with a data adapter that reads
   and writes the same `AppState` shape to/from Supabase instead — the rest
   of the app (`useStore()`, `update()`, all the pages) can stay as-is
   since they only depend on that store's interface.
5. Enable Row Level Security on every table before going live — the schema
   file ships with RLS off and a note on how to turn it on.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com), choose **Import Project**, and
   select the repo.
3. Leave the default Next.js build settings and deploy.
4. If you've added the Supabase environment variables above, set them in
   the Vercel project's **Settings → Environment Variables** before
   deploying.
