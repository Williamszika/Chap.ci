-- =============================================================================
--  Chap.ci — Promotions (prix réduit à durée limitée)
-- =============================================================================
--  À exécuter une fois dans Supabase → SQL Editor pour que les promotions
--  soient partagées entre tous les utilisateurs. Idempotent (réexécutable).
--
--  Sans cette migration, l'application fonctionne quand même : les annonces se
--  créent normalement, mais le prix promo n'est pas enregistré côté serveur.
-- =============================================================================

alter table public.listings
  add column if not exists promo_price numeric,
  add column if not exists promo_until timestamptz;
