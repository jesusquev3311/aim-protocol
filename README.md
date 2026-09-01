# Valorant Training

Phase 3 of the MVP: authentication, challenge creation and management, generated and browsable training days, full and partial day completion, historical Deathmatch entry and editing, daily skill evaluations, notes, dashboard progress, and Row Level Security.

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

If email confirmation is enabled in Supabase, registration creates the account, but the user must confirm their email before signing in. Configure the appropriate development and production redirect URLs under Supabase Auth settings.

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
   - Set **Site URL** to the production Vercel URL.
   - Add the exact production URL to **Redirect URLs**.
   - Keep `http://localhost:5173/**` as an additional redirect for local development.

Environment variable changes only affect new deployments, so redeploy the project after changing them.

## Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```
