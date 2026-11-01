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
