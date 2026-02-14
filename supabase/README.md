# Supabase / Database

## Where is the schema?

The **schema** is defined in migrations, in order:

- **`migrations/00001_create_initial_schema.sql`** – base schema (profiles, treatments, availability_rules, appointments, settings, RLS, triggers)
- **`migrations/00002_add_atomic_booking.sql`** – atomic booking
- **`migrations/00003_add_created_by.sql`** – appointment `created_by`
- **`migrations/00004_availability_by_date.sql`** – availability by date

There is no separate “schema” file; the schema is the result of running these migrations in order.

## Run order: migrations → seed

1. **Migrations** (schema + changes), in order: `00001` → `00002` → `00003` → `00004`
2. **Seed**: `seed.sql` (sample treatments and availability)

## How to run (Supabase CLI)

**Option A – Reset DB and apply everything (migrations + seed):**

```bash
supabase db reset
```

This applies all migrations in order, then runs `seed.sql`.

**Option B – Already have Supabase running:**

```bash
supabase start          # if not already running (applies migrations on first start)
supabase db seed        # run seed only
```

**Option C – Apply migrations only (no seed):**

```bash
supabase db push        # or: supabase migration up
```

Then run seed when you want:

```bash
supabase db seed
```

## How to run (your Docker Postgres)

These migrations use Supabase’s `auth.users` and auth schema. Run schema then seed (see commands below). For a full local setup with the same schema, use Supabase CLI (`supabase start`), which runs Postgres + Auth and applies migrations.

If you still use a standalone Postgres container, you’d need a copy of the schema adapted for vanilla Postgres (no `auth.users`). The repo does not include that by default.
