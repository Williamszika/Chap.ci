import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Briefcase, MapPin, Banknote, Clock, ExternalLink, Share2, CheckCircle2,
  Users, ChevronDown, ChevronUp, Loader2, Mail, Phone, Settings2,
} from 'lucide-react'
import {
  phpOffre, phpCandidater, phpCandidatures, ApiError,
  type Offre, type Candidature, type ChampFormulaire,
} from '../lib/php'
import { labelTypePro } from '../data/secteursPro'
import { mediaUrl } from '../lib/native'
import { timeAgo } from '../lib/format'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'
import { ChampsCandidature, PuceOffre, dateOffre, offreFermee } from '../components/Offres'

/**
 * Une offre d'emploi (06/09/2026) — /emploi/{id}.
 *
 * Pour le candidat : qui recrute, le poste, et comment postuler — par le lien
 * de la structure (Google Forms, WhatsApp, son site), par le formulaire qu'elle
 * a dessiné, ou les deux. Pour l'auteur : les candidatures reçues, une par
 * personne, avec les réponses question par question.
 */
export function Emploi() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [offre, setOffre] = useState<Offre | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!id) return
    let vivant = true
    setChargement(true); setErreur(null)
    phpOffre(id)
      .then((o) => { if (vivant) setOffre(o) })
      .catch((e: unknown) => {
        if (!vivant) return
        const s = e instanceof ApiError ? e.status : 0
        setErreur(s === 410 ? 'Cette offre est fermée : la structure ne prend plus de candidatures.'
          : s === 404 ? 'Cette offre n’existe plus.'
          : 'Impossible de charger l’offre. Vérifiez votre connexion.')
      })
      .finally(() => { if (vivant) setChargement(false) })
    return () => { vivant = false }
  }, [id, user?.id])

  async function partager() {
    if (!offre) return
    const url = `${window.location.origin}/emploi/${offre.id}`
    const texte = `${offre.titre} — ${offre.entreprise}${offre.lieu ? ' · ' + offre.lieu : ''}`
    if (navigator.share) {
      try { await navigator.share({ title: offre.titre, text: texte, url }) } catch { /* annulé */ }
      return
    }
    try { await navigator.clipboard.writeText(url); toast.success('Lien copié.') }
    catch { toast.error('Copie impossible — copiez l’adresse de la page.') }
  }

  const proprietaire = !!user && !!offre && offre.userId === user.id
  const fermee = !!offre && offreFermee(offre)
  const structure = offre?.typeStructure ? labelTypePro(offre.typeStructure) : 'Structure vérifiée'

  return (
    <div className="min-h-screen bg-cream-200 md:mx-auto md:max-w-3xl">
      <header className="safe-top flex items-center gap-2 px-4 pb-2 pt-3">
        <button onClick={() => navigate(-1)} aria-label="Retour"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-card transition active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Offre d’emploi</span>
        {offre && (
          <button onClick={partager} aria-label="Partager l’offre"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-card transition active:scale-95">
            <Share2 size={18} />
          </button>
        )}
      </header>

      {chargement ? (
        <p className="py-16 text-center text-sm text-gray-500">Chargement…</p>
      ) : erreur || !offre ? (
        <div className="px-4 py-16 text-center">
          <Briefcase size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm text-gray-600">{erreur ?? 'Cette offre n’existe plus.'}</p>
          <button onClick={() => navigate('/explorer')} className="btn-outline mt-5">Voir les annonces</button>
        </div>
      ) : (
        <div className="space-y-4 px-4 pb-8">
          {/* Qui recrute, quel poste */}
          <section className="card p-4">
            <button type="button" onClick={() => navigate(`/vendeur/${offre.userId}`)}
              className="flex min-h-11 w-full items-center gap-3 text-left">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-50 text-primary-700">
                {offre.logo
                  ? <img src={mediaUrl(offre.logo)} alt={offre.entreprise} className="h-full w-full object-cover" />
                  : <Briefcase size={22} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[15px] font-extrabold text-ink">{offre.entreprise}</span>
                <span className="block text-xs text-gray-500">{structure} · Voir la page ›</span>
              </span>
            </button>
            <h1 className="mt-4 text-balance font-display text-[22px] font-black leading-tight text-ink">{offre.titre}</h1>
            {(offre.contrat || offre.lieu || offre.salaire) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {offre.contrat && <PuceOffre>{offre.contrat}</PuceOffre>}
                {offre.lieu && <PuceOffre><MapPin size={11} /> {offre.lieu}</PuceOffre>}
                {offre.salaire && <PuceOffre><Banknote size={11} /> {offre.salaire}</PuceOffre>}
              </div>
            )}
            <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-gray-500">
              <Clock size={12} /> Publiée {timeAgo(offre.createdAt)}
              {offre.expiresAt != null && !fermee && <> · jusqu’au {dateOffre(offre.expiresAt)}</>}
            </p>
            {fermee && (
              <p className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                Offre fermée
              </p>
            )}
          </section>

          <section className="card p-4">
            <h2 className="font-display text-base font-bold text-ink">Le poste</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{offre.description}</p>
          </section>

          {proprietaire
            ? <PanneauCandidatures offre={offre} />
            : !fermee && <Postuler offre={offre} connecte={!!user} onConnexion={() => navigate('/connexion')} />}
        </div>
      )}
    </div>
  )
}

