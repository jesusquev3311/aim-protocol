# Valorant Training

Aim Protocol is a Valorant mechanical-training tracker built with React, TypeScript, TanStack Query, and Supabase. It supports authentication, challenge management, browsable training days, historical Deathmatch entry, daily skill evaluations, profile management, achievements, and performance analytics.

The public root route presents the product and adapts its primary action to the current authentication state. Authenticated application data remains behind protected routes and is never loaded into the marketing preview.

Challenge progress is based on completed training days. The configured Deathmatch count is a daily maximum rather than a completion requirement: a player can complete a day after recording at least one match, and reaching the maximum completes it automatically. Each day stores its actual completion timestamp, so challenges do not require consecutive calendar-day play.

## Getting Started

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations` in filename order using the Supabase SQL Editor, or apply them with the Supabase CLI.
3. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
4. Install the dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

## Environment Variables

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Only use a Supabase publishable key in the frontend. Never expose a secret key through a `VITE_` environment variable.

## Authentication Notes

If email confirmation is enabled in Supabase, registration opens a dedicated verification-sent page and the user must confirm their email before signing in. The application sends `/dashboard` as the confirmation destination. Password recovery emails return to `/reset-password`, where Supabase validates the recovery session before allowing a password change.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the `aim-protocol` repository in Vercel.
3. Keep the detected Vite defaults, or configure:

   ```text
   Build command: npm run build
   Output directory: dist
   ```

4. Add these variables under **Project Settings → Environment Variables** for the Production and Preview environments:

   ```text
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   ```

5. Deploy the project. The root-level `vercel.json` rewrites application routes to `index.html`, allowing React Router URLs such as `/dashboard` and `/training/:trainingDayId` to work after a direct refresh.
6. In **Supabase → Authentication → URL Configuration**:
   - Set **Site URL** to `https://aim-protocol-umber.vercel.app` (do not use a `vercel.com` account or signup URL).
   - Add `https://aim-protocol-umber.vercel.app/**` to **Redirect URLs** so confirmation links can return to `/dashboard`.
   - Keep `http://localhost:5173/**` as an additional redirect for local development.

Environment variable changes only affect new deployments, so redeploy the project after changing them.

## Product Areas

- Dashboard progress, match volume, and current training day
- Public product landing page with authentication-aware calls to action
- Challenge creation, date editing, deletion, and daily match caps
- Match entry and editing for current or historical training days
- Explicit day completion and actual completion timestamps
- Username, email, and password management with current-password confirmation
- Challenge completion summary and persistent achievements
- K/D trends, weapon comparisons, skill self-evaluations, and improvement insights
- Flexible 7-, 15-, or 30-session Routine Programs with actual completion dates, timer-derived session duration capped at 45 minutes, bot scores, jiggle-peek and A/D burst drills, optional accuracy and Deathmatch context, and gunfight-hygiene tracking
- Per-program and global routine analytics with rolling mechanical trends, baseline comparisons, consistency, adherence, date/program filters, and routine-to-Deathmatch associations

## Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run test     # Run unit tests
npm run preview  # Preview the production build
```
