# AGENTS.md

## Project Overview

This repository contains a Valorant mechanical-training web application. The current implementation is Phase 3 of the MVP: authentication, challenge creation, generated training days, Deathmatch recording, daily skill evaluations and notes, dashboard progress, and Row Level Security.

Build the product incrementally. Do not implement later phases unless the task explicitly requests them.

## Technology Stack

- React 18 and TypeScript 5 in strict mode
- Vite 6
- React Router 7
- TanStack Query 5
- React Hook Form with Zod validation
- Tailwind CSS 3 and shadcn/ui-style local components
- Supabase Auth and PostgreSQL with Row Level Security
- ESLint 9 with TypeScript and React Hooks rules

Use the existing dependencies unless a task genuinely requires another package. Avoid adding dependencies for functionality that can be implemented clearly with the current stack.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Before handing off code changes, run at least:

```bash
npm run lint
npm run build
```

There is no automated test suite yet. When tests are introduced, add a documented `test` script and keep tests close to the feature they cover.

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Only public browser-safe values may use the `VITE_` prefix. Never commit `.env`, `.env.local`, service-role keys, access tokens, or other secrets. The frontend must never use the Supabase service-role key.

## Architecture

Keep the frontend feature-oriented:

```text
src/
  app/
    providers/        Application-wide providers
    router/           Route definitions and route guards
  features/
    <feature>/
      api/            Supabase access and server operations
      components/     Feature-specific UI
      pages/          Route-level feature pages
      schemas/        Zod schemas and form types
      hooks/          Feature-specific hooks when needed
  pages/              Cross-feature or top-level pages
  components/
    layout/           Shared application layouts
    ui/               Reusable UI primitives
  lib/                Shared infrastructure and utilities
  types/              Shared and generated database types
supabase/
  migrations/         Ordered PostgreSQL migrations
```

Place code in the narrowest appropriate scope. Do not put feature-specific behavior in `components/ui`, `lib`, or application providers. Avoid barrel files unless they materially simplify a stable public API.

Use the `@/` alias for imports from `src`. Relative imports are acceptable for files within the same small module, such as provider or router internals.

## TypeScript and React Conventions

- Keep TypeScript strict and do not weaken compiler settings.
- Avoid `any`, unchecked type assertions, and non-null assertions unless the invariant is explicit and unavoidable.
- Prefer inferred local types and explicit types at module boundaries.
- Use named exports for application modules and components.
- Keep components focused; extract data access, validation, and non-trivial business rules.
- Keep React Hooks unconditional and dependency lists correct.
- Do not store values in state when they can be derived during render.
- Preserve the separation between `AuthContext`, `AuthProvider`, and the authentication API module.
- Handle loading, empty, error, and success states for asynchronous UI.
- Keep source identifiers, comments, documentation, and newly added developer-facing text in English. Preserve the product's chosen user-facing locale unless a task explicitly changes it.

## Routing

Define application routes in `src/app/router/app-router.tsx`.

- Routes requiring a session belong under `ProtectedRoute`.
- Login and registration belong under `PublicOnlyRoute`.
- Shared authenticated chrome belongs in `AppLayout`.
- Shared authentication chrome belongs in `AuthLayout`.
- Route guards must wait for initial Supabase session resolution before redirecting.
- Prefer route-level lazy loading when the application grows enough for bundle splitting to be useful.

## Server State and TanStack Query

TanStack Query is configured in `AppProviders`. Use it for asynchronous Supabase application data such as profiles, challenges, training days, deathmatches, skills, and statistics.

- Keep raw Supabase calls in the feature's `api/` directory.
- Wrap reads in feature query hooks with stable, structured query keys.
- Wrap writes in mutation hooks and invalidate or update only the affected queries.
- Do not duplicate query results into local component state.
- Keep ephemeral UI state local to React components.
- Supabase Auth session state remains owned by `AuthProvider`; do not move it into TanStack Query without a deliberate architectural change.
- Surface Supabase errors intentionally rather than silently swallowing them.

## Forms and Validation

- Define Zod schemas in the owning feature's `schemas/` directory.
- Use React Hook Form with `zodResolver` for forms.
- Infer form value types from Zod schemas instead of duplicating interfaces.
- Validate at the UI boundary for usability, but treat PostgreSQL constraints and RLS as the security boundary.
- Keep submission and data-access logic outside presentational UI primitives.

## Styling and UI

- Use Tailwind utilities and the CSS variables defined in `src/index.css`.
- Reuse components from `src/components/ui` before creating new primitives.
- Follow the existing shadcn/ui composition style and use `cn` from `src/lib/utils.ts` for conditional class merging.
- Keep shared UI primitives domain-agnostic and accessible.
- Associate labels with controls, expose useful error messages, preserve keyboard operation, and use semantic HTML.
- Extend the existing visual tokens instead of scattering hard-coded colors across feature components.

## Supabase and Database Rules

The browser client is defined in `src/lib/supabase/client.ts` and must remain the single shared Supabase client.

- Every user-owned table must include an ownership path and have RLS enabled.
- Add explicit policies for each required operation. Do not rely on client-side filtering for authorization.
- Scope reads and writes to `auth.uid()` wherever data is user-owned.
- Use `security definer` functions only when necessary, set a safe `search_path`, qualify referenced objects, and keep their privileges narrow.
- Add database changes as new, ordered SQL files in `supabase/migrations`; do not rewrite an applied migration unless the task explicitly concerns an unreleased migration.
- Include constraints for domain invariants such as allowed statuses, ranges, uniqueness, and foreign-key behavior.
- Do not store derived values such as K/D when they can be calculated safely from kills and deaths. Handle zero deaths explicitly.
- Keep `src/types/database.ts` synchronized with the schema. Prefer Supabase-generated types once CLI generation is introduced.
- Never bypass RLS from frontend code.

## Product Domain Constraints

Preserve these MVP rules when implementing later phases:

- Challenge durations: 5, 7, 15, 20, 30, or 60 days; default to 20.
- Deathmatches per day: any whole number from 1 through 10; default to 5.
- Initially, a user may have only one active challenge.
- Recommended sequence: Sheriff for matches 1–2, Guardian for matches 3–4, then Vandal or Phantom.
- Skill results are `poor`, `average`, or `good`.
- Training day statuses are `pending`, `partial`, or `completed`; partial days require at least one recorded match.
- Challenge statuses are `active`, `completed`, or `abandoned`.
- Baseline consists of 3–5 normal Deathmatches and is optional.
- K/D is calculated as kills divided by deaths and is never the primary stored value.

Model these rules in pure TypeScript functions where useful and reinforce persistent invariants with database constraints.

## Change Discipline

- Inspect the relevant feature, configuration, and migrations before editing.
- Keep changes limited to the requested phase or feature.
- Prefer small modules and clear names over premature abstractions.
- Preserve existing behavior unless the request explicitly changes it.
- Do not edit generated outputs such as `dist`, `*.tsbuildinfo`, or compiled Vite configuration files.
- Do not commit dependencies from `node_modules`.
- Update `.env.example`, database types, migrations, and documentation when a change affects their contracts.
- Report verification performed and any remaining limitations at handoff.

## Definition of Done

A change is complete when:

- It follows the feature boundaries above.
- TypeScript remains strict and the production build succeeds.
- ESLint succeeds without new warnings.
- New database access is protected by appropriate RLS policies.
- Forms and asynchronous states provide clear user feedback.
- Relevant setup or schema documentation is updated.
- No secrets, generated build output, or unrelated changes are included.