/** Postuler : par le lien de la structure, par son formulaire, ou les deux. */
function Postuler({ offre, connecte, onConnexion }: { offre: Offre; connecte: boolean; onConnexion: () => void }) {
  const toast = useToast()
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [envoi, setEnvoi] = useState(false)
  const [envoyee, setEnvoyee] = useState(!!offre.dejaCandidate)
  const [probleme, setProbleme] = useState<string | null>(null)
  const parLien = !!offre.lien
  const parFormulaire = offre.formulaire.length > 0

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    if (!connecte) { onConnexion(); return }
    for (const c of offre.formulaire) {
      if (c.requis && !(reponses[c.id] ?? '').trim()) { setProbleme(`Répondez à « ${c.label} ».`); return }
    }
    setProbleme(null); setEnvoi(true)
    try {
      await phpCandidater(offre.id, { nom: reponses.nom, tel: reponses.tel, reponses })
      setEnvoyee(true)
      toast.success('Candidature envoyée.')
    } catch (err) {
      const a = err instanceof ApiError ? err : null
      if (a?.status === 409) setEnvoyee(true)
      else if (a?.status === 403 && /adresse/i.test(a.message)) {
        setProbleme('Confirmez d’abord votre adresse e-mail : Mon compte → « Confirmer mon e-mail ». Le code arrive en une minute.')
      } else setProbleme(a?.message || 'Envoi impossible. Vérifiez votre connexion et réessayez.')
    } finally { setEnvoi(false) }
  }

  return (
    <section className="card p-4">
      <h2 className="font-display text-base font-bold text-ink">Postuler</h2>
      {parLien && (
        <a href={offre.lien!} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 w-full">
          <ExternalLink size={16} /> Postuler sur le formulaire de {offre.entreprise}
        </a>
      )}
      {parLien && parFormulaire && !envoyee && (
        <p className="my-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">ou ici même</p>
      )}
      {parFormulaire && (
        envoyee ? (
          <div className="mt-3 flex items-start gap-3 rounded-xl bg-ivoire-green/10 p-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ivoire-green" />
            <p className="text-sm leading-relaxed text-gray-700">
              Candidature envoyée. {offre.entreprise} a vos réponses et vous répondra par e-mail ou par téléphone.
            </p>
          </div>
        ) : !connecte ? (
          <button onClick={onConnexion} className="btn-outline mt-3 w-full">
            Se connecter pour postuler
          </button>
        ) : (
          <form onSubmit={envoyer} className="mt-3 space-y-3">
            <ChampsCandidature champs={offre.formulaire} valeurs={reponses} disabled={envoi}
              onChange={(cid, v) => setReponses((r) => ({ ...r, [cid]: v }))} />
            {probleme && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{probleme}</p>}
            <button type="submit" disabled={envoi} className="btn-primary w-full">
              {envoi ? <Loader2 className="animate-spin" size={16} /> : <Briefcase size={16} />} Envoyer ma candidature
            </button>
            <p className="text-center text-[11px] leading-relaxed text-gray-500">
              Vos réponses et votre adresse e-mail sont transmises à {offre.entreprise}, et à personne d’autre.
            </p>
          </form>
        )
      )}
    </section>
  )
}

/** Pour l'auteur : les candidatures reçues, dépliables une à une. */
function PanneauCandidatures({ offre }: { offre: Offre }) {
  const navigate = useNavigate()
  const [data, setData] = useState<{ formulaire: ChampFormulaire[]; candidatures: Candidature[] } | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(null)

  useEffect(() => {
    let vivant = true
    phpCandidatures(offre.id)
      .then((d) => { if (vivant) setData(d) })
      .catch(() => { if (vivant) setData({ formulaire: offre.formulaire, candidatures: [] }) })
    return () => { vivant = false }
  }, [offre.id, offre.formulaire])

  const libelle = (cid: string) => data?.formulaire.find((c) => c.id === cid)?.label ?? cid

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <Users size={18} className="text-primary-600" /> Candidatures reçues
          {data && (
            <span className="tnum rounded-full bg-primary-50 px-2 py-0.5 text-xs font-extrabold text-primary-700">
              {data.candidatures.length}
            </span>
          )}
        </h2>
        <button onClick={() => navigate('/compte', { state: { tab: 'emplois' } })}
          className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary-700">
          <Settings2 size={14} /> Gérer
        </button>
      </div>
      {offre.lien && (
        <p className="mt-1 text-xs text-gray-500">Les réponses passées par votre lien externe n’apparaissent pas ici.</p>
      )}
      {!data ? (
        <p className="py-6 text-center text-sm text-gray-500">Chargement…</p>
      ) : data.candidatures.length === 0 ? (
        <p className="py-6 text-center text-sm leading-relaxed text-gray-500">
          Personne n’a encore postulé. Partagez l’offre : le bouton en haut à droite l’envoie sur WhatsApp.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {data.candidatures.map((c) => (
            <li key={c.id} className="py-2">
              <button onClick={() => setOuvert(ouvert === c.id ? null : c.id)} aria-expanded={ouvert === c.id}
                className="flex min-h-11 w-full items-center gap-3 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ivoire-green font-display font-black text-white">
                  {c.nom.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-800">{c.nom}</span>
                  <span className="block text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
                </span>
                {ouvert === c.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {ouvert === c.id && (
                <div className="mt-2 space-y-2 rounded-xl bg-cream-100 p-3 text-sm">
                  {(c.email || c.tel) && (
                    <p className="flex flex-wrap gap-x-4 gap-y-1">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary-700">
                          <Mail size={14} /> {c.email}
                        </a>
                      )}
                      {c.tel && (
                        <a href={`tel:${c.tel}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary-700">
                          <Phone size={14} /> {c.tel}
                        </a>
                      )}
                    </p>
                  )}
                  {Object.entries(c.reponses).map(([cid, v]) => v ? (
                    <p key={cid}>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">{libelle(cid)}</span>
                      <span className="whitespace-pre-line text-gray-800">{v}</span>
                    </p>
                  ) : null)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
