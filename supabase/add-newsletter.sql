-- =============================================================================
--  Chap.ci — Newsletter (abonnés email)
-- =============================================================================
--  À exécuter une fois dans Supabase → SQL Editor (utile uniquement en mode
--  Supabase ; le backend PHP auto-hébergé crée la table automatiquement).
--  Idempotent (réexécutable sans risque).
-- =============================================================================

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.newsletter enable row level security;

-- N'importe qui peut s'abonner (insertion publique).
drop policy if exists "newsletter_insert_public" on public.newsletter;
create policy "newsletter_insert_public"
  on public.newsletter for insert
  to anon, authenticated
  with check (true);

-- Lecture réservée : à restreindre à vos administrateurs. Par défaut, aucune
-- lecture publique (l'export se fait via le tableau de bord Supabase, ou en
-- ajoutant ici une policy basée sur votre table d'administrateurs).
drop policy if exists "newsletter_no_public_select" on public.newsletter;
