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

