-- Account access tombstones deliberately survive Auth deletion to deny old JWTs.
create table if not exists public.edumoney_account_access (
 user_id uuid primary key,
 status text not null check (status in ('active','suspended','deleted')),
 updated_at timestamptz not null default now(),
 updated_by uuid not null
);
alter table public.edumoney_account_access enable row level security;
revoke all on public.edumoney_account_access from public, anon, authenticated;
grant select(user_id,status,updated_at) on public.edumoney_account_access to authenticated;
grant all on public.edumoney_account_access to service_role;
create policy edumoney_access_read_self on public.edumoney_account_access for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.edumoney_admin_user_totals(actor_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users u where u.id=actor_id and u.deleted_at is null and u.email_confirmed_at is not null and coalesce((u.raw_app_meta_data->>'edumoney_admin')::boolean,false) and (u.banned_until is null or u.banned_until<=now()) and not exists(select 1 from public.edumoney_account_access a where a.user_id=u.id and a.status<>'active')) then raise insufficient_privilege using message='Administrator required';end if;
 return (select jsonb_build_object('total',count(*),'active',count(*) filter(where coalesce(a.status,'active')='active' and (u.banned_until is null or u.banned_until<=now()) and u.email_confirmed_at is not null),'pending',count(*) filter(where coalesce(a.status,'active')='active' and (u.banned_until is null or u.banned_until<=now()) and u.email_confirmed_at is null),'suspended',count(*) filter(where coalesce(a.status,'active')='suspended' or u.banned_until>now()),'administrators',count(*) filter(where coalesce((u.raw_app_meta_data->>'edumoney_admin')::boolean,false))) from auth.users u left join public.edumoney_account_access a on a.user_id=u.id where u.email is not null and u.deleted_at is null and coalesce(a.status,'active')<>'deleted');
end;$$;
revoke all on function public.edumoney_admin_user_totals(uuid) from public,anon,authenticated;
grant execute on function public.edumoney_admin_user_totals(uuid) to service_role;

create or replace function public.edumoney_admin_revoke_sessions(actor_id uuid,target_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
 if not exists(select 1 from auth.users u where u.id=actor_id and u.deleted_at is null and u.email_confirmed_at is not null and coalesce((u.raw_app_meta_data->>'edumoney_admin')::boolean,false) and (u.banned_until is null or u.banned_until<=now()) and not exists(select 1 from public.edumoney_account_access a where a.user_id=u.id and a.status<>'active')) then raise insufficient_privilege using message='Administrator required';end if;
 if actor_id=target_id or exists(select 1 from auth.users u where u.id=target_id and coalesce((u.raw_app_meta_data->>'edumoney_admin')::boolean,false)) then raise insufficient_privilege using message='Administrator accounts are protected';end if;
 delete from auth.refresh_tokens where user_id::text=target_id::text;
 delete from auth.sessions where user_id=target_id;
 get diagnostics removed=row_count;
 return removed;
end;$$;
revoke all on function public.edumoney_admin_revoke_sessions(uuid,uuid) from public,anon,authenticated;
grant execute on function public.edumoney_admin_revoke_sessions(uuid,uuid) to service_role;
notify pgrst,'reload schema';
