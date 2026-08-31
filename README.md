# Valorant Training

Phase 3 of the MVP: authentication, challenge creation and management, generated and browsable training days, full and partial day completion, historical Deathmatch entry and editing, daily skill evaluations, notes, dashboard progress, and Row Level Security.

## Getting Started

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations` in filename order using the Supabase SQL Editor, or apply them with the Supabase CLI.
3. Copy `.env.example` to `.env.local` and add the project URL and public `anon` key.
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

## Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```
