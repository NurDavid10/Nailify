# Database schema and migrations

**Schema** and **migrations** are the same thing here: each file is a migration. They must be applied in order.

| Order | File | What it does |
|-------|------|--------------|
| 1 | `00001_create_initial_schema.sql` | **Initial schema**: tables (profiles, treatments, availability_rules, appointments, settings), RLS, triggers |
| 2 | `00002_add_atomic_booking.sql` | Atomic booking function |
| 3 | `00003_add_created_by.sql` | `created_by` on appointments |
| 4 | `00004_availability_by_date.sql` | Availability by specific date |

**Run order:** migrations 1 → 2 → 3 → 4, then **seed** (`../seed.sql`).

These migrations depend on Supabase (e.g. `auth.users`). Use Supabase CLI or hosted Supabase to apply them; plain Postgres does not have the auth schema.
