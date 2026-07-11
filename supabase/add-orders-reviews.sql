-- =============================================================================
--  Chap.ci — Achats (panier), demandes d'achat et avis
-- =============================================================================
--  👉 À exécuter UNE fois : Supabase → SQL Editor → New query → coller → Run.
--     Sans danger : réexécutable (idempotent).
-- =============================================================================

-- ---------- Profils : champs supplémentaires ---------------------------------
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;

-- ---------- COMMANDES (demandes d'achat, groupées par vendeur) ---------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references auth.users (id) on delete cascade,
  seller_id       uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  status          text not null default 'en_cours', -- en_cours | finalise | annule
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

-- Commandes : visibles/modifiables par l'acheteur et le vendeur concernés
drop policy if exists "orders_participant_select" on public.orders;
create policy "orders_participant_select" on public.orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "orders_buyer_insert" on public.orders;
create policy "orders_buyer_insert" on public.orders
  for insert with check (auth.uid() = buyer_id);

drop policy if exists "orders_participant_update" on public.orders;
create policy "orders_participant_update" on public.orders
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Articles de commande : via la commande parente
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

-- ---------- AVIS (réservés aux acheteurs) ------------------------------------
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

-- Lecture publique des avis (tout le monde peut les consulter)
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
  for select using (true);

-- ⭐ Un avis n'est possible QUE si l'utilisateur a une commande pour cet article
drop policy if exists "reviews_insert_buyers_only" on public.reviews;
create policy "reviews_insert_buyers_only" on public.reviews
  for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.listing_id = reviews.listing_id
        and o.buyer_id = auth.uid()
    )
  );

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = reviewer_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = reviewer_id);

-- =============================================================================
--  ✅ Terminé.
-- =============================================================================
