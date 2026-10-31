create table public.journey_records (
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 kind text not null check (kind in ('book','journal','mindset','builder','review','document')),
 payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object' and octet_length(payload::text)<500000),
 revision integer not null default 1 check (revision>0),
 updated_at timestamptz not null default now(),
 primary key (user_id,id)
);
alter table public.journey_records enable row level security;
create policy journey_owner_select on public.journey_records for select to authenticated using ((select auth.uid())=user_id);
create policy journey_owner_insert on public.journey_records for insert to authenticated with check ((select auth.uid())=user_id);
create policy journey_owner_update on public.journey_records for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy journey_owner_delete on public.journey_records for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.journey_records to authenticated;
revoke all on public.journey_records from anon;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('journey-private','journey-private',false,52428800,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy journey_file_select on storage.objects for select to authenticated using (bucket_id='journey-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy journey_file_insert on storage.objects for insert to authenticated with check (bucket_id='journey-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy journey_file_delete on storage.objects for delete to authenticated using (bucket_id='journey-private' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- Account-scoped replay state (keeps the existing client format).
create table public.user_data (
 user_id uuid not null references auth.users(id) on delete cascade,
 key text not null check (length(key) between 1 and 200),
 value text not null check (octet_length(value)<12000000),
 updated_at timestamptz not null default now(),
 primary key(user_id,key)
);
alter table public.user_data enable row level security;
create policy replay_owner_select on public.user_data for select to authenticated using ((select auth.uid())=user_id);
create policy replay_owner_insert on public.user_data for insert to authenticated with check ((select auth.uid())=user_id);
create policy replay_owner_update on public.user_data for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy replay_owner_delete on public.user_data for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.user_data to authenticated;
revoke all on public.user_data from anon;

-- Whole learning profile with optimistic concurrency, separate from book PDFs.
create table public.journey_learning (
 user_id uuid primary key references auth.users(id) on delete cascade,
 profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile)='object' and octet_length(profile::text)<4000000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.journey_learning enable row level security;
create policy learning_owner_select on public.journey_learning for select to authenticated using ((select auth.uid())=user_id);
create policy learning_owner_insert on public.journey_learning for insert to authenticated with check ((select auth.uid())=user_id);
create policy learning_owner_update on public.journey_learning for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy learning_owner_delete on public.journey_learning for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.journey_learning to authenticated;
revoke all on public.journey_learning from anon;

-- Drafts are distinct from completed journal entries.
create table public.journey_drafts (
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null check(length(id) between 1 and 160),
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object' and octet_length(payload::text)<500000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 primary key(user_id,id)
);
alter table public.journey_drafts enable row level security;
create policy draft_owner_select on public.journey_drafts for select to authenticated using ((select auth.uid())=user_id);
create policy draft_owner_insert on public.journey_drafts for insert to authenticated with check ((select auth.uid())=user_id);
create policy draft_owner_update on public.journey_drafts for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy draft_owner_delete on public.journey_drafts for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.journey_drafts to authenticated;
revoke all on public.journey_drafts from anon;
