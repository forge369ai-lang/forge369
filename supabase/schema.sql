create extension if not exists "pgcrypto";

create type public.opportunity_status as enum ('discovered', 'shortlisted', 'selected', 'rejected');
create type public.project_stage as enum ('validate', 'architect', 'research', 'create', 'polish', 'package', 'launched');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  audience text not null,
  problem text not null,
  recommended_format text,
  source_label text,
  source_url text,
  status public.opportunity_status not null default 'discovered',
  scores jsonb not null default '{}'::jsonb,
  total_score integer check (total_score between 0 and 100),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  name text not null,
  stage public.project_stage not null default 'validate',
  product_brief jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  artifact_type text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  storage_path text,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.projects enable row level security;
alter table public.artifacts enable row level security;

create policy "Users manage their profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their opportunities" on public.opportunities for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage their projects" on public.projects for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage project artifacts" on public.artifacts for all using (exists (select 1 from public.projects where projects.id = artifacts.project_id and projects.owner_id = auth.uid())) with check (exists (select 1 from public.projects where projects.id = artifacts.project_id and projects.owner_id = auth.uid()));
