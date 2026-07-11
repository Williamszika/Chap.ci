-- =============================================================================
--  Chap.ci — Suppression de compte par l'utilisateur lui-même
-- =============================================================================
--  👉 À exécuter UNE fois : Supabase → SQL Editor → New query → coller → Run.
--
--  Crée une fonction sécurisée que l'utilisateur connecté peut appeler pour
--  supprimer SON PROPRE compte et toutes ses données (profil, annonces,
--  commandes, messages, avis — via les suppressions en cascade).
-- =============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Les annonces référencent l'utilisateur en "on delete set null" : on les
  -- supprime explicitement pour ne rien laisser traîner.
  delete from public.listings where user_id = auth.uid();

  -- Supprime le compte d'authentification. Les tables liées (profiles, orders,
  -- order_items, conversations, messages, reviews) sont effacées en cascade.
  delete from auth.users where id = auth.uid();
end;
$$;

-- Seuls les utilisateurs connectés peuvent appeler cette fonction (sur eux-mêmes).
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- =============================================================================
--  ✅ Terminé.
-- =============================================================================
