# CampList — Group Camping Planner

CampList is a shared meal, grocery, gear, assignment, and packing planner for a camping group.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` if you want to override the connected Supabase project.
3. Start the app with `npm run dev`.

Open a shared plan with `?plan=YOUR10CHARCODE`. The app also provides an invite-code screen when the query parameter is missing.

## Data and access

- Shared plan state is stored in Supabase.
- Row Level Security limits reads and writes to requests carrying the matching invite code.
- The Supabase publishable key has no delete permission for CampList plans.
- The application checks for updates every ten seconds so group members see one another's changes.

## Deploy

This repository is a standard Next.js application and can be imported directly into Vercel.
