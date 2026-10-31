-- ==============================================================================
-- ECO-TRACK SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text not null,
  role text not null check (role in ('citizen', 'org', 'admin')) default 'citizen',
  org_id text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create organizations table
create table if not exists public.organizations (
  id text primary key,
  name text not null,
  type text not null check (type in ('municipal', 'ngo')),
  service_area text not null,
  approved boolean default true,
  contact_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  photo_url text not null,
  location_lat double precision not null,
  location_lng double precision not null,
  address text not null,
  accuracy_m double precision default 10,
  waste_type text not null check (waste_type in ('household', 'plastic', 'construction', 'organic', 'near_water', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high')),
  note text,
  status text not null check (status in ('reported', 'assigned', 'in_progress', 'proof_submitted', 'verified', 'reopened')) default 'reported',
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_name text,
  reporter_email text,
  assigned_org_id text references public.organizations(id) on delete set null,
  assigned_org_name text,
  upvotes integer default 0,
  ai_analysis jsonb,
  proof jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create report timeline table
create table if not exists public.report_timeline (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  status text not null,
  at timestamp with time zone default timezone('utc'::text, now()) not null,
  by_user text,
  comment text
);

-- 5. Create report upvotes table
create table if not exists public.report_upvotes (
  user_id uuid references auth.users(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, report_id)
);

-- 6. Indexes for high performance queries
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_timeline_report on public.report_timeline(report_id);

-- 7. Trigger to automatically create profile on Supabase auth user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'citizen')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.reports enable row level security;
alter table public.report_timeline enable row level security;
alter table public.report_upvotes enable row level security;

-- Policies for public and authenticated access
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Organizations viewable by everyone" on public.organizations for select using (true);
create policy "Organizations insertable by admin" on public.organizations for insert with check (true);

create policy "Reports viewable by everyone" on public.reports for select using (true);
create policy "Authenticated users can create reports" on public.reports for insert with check (true);
create policy "Users or orgs can update reports" on public.reports for update using (true);

create policy "Timeline viewable by everyone" on public.report_timeline for select using (true);
create policy "Timeline insertable by authenticated users" on public.report_timeline for insert with check (true);

create policy "Upvotes viewable by everyone" on public.report_upvotes for select using (true);
create policy "Authenticated users can upvote" on public.report_upvotes for insert with check (auth.uid() = user_id);
create policy "Users can remove upvote" on public.report_upvotes for delete using (auth.uid() = user_id);

-- 9. Storage Buckets (Execute in SQL Editor or via Supabase Storage UI)
-- To create buckets in Supabase Storage:
-- Bucket 1: 'reports' (Public bucket for citizen garbage reports)
-- Bucket 2: 'proofs' (Public bucket for cleanup verification photos)
insert into storage.buckets (id, name, public) 
values ('reports', 'reports', true), ('proofs', 'proofs', true)
on conflict (id) do update set public = true;

-- Storage policies
create policy "Public Access to reports storage" on storage.objects for select using (bucket_id in ('reports', 'proofs'));
create policy "Authenticated users can upload reports images" on storage.objects for insert with check (bucket_id in ('reports', 'proofs'));
