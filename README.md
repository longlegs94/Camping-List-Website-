# Group Camping Planner

A mobile-first web app for planning a group camping trip: meals, the
combined grocery list, shared gear, kitchen supplies, personal packing
lists, and who's responsible for what.

## How it stores data

The whole trip lives in a shared **Supabase** database. Every change anyone
saves — checking off an item, adding a meal, assigning gear — syncs to the
cloud and shows up live for everyone else viewing the trip. There are no
accounts or passwords: the trip's **invite code** (baked into the share
link) is what connects everyone to the same trip.

- A copy is also kept in each browser's `localStorage`, so the app still
  opens with your latest data if you're briefly offline.
- "Who am I" (the member you picked on the Members page) is stored only on
  your own device — it never overwrites anyone else's choice.
- The top bar shows a small sync indicator: **live** (connected),
  **saving…**, or **offline**.

## Group sharing

1. The organizer opens the site and sets up the trip.
2. Trip settings shows an **invite code** and **share link**
   (`/?join=<code>`).
3. Anyone who opens that link joins the same trip: they see all the current
   data, pick their own name on the Members page, and check off their items.
4. Everyone's changes appear for the whole group within a couple of seconds.

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

## Supabase setup

The app ships pointed at a working Supabase project, so it runs with zero
configuration. To use your own Supabase project instead:

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL
   editor — it creates the `shared_trips` table (one row per trip, whole
   trip state as JSON), open row-level-security policies, and realtime
   broadcasting.
3. Set these environment variables (in `.env.local` locally, and in your
   hosting provider's project settings):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # the "publishable" key
   ```

**Access model to know:** this app deliberately avoids accounts. Anyone
with the site URL and an invite code can read and edit that trip, and the
policies allow any visitor to write rows. That's a fine trade-off for a
casual group checklist — don't store anything sensitive in it.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com), choose **Import Project**, and
   select the repo.
3. Leave the default Next.js build settings and deploy — no environment
   variables required (add the two Supabase vars only if you're pointing at
   your own Supabase project).
