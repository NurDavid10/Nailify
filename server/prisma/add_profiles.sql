-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table (without Supabase auth dependency)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,  -- bcrypt hash
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now()
);
