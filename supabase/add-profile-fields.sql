-- =============================================================================
--  Chap.ci — Champs de profil détaillés (inscription complète)
-- =============================================================================
--  👉 À exécuter UNE fois : Supabase → SQL Editor → New query → coller → Run.
--     Sans danger (idempotent).
-- =============================================================================

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists gender     text;   -- homme | femme | autre
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists region_id  text;
alter table public.profiles add column if not exists city_id    text;
alter table public.profiles add column if not exists commune    text;
alter table public.profiles add column if not exists address    text;   -- adresse/quartier (géocodage)
alter table public.profiles add column if not exists lat        double precision;
alter table public.profiles add column if not exists lng        double precision;

-- =============================================================================
--  ✅ Terminé.
-- =============================================================================
