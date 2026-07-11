-- =============================================================================
--  Chap.ci — Schéma de base de données Supabase
-- =============================================================================
--  👉 COMMENT L'UTILISER :
--     1. Ouvrez votre projet sur https://supabase.com
--     2. Menu « SQL Editor » → « New query »
--     3. Copiez-collez TOUT ce fichier et cliquez sur « Run »
--
--  Ce script crée les tables (profils, annonces, conversations, messages),
--  active la sécurité au niveau des lignes (RLS) et les règles d'accès.
--  Il est « idempotent » : vous pouvez le relancer sans danger.
-- =============================================================================

-- ---------- PROFILS -----------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ANNONCES ----------------------------------------------------------
create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete set null,
  title        text not null,
  description  text not null default '',
  price        bigint not null default 0,
  negotiable   boolean not null default false,
  category_id  text not null,
  subcategory  text,
  condition    text not null default 'occasion',
  images       text[] not null default '{}',
  region_id    text not null,
  city_id      text,
  commune      text,
  lat          double precision,
  lng          double precision,
  seller_name  text not null,
  seller_phone text not null,
  delivery     boolean not null default false,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Géolocalisation (ajout sûr si la table existait déjà sans ces colonnes)
alter table public.listings add column if not exists lat double precision;
alter table public.listings add column if not exists lng double precision;

create index if not exists listings_created_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category_id);
create index if not exists listings_region_idx on public.listings (region_id);

alter table public.listings enable row level security;

-- Lecture publique (tout le monde voit les annonces)
drop policy if exists "listings_select_all" on public.listings;
create policy "listings_select_all" on public.listings
  for select using (true);

-- Publication : autorisée à tous pour l'instant (anonyme ou connecté).
-- 👉 Pour n'autoriser QUE les comptes connectés, remplacez `true` par
--    `auth.uid() is not null`.
drop policy if exists "listings_insert_public" on public.listings;
create policy "listings_insert_public" on public.listings
  for insert with check (true);

-- Modification / suppression réservées au propriétaire connecté
drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings
  for update using (auth.uid() = user_id);

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings
  for delete using (auth.uid() = user_id);

-- ---------- MESSAGERIE (conversations + messages) -----------------------------
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete cascade,
  buyer_id   uuid not null references auth.users (id) on delete cascade,
  seller_id  uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references auth.users (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Les participants (acheteur ou vendeur) voient/créent leurs conversations
drop policy if exists "conversations_participant" on public.conversations;
create policy "conversations_participant" on public.conversations
  for all
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Les messages sont visibles/écrits par les participants de la conversation
drop policy if exists "messages_participant_select" on public.messages;
create policy "messages_participant_select" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
    )
  );

drop policy if exists "messages_participant_insert" on public.messages;
create policy "messages_participant_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
    )
  );

-- Active le temps réel sur les messages (messagerie instantanée)
alter publication supabase_realtime add table public.messages;

-- =============================================================================
--  ✅ Terminé. Votre backend Chap.ci est prêt.
-- =============================================================================
