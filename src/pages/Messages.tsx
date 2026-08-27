import { useCallback, useEffect, useMemo, useState } from 'react'
import { mediaUrl, thumbUrl } from '../lib/native'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, MessageCircle, LogIn, Plus, X, Zap } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import { createReponse, deleteReponse, fetchReponses, type ReponsePrete } from '../lib/api'
import { phpReponseAuto, phpEnregistrerReponseAuto } from '../lib/php'
import { Bascule } from '../components/Bascule'
import { timeAgo } from '../lib/format'
import type { Conversation } from '../types'

/**
 * « Messages » — répondre vite, sans chercher (maquette validée le 27/08).
 *
 * Le classement est l'écran : une conversation à laquelle on n'a pas répondu
 * remonte en haut avec le nombre de jours d'attente et l'annonce concernée.
 * Un acheteur qui attend deux jours ne revient pas — et le taux de réponse est
 * le premier chiffre qu'il regarde avant d'écrire au suivant.
 */

type Filtre = 'sans' | 'toutes' | 'acheteurs' | 'archivees'

/** Trois phrases proposées tant que le vendeur n'en a enregistré aucune. */
const MODELES = [
  'Oui, c’est disponible.',
  'Je livre à…',
  'Mon dernier prix est…',
]

/** Initiale d'affichage de l'avatar, dérivée du nom de l'interlocuteur. */
function avatarInitial(name?: string): string {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

/**
 * Couleur du rond, tirée du nom : la même personne garde la même teinte d'une
 * fois sur l'autre, on la reconnaît avant d'avoir lu.
 */
const TEINTES = [
  'bg-cream-100 text-primary-700',
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-pink-50 text-pink-700',
]
function teinte(nom?: string): string {
  let n = 7
  for (const c of nom ?? '') n = (n * 31 + c.charCodeAt(0)) % 9973
  return TEINTES[n % TEINTES.length]
}

/** « 2 j sans réponse », « 3 h sans réponse » — l'attente, en clair. */
function attente(depuis: number): string {
  const min = Math.max(0, Math.round((Date.now() - depuis) / 60000))
  if (min >= 2880) return `${Math.floor(min / 1440)} j sans réponse`
  if (min >= 1440) return '1 j sans réponse'
  if (min >= 60) return `${Math.floor(min / 60)} h sans réponse`
  return 'à répondre'
}

/** Liste des conversations (réutilisée dans les deux volets). */
export function ConversationList({ activeId }: { activeId?: string }) {
  const navigate = useNavigate()
  // Arrivé depuis le compte ? La flèche y ramène, et elle reste visible sur
  // ordinateur : sinon on entre dans les messages depuis le tableau de bord
  // sans aucun chemin de retour.
  const { state } = useLocation()
  const retour = (state as { retour?: string } | null)?.retour
  const { user, enabled, loading: authLoading } = useAuth()
  const { conversations: convs, loading, unreadConvIds, refresh } = useNotifications()
  const [filtre, setFiltre] = useState<Filtre>('toutes')

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  const moi = user?.id

  /**
   * Une conversation « sans réponse » : le dernier mot HUMAIN est à l'autre.
   * La réponse automatique du vendeur ne compte pas — sinon cet écran se
   * viderait tout seul et l'acheteur attendrait quand même.
   */
  const sansReponse = useCallback(
    (c: Conversation) => {
      const dernier = c.dernierHumain ?? c.lastSenderId
      return !c.archived && !!dernier && dernier !== moi
    },
    [moi],
  )

  const compte = useMemo(() => ({
    sans: convs.filter(sansReponse).length,
    toutes: convs.filter((c) => !c.archived).length,
    acheteurs: convs.filter((c) => !c.archived && c.sellerId === moi).length,
    archivees: convs.filter((c) => c.archived).length,
  }), [convs, moi, sansReponse])

  const liste = useMemo(() => {
    let out = convs.filter((c) => !c.archived)
    if (filtre === 'sans') out = out.filter(sansReponse)
    else if (filtre === 'acheteurs') out = out.filter((c) => c.sellerId === moi)
    else if (filtre === 'archivees') out = convs.filter((c) => c.archived)
    // Celles qui attendent d'abord, la plus ancienne en tête : c'est celle-là
    // qu'on risque de perdre.
    return [...out].sort((a, b) => {
      const sa = sansReponse(a) ? 1 : 0, sb = sansReponse(b) ? 1 : 0
      if (sa !== sb) return sb - sa
      if (sa === 1) return (a.lastAt ?? 0) - (b.lastAt ?? 0)
      return (b.lastAt ?? 0) - (a.lastAt ?? 0)
    })
  }, [convs, filtre, moi, sansReponse])

  const renderRow = (c: Conversation) => {
    const unread = unreadConvIds.has(c.id)
    const isActive = c.id === activeId
    const attend = sansReponse(c)
    const dernier = c.dernierHumain ?? c.lastSenderId
    const jaiRepondu = !!dernier && dernier === moi
    return (
      <Link
        key={c.id}
        to={`/messages/${c.id}`}
        className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-cream-100 ${
          isActive ? 'bg-primary-50' : attend ? 'bg-red-50/40' : unread ? 'bg-primary-50/50' : ''
        }`}
      >
        <div className="relative shrink-0">
          <div className={`grid h-12 w-12 place-items-center rounded-full font-display text-lg font-extrabold ${teinte(c.otherName)}`}>
            {avatarInitial(c.otherName)}
          </div>
          {unread && (
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-primary-500 ring-2 ring-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`min-w-0 truncate font-display text-gray-900 ${unread ? 'font-extrabold' : 'font-bold'}`}>
              {c.otherName}
              {attend && (
                <span className="ml-1.5 whitespace-nowrap rounded-md bg-red-50 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-red-600">
                  {attente(c.lastAt ?? Date.now())}
                </span>
              )}
            </p>
            {/* L'attente est déjà dite par la pastille rouge : on ne l'écrit
                pas deux fois sur la même ligne. */}
            {!attend && (
              <span className={`shrink-0 text-[11px] ${unread ? 'font-bold text-primary-600' : 'text-gray-500'}`}>
                {c.lastAt ? timeAgo(c.lastAt) : ''}
              </span>
            )}
          </div>
          <p className={`truncate text-sm ${attend || unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
            {c.lastMessage
              ? c.lastAuto ? `Réponse automatique : « ${c.lastMessage} »`
                : jaiRepondu ? `Vous : « ${c.lastMessage} »` : `« ${c.lastMessage} »`
              : 'Nouvelle conversation'}
          </p>
          {c.listingTitle && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-primary-600">
              {c.listingImage && (
                <img src={mediaUrl(thumbUrl(c.listingImage))} alt=""
                  className="h-4 w-4 shrink-0 rounded object-cover" />
              )}
              <span className="truncate">{c.listingTitle}</span>
            </p>
          )}
        </div>
        {jaiRepondu && c.sellerId === moi && (
          <span className="mt-1 shrink-0 whitespace-nowrap rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
            Répondu
          </span>
        )}
      </Link>
    )
  }

  const vide = compte.toutes === 0 && compte.archivees === 0

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-white/90 px-3 py-3 backdrop-blur-md md:rounded-t-3xl">
        <button onClick={() => (retour ? navigate(retour) : navigate(-1))} aria-label="Retour"
          className={`-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-cream-100 ${retour ? '' : 'md:hidden'}`}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-extrabold text-ink">Messages</h1>
        {compte.sans > 0 && (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1.5 text-[12px] font-extrabold text-white">
            {compte.sans}
          </span>
        )}
      </header>

      <div className="flex-1 md:min-h-0 md:overflow-y-auto">
        {!enabled || (!user && !authLoading) ? (
          <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-50">
              <MessageCircle size={36} className="text-primary-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">Connectez-vous pour discuter</p>
            <p className="max-w-xs text-sm text-gray-500">
              Créez un compte pour contacter les vendeurs et suivre vos conversations.
            </p>
            <button onClick={() => navigate('/connexion')} className="btn-primary mt-2">
              <LogIn size={18} /> Se connecter
            </button>
          </div>
        ) : loading || authLoading ? (
          <div className="py-24 text-center text-sm text-gray-500">Chargement…</div>
        ) : vide ? (
          <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
            <div className="text-5xl">💬</div>
            <p className="text-lg font-bold text-gray-800">Aucune conversation</p>
            <p className="max-w-xs text-sm text-gray-500">
              Ouvrez une annonce et appuyez sur « Contacter le vendeur » pour démarrer une discussion.
            </p>
            <Link to="/explorer" className="btn-outline mt-2 py-2">
              Explorer les annonces
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pb-4 md:pb-0">
            {/* Filtrer — « sans réponse » d'abord, c'est le tas qui coûte cher. */}
            <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-4 py-3">
              {compte.sans > 0 && (
                <button onClick={() => setFiltre('sans')}
                  className={`chip-etat ${filtre === 'sans' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
                  Sans réponse · {compte.sans}
                </button>
              )}
              <button onClick={() => setFiltre('toutes')}
                className={`chip-etat ${filtre === 'toutes' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
                Toutes · {compte.toutes}
              </button>
              {compte.acheteurs > 0 && (
                <button onClick={() => setFiltre('acheteurs')}
                  className={`chip-etat ${filtre === 'acheteurs' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
                  Acheteurs
                </button>
              )}
              {compte.archivees > 0 && (
                <button onClick={() => setFiltre('archivees')}
                  className={`chip-etat ${filtre === 'archivees' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
                  Archivées
                </button>
              )}
            </div>

            {liste.length === 0 ? (
              <p className="bg-white px-4 py-16 text-center text-sm text-gray-500">
                {filtre === 'sans' ? 'Tout le monde a eu sa réponse.'
                  : filtre === 'acheteurs' ? 'Aucun acheteur ne vous a encore écrit.'
                    : filtre === 'archivees' ? 'Aucune conversation archivée.'
                      : 'Toutes vos conversations sont archivées.'}
              </p>
            ) : (
              <div className="divide-y divide-line bg-white">{liste.map(renderRow)}</div>
            )}

            {(compte.acheteurs > 0 || filtre === 'sans') && (
              <div className="space-y-3 px-4 md:pb-4">
                <ReponseAutomatique />
                <ReponsesPretes />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Trois phrases proposées à qui n'a pas encore écrit la sienne. */
const MODELES_AUTO = [
  'Bonjour et merci pour votre message. Je vous réponds dans la journée.',
  'Bonjour ! Nous sommes ouverts du lundi au samedi. Je reviens vers vous très vite.',
  'Merci de votre intérêt. Dites-moi la quantité et votre commune, je vous fais un prix.',
]

/**
 * « 🤖 Réponse automatique » — la phrase qui part toute seule quand un acheteur
 * écrit pour la première fois.
 *
 * Elle achète du temps, elle ne remplace personne : le serveur la marque comme
 * automatique, elle ne compte PAS dans le taux de réponse et la conversation
 * reste dans « Sans réponse » tant que le vendeur n'a pas écrit lui-même. Le
 * bloc le dit, parce qu'un vendeur qui croirait le contraire perdrait ses
 * acheteurs en pensant les avoir servis.
 */
function ReponseAutomatique() {
  const [texte, setTexte] = useState('')
  const [active, setActive] = useState(false)
  const [chargee, setChargee] = useState(false)
  const [modifie, setModifie] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    phpReponseAuto()
      .then((r) => { if (!actif) return; setTexte(r.texte); setActive(r.active) })
      .catch(() => {})
      .finally(() => actif && setChargee(true))
    return () => { actif = false }
  }, [])

  const enregistrer = async (t: string, a: boolean) => {
    setOccupe(true); setErreur('')
    try {
      const r = await phpEnregistrerReponseAuto({ texte: t, active: a })
      setTexte(r.texte); setActive(r.active); setModifie(false)
    } catch (e) { setErreur((e as Error).message) }
    finally { setOccupe(false) }
  }

  if (!chargee) return null

  return (
    <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5">
      <div className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-display text-[13.5px] font-extrabold text-ink">
            <Bot size={15} className="text-primary-600" /> Réponse automatique
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-gray-600">
            Part toute seule quand un acheteur vous écrit pour la première fois.
          </span>
        </span>
        <button onClick={() => enregistrer(texte, !active)} disabled={occupe || (!active && !texte.trim())}
          aria-label={active ? 'Désactiver' : 'Activer'} className="shrink-0 disabled:opacity-40">
          <Bascule active={active} />
        </button>
      </div>

      <textarea value={texte} maxLength={400}
        onChange={(e) => { setTexte(e.target.value); setModifie(true) }}
        rows={2} placeholder="Votre phrase d’accueil…"
        className="mt-2.5 w-full resize-none rounded-xl bg-white px-3 py-2 text-[13px] leading-relaxed text-ink outline-none ring-1 ring-line focus:ring-primary-400" />

      {texte.trim() === '' && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MODELES_AUTO.map((m) => (
            <button key={m} onClick={() => { setTexte(m); setModifie(true) }}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-3 py-1.5 text-left text-[11.5px] font-semibold text-gray-600 ring-1 ring-dashed ring-line transition hover:text-primary-700">
              <Plus size={11} className="shrink-0" /> <span className="truncate">{m}</span>
            </button>
          ))}
        </div>
      )}

      {modifie && (
        <button onClick={() => enregistrer(texte, active)} disabled={occupe}
          className="mt-2 w-full rounded-xl bg-ink py-2 text-[12.5px] font-extrabold text-white disabled:opacity-50">
          Enregistrer la phrase
        </button>
      )}
      {erreur && <p className="mt-2 text-[11.5px] font-semibold text-red-600">{erreur}</p>}

      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
        Elle ne compte pas comme votre réponse : la conversation reste dans
        « Sans réponse » tant que vous n’avez pas écrit vous-même, et votre taux de
        réponse ne bouge pas.
      </p>
    </div>
  )
}

/**
 * « ⚡ Réponses toutes prêtes » — les phrases qu'on retape vingt fois par jour,
 * enregistrées une bonne fois. Elles se posent d'un appui dans la conversation.
 */
function ReponsesPretes() {
  const [liste, setListe] = useState<ReponsePrete[]>([])
  const [chargee, setChargee] = useState(false)
  const [saisie, setSaisie] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  useEffect(() => {
    fetchReponses()
      .then(setListe)
      .catch(() => {})
      .finally(() => setChargee(true))
  }, [])

  const ajouter = async (texte: string) => {
    const t = texte.trim()
    if (!t || occupe) return
    setOccupe(true)
    try {
      const creee = await createReponse(t)
      setListe((p) => [...p, creee])
      setSaisie(null)
    }
    catch { /* la phrase reste dans le champ, le vendeur réessaie */ }
    finally { setOccupe(false) }
  }

  const retirer = async (id: string) => {
    setListe((p) => p.filter((r) => r.id !== id))
    try { await deleteReponse(id) } catch { /* rechargée au prochain passage */ }
  }

  if (!chargee) return null

  return (
    <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5">
      <p className="flex items-center gap-1.5 font-display text-[13.5px] font-extrabold text-ink">
        <Zap size={15} className="text-primary-600" /> Réponses toutes prêtes
      </p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">
        Un appui, la phrase s’écrit dans la conversation — vous n’avez plus qu’à envoyer.
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {liste.map((r) => (
          <span key={r.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 ring-1 ring-line">
            <span className="truncate">{r.texte}</span>
            <button onClick={() => retirer(r.id)} aria-label="Retirer cette réponse"
              className="shrink-0 text-gray-400 transition hover:text-red-600">
              <X size={13} />
            </button>
          </span>
        ))}

        {/* Aucune enregistrée : on propose les trois plus utiles, à prendre d'un appui. */}
        {liste.length === 0 && MODELES.map((m) => (
          <button key={m} onClick={() => ajouter(m)} disabled={occupe}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 ring-1 ring-dashed ring-line transition hover:text-primary-700 disabled:opacity-50">
            <Plus size={12} /> {m}
          </button>
        ))}

        {liste.length < 12 && saisie === null && (
          <button onClick={() => setSaisie('')}
            className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1.5 text-[12px] font-extrabold text-white transition active:scale-95">
            <Plus size={13} /> Créer
          </button>
        )}
      </div>

      {saisie !== null && (
        <form onSubmit={(e) => { e.preventDefault(); ajouter(saisie) }} className="mt-2.5 flex gap-2">
          <input autoFocus value={saisie} onChange={(e) => setSaisie(e.target.value)}
            maxLength={400} placeholder="Votre phrase, telle qu’elle partira…"
            className="min-w-0 flex-1 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] outline-none focus:border-primary-400" />
          <button type="submit" disabled={occupe || !saisie.trim()}
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-[12.5px] font-extrabold text-white disabled:opacity-40">
            Enregistrer
          </button>
          <button type="button" onClick={() => setSaisie(null)} aria-label="Annuler"
            className="shrink-0 rounded-full px-2 text-gray-400">
            <X size={16} />
          </button>
        </form>
      )}
    </div>
  )
}

export function Messages() {
  return (
    <div className="min-h-screen bg-cream-200 md:mx-auto md:max-w-3xl md:px-4 md:py-4">
      <div className="md:overflow-hidden md:rounded-3xl md:border md:border-line md:bg-white md:shadow-card">
        <ConversationList />
      </div>
    </div>
  )
}
