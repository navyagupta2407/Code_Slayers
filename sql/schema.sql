create extension if not exists pgcrypto;

-- 1. USER PROFILES
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'citizen'
        check (role in ('citizen', 'reviewer', 'admin')),
    created_at timestamptz not null default now()
);

-- Automatically create a citizen profile after signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, role)
    values (new.id, 'citizen')
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- 2. DISASTER REPORTS
create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    description text not null,
    incident_type text not null
        check (incident_type in ('flood', 'storm', 'landslide', 'heatwave', 'other')),
    latitude double precision not null check (latitude between -90 and 90),
    longitude double precision not null check (longitude between -180 and 180),
    claimed_at timestamptz,
    verification_status text not null default 'unverified'
        check (verification_status in ('unverified', 'probable', 'verified', 'misleading')),
    processing_status text not null default 'queued',
    created_at timestamptz not null default now()
);


-- 3. REPORT MEDIA
create table if not exists public.report_media (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.reports(id) on delete cascade,
    storage_path text not null,
    sha256 text,
    media_type text,
    created_at timestamptz not null default now()
);


-- 4. AI RESULTS
create table if not exists public.ai_results (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.reports(id) on delete cascade,
    result jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);


-- 5. AUDIT LOGS
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references auth.users(id),
    action text not null,
    entity_type text not null,
    entity_id uuid,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);


-- INDEXES
create index if not exists reports_created_at_idx
on public.reports(created_at desc);

create index if not exists reports_location_idx
on public.reports(latitude, longitude);

create index if not exists reports_status_idx
on public.reports(verification_status, processing_status);

create index if not exists report_media_report_id_idx
on public.report_media(report_id);

create index if not exists ai_results_report_id_idx
on public.ai_results(report_id);


-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_media enable row level security;
alter table public.ai_results enable row level security;
alter table public.audit_logs enable row level security;


-- PROFILES POLICIES
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);


-- REPORT POLICIES
drop policy if exists "Users can view own reports" on public.reports;

create policy "Users can view own reports"
on public.reports for select
to authenticated
using (
    auth.uid() = user_id
    or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and p.role in ('reviewer', 'admin')
    )
);

drop policy if exists "Users can submit own reports" on public.reports;

create policy "Users can submit own reports"
on public.reports for insert
to authenticated
with check (auth.uid() = user_id);


-- MEDIA POLICIES
drop policy if exists "Users can view own report media" on public.report_media;

create policy "Users can view own report media"
on public.report_media for select
to authenticated
using (
    exists (
        select 1 from public.reports r
        where r.id = report_media.report_id
        and (
            r.user_id = auth.uid()
            or exists (
                select 1 from public.profiles p
                where p.id = auth.uid()
                and p.role in ('reviewer', 'admin')
            )
        )
    )
);


-- AI RESULT POLICIES
drop policy if exists "Users can view own AI results" on public.ai_results;

create policy "Users can view own AI results"
on public.ai_results for select
to authenticated
using (
    exists (
        select 1 from public.reports r
        where r.id = ai_results.report_id
        and (
            r.user_id = auth.uid()
            or exists (
                select 1 from public.profiles p
                where p.id = auth.uid()
                and p.role in ('reviewer', 'admin')
            )
        )
    )
);


-- PRIVATE STORAGE BUCKET
insert into storage.buckets (
    id, name, public, file_size_limit, allowed_mime_types
)
values (
    'report-media',
    'report-media',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

