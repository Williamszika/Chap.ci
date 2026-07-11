-- =============================================================================
--  Chap.ci — INSTALLATION COMPLÈTE (un seul fichier)
-- =============================================================================
--  👉 Supabase → SQL Editor → New query → COLLER TOUT CE FICHIER → Run.
--     Idempotent : peut être relancé sans danger. Crée toutes les tables,
--     colonnes, règles de sécurité (RLS) et fonctions nécessaires à Chap.ci.
-- =============================================================================

-- ================= PROFILS ====================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists gender     text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists region_id  text;
alter table public.profiles add column if not exists city_id    text;
alter table public.profiles add column if not exists commune    text;
alter table public.profiles add column if not exists address    text;
alter table public.profiles add column if not exists lat        double precision;
alter table public.profiles add column if not exists lng        double precision;

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================= ANNONCES ===================================================
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
alter table public.listings add column if not exists lat double precision;
alter table public.listings add column if not exists lng double precision;
create index if not exists listings_created_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category_id);
create index if not exists listings_region_idx on public.listings (region_id);

alter table public.listings enable row level security;
drop policy if exists "listings_select_all" on public.listings;
create policy "listings_select_all" on public.listings for select using (true);
drop policy if exists "listings_insert_public" on public.listings;
create policy "listings_insert_public" on public.listings for insert with check (true);
drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings for update using (auth.uid() = user_id);
drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings for delete using (auth.uid() = user_id);

-- ================= MESSAGERIE =================================================
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
drop policy if exists "conversations_participant" on public.conversations;
create policy "conversations_participant" on public.conversations for all
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);
drop policy if exists "messages_participant_select" on public.messages;
create policy "messages_participant_select" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id
    and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)));
drop policy if exists "messages_participant_insert" on public.messages;
create policy "messages_participant_insert" on public.messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from public.conversations c where c.id = conversation_id
    and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)));

-- Realtime sur les messages (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ================= COMMANDES (demandes d'achat) ==============================
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references auth.users (id) on delete cascade,
  seller_id       uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  status          text not null default 'en_cours',
  created_at      timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders (seller_id, created_at desc);
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  title      text not null,
  price      bigint not null default 0,
  image      text
);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "orders_participant_select" on public.orders;
create policy "orders_participant_select" on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
drop policy if exists "orders_buyer_insert" on public.orders;
create policy "orders_buyer_insert" on public.orders for insert with check (auth.uid() = buyer_id);
drop policy if exists "orders_participant_update" on public.orders;
create policy "orders_participant_update" on public.orders for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id
    and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())));
drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- ================= AVIS (réservés aux acheteurs) =============================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.listings (id) on delete cascade,
  seller_id   uuid not null references auth.users (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (listing_id, reviewer_id)
);
create index if not exists reviews_seller_idx on public.reviews (seller_id, created_at desc);
create index if not exists reviews_listing_idx on public.reviews (listing_id, created_at desc);

alter table public.reviews enable row level security;
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);
drop policy if exists "reviews_insert_buyers_only" on public.reviews;
create policy "reviews_insert_buyers_only" on public.reviews for insert with check (
  auth.uid() = reviewer_id and exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.listing_id = reviews.listing_id and o.buyer_id = auth.uid()));
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = reviewer_id);
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = reviewer_id);

-- ================= SUPPRESSION DE COMPTE ======================================
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  delete from public.listings where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end; $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- =============================================================================
--  ✅ Installation terminée. Chap.ci est prêt.
-- =============================================================================
