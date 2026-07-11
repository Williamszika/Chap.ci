-- =============================================================================
--  Chap.ci — Ajout de la géolocalisation aux annonces
-- =============================================================================
--  👉 À exécuter UNE fois si vous avez déjà créé les tables avant la
--     fonctionnalité de géolocalisation.
--     Supabase → SQL Editor → New query → coller → Run.
--  (Sans danger : ne fait rien si les colonnes existent déjà.)
-- =============================================================================

alter table public.listings add column if not exists lat double precision;
alter table public.listings add column if not exists lng double precision;
