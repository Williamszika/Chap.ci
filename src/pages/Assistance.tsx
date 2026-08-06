// =============================================================================
//  L'ASSISTANCE — le seul écran de la messagerie de l'équipe.
//
//  UN écran, et non trois, pour trois usages qui sont le même geste : écrire à
//  quelqu'un et attendre sa réponse.
//
//    · un membre écrit à l'équipe et suit ses demandes ;
//    · un administrateur ou un modérateur répond, et clôt quand c'est réglé ;
//    · les modérateurs ouvrent entre eux un fil que les membres ne voient pas.
//
//  Ce que voit chacun vient du serveur, jamais d'une condition écrite ici : la
//  liste d'un membre ne contient que ses fils, celle de l'équipe les contient
//  tous. Un écran qui filtrerait lui-même finirait par oublier un cas.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LifeBuoy, Lock, Plus, Send, ShieldCheck, Users } from 'lucide-react'
import {
  chargerFil, chargerFils, changerStatut, ouvrirFil, repondre,
  type Fil, type MessageFil,
} from '../lib/equipe'
import { isPhp } from '../lib/backend'
import { useAuth } from '../store/AuthContext'
import { timeAgo } from '../lib/format'

export function Assistance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [equipe, setEquipe] = useState(false)
  const [fils, setFils] = useState<Fil[]>([])
  const [chargement, setChargement] = useState(true)
  // Une panne réseau n'est pas « aucune demande » : on distingue les deux,
  // sinon on annonce au membre que son message n'existe pas.
  const [panne, setPanne] = useState(false)
  const [onglet, setOnglet] = useState<'user' | 'staff'>('user')
  const [nouveau, setNouveau] = useState(false)

  const charger = useCallback(() => {
    if (!isPhp || !user) { setChargement(false); return }
    setChargement(true); setPanne(false)
    chargerFils()
      .then((r) => { setEquipe(r.equipe); setFils(r.fils) })
      .catch(() => setPanne(true))
      .finally(() => setChargement(false))
  }, [user])

  useEffect(() => { charger() }, [charger])

  if (!user) {
    return (
      <Cadre titre="Assistance">
        <Vide
          icone={<LifeBuoy size={30} className="text-primary-500" />}
          titre="Connectez-vous pour écrire à l’équipe"
          texte="Vos échanges avec nous restent attachés à votre compte : c’est ce qui nous permet de retrouver votre annonce et de vous répondre."
          action={<button onClick={() => navigate('/connexion')} className="btn-primary">Se connecter</button>}
        />
      </Cadre>
    )
  }

  if (id) return <FilOuvert id={id} equipe={equipe} onRetour={() => { navigate('/assistance'); charger() }} />

  const visibles = equipe ? fils.filter((f) => f.kind === onglet) : fils

  return (
    <Cadre
      titre="Assistance"
      action={
        <button
          onClick={() => setNouveau((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-2 text-sm font-bold text-white active:opacity-80"
        >
          <Plus size={16} /> {equipe && onglet === 'staff' ? 'Fil d’équipe' : 'Nouvelle demande'}
        </button>
      }
    >
      {equipe && (
        <div className="flex gap-1 border-b border-line bg-white px-4 md:px-6">
          <Onglet actif={onglet === 'user'} onClick={() => { setOnglet('user'); setNouveau(false) }}>
            <Users size={15} /> Membres
          </Onglet>
          <Onglet actif={onglet === 'staff'} onClick={() => { setOnglet('staff'); setNouveau(false) }}>
            <ShieldCheck size={15} /> Entre nous
          </Onglet>
        </div>
      )}

      {nouveau && (
        <Nouveau
          kind={equipe && onglet === 'staff' ? 'staff' : 'user'}
          onFait={(nid) => { setNouveau(false); navigate(`/assistance/${nid}`) }}
          onAnnule={() => setNouveau(false)}
        />
      )}

      {chargement && <p className="px-4 py-8 text-center text-sm text-gray-500 md:px-6">Chargement…</p>}

      {!chargement && panne && (
        <Vide
          icone={<LifeBuoy size={30} className="text-gray-500" />}
          titre="Impossible de charger vos échanges"
          texte="La connexion n’a pas abouti. Vos messages ne sont pas perdus — réessayez."
          action={<button onClick={charger} className="btn-primary">Réessayer</button>}
        />
      )}

      {!chargement && !panne && visibles.length === 0 && !nouveau && (
        <Vide
          icone={<LifeBuoy size={30} className="text-primary-500" />}
          titre={equipe && onglet === 'staff' ? 'Aucun fil d’équipe' : equipe ? 'Aucune demande de membre' : 'Aucune demande pour l’instant'}
          texte={
            equipe
              ? 'Rien à traiter. C’est bon signe.'
              : 'Une annonce masquée, un compte bloqué, un doute sur un vendeur : écrivez-nous, une vraie personne vous répond.'
          }
          action={
            !equipe || onglet === 'staff' ? (
              <button onClick={() => setNouveau(true)} className="btn-primary">
                {equipe ? 'Ouvrir un fil' : 'Écrire à l’équipe'}
              </button>
            ) : undefined
          }
        />
      )}

      <ul className="divide-y divide-line">
        {visibles.map((f) => (
          <li key={f.id}>
            <button
              onClick={() => navigate(`/assistance/${f.id}`)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/60 md:px-6"
            >
              <span
                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  f.kind === 'staff' ? 'bg-ivoire-green/15 text-ivoire-green-dark' : 'bg-primary-50 text-primary-600'
                }`}
              >
                {f.kind === 'staff' ? <ShieldCheck size={17} /> : <LifeBuoy size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-gray-900">{f.sujet}</span>
                  {f.nonLus > 0 && (
                    <span className="shrink-0 rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-extrabold text-white">
                      {f.nonLus}
                    </span>
                  )}
                  {f.statut === 'closed' && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Close
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-gray-500">
                  {equipe && f.kind === 'user' && f.userNom ? `${f.userNom} · ` : ''}
                  {f.dernierPar === 'equipe' ? 'Équipe' : 'Membre'} · {timeAgo(f.dernierLe)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Cadre>
  )
}

// -----------------------------------------------------------------------------
//  Un fil ouvert
// -----------------------------------------------------------------------------

function FilOuvert({ id, equipe, onRetour }: { id: string; equipe: boolean; onRetour: () => void }) {
  const [fil, setFil] = useState<Fil | null>(null)
  const [messages, setMessages] = useState<MessageFil[]>([])
  const [chargement, setChargement] = useState(true)
  const [panne, setPanne] = useState(false)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const bas = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setChargement(true); setPanne(false)
    chargerFil(id)
      .then((r) => { setFil(r.fil); setMessages(r.messages) })
      .catch(() => setPanne(true))
      .finally(() => setChargement(false))
  }, [id])

  useEffect(() => { bas.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const t = texte.trim()
    if (!t || envoi) return
    setEnvoi(true); setErreur('')
    try {
      const m = await repondre(id, t)
      setMessages((prev) => [...prev, m])
      setTexte('')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le message n’est pas parti. Réessayez.')
    } finally {
      setEnvoi(false)
    }
  }

  async function basculer() {
    if (!fil) return
    const suivant = fil.statut === 'open' ? 'closed' : 'open'
    await changerStatut(id, suivant)
    setFil({ ...fil, statut: suivant })
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-200 md:min-h-0">
      <div className="flex items-center gap-2 border-b border-line bg-white px-3 py-3 md:px-6">
        <button onClick={onRetour} aria-label="Retour" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-gray-600 active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-ink">{fil?.sujet ?? 'Conversation'}</p>
          {fil && (
            <p className="truncate text-[12px] text-gray-500">
              {fil.kind === 'staff' ? 'Fil d’équipe — invisible des membres' : equipe ? (fil.userNom || 'Membre') : 'Équipe Chap.ci'}
              {fil.statut === 'closed' ? ' · close' : ''}
            </p>
          )}
        </div>
        {equipe && fil && (
          <button onClick={basculer} className="shrink-0 rounded-full border border-line2 px-3 py-1.5 text-[13px] font-semibold text-gray-700 active:opacity-70">
            {fil.statut === 'open' ? 'Clore' : 'Rouvrir'}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 px-4 py-4 md:px-6">
        {chargement && <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>}
        {!chargement && panne && (
          <p className="py-8 text-center text-sm text-gray-500">
            Impossible de charger cette conversation. Vérifiez votre connexion et réessayez.
          </p>
        )}
        {messages.map((m) => {
          // « À moi » se lit du point de vue de celui qui regarde : l'équipe voit
          // ses réponses à droite, le membre voit les siennes à droite. Le même
          // message change donc de côté selon qui lit — c'est voulu.
          const aMoi = equipe ? m.role === 'equipe' : m.role === 'utilisateur'
          return (
            <div key={m.id} className={`flex ${aMoi ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  aMoi ? 'bg-primary-500 text-white' : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                {!aMoi && <p className="mb-0.5 text-[11px] font-bold opacity-70">{m.nom}</p>}
                <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-[11px] ${aMoi ? 'text-white/70' : 'text-gray-500'}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bas} />
      </div>

      {fil?.statut === 'closed' ? (
        <p className="flex items-center justify-center gap-2 border-t border-line bg-white px-4 py-4 text-sm text-gray-500">
          <Lock size={15} /> Cette conversation est close.
          {!equipe && ' Ouvrez-en une nouvelle si vous avez besoin de nous.'}
        </p>
      ) : (
        <form onSubmit={envoyer} className="sticky bottom-0 border-t border-line bg-white px-3 py-3 md:px-6">
          {erreur && <p className="mb-2 text-[13px] font-semibold text-red-600">{erreur}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={1}
              maxLength={4000}
              placeholder="Votre message…"
              aria-label="Votre message"
              className="input max-h-32 min-h-[44px] flex-1 resize-y py-2.5"
            />
            <button
              type="submit"
              disabled={!texte.trim() || envoi}
              aria-label="Envoyer"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-500 text-white transition active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
//  Ouvrir une demande
// -----------------------------------------------------------------------------

function Nouveau({
  kind, onFait, onAnnule,
}: { kind: 'user' | 'staff'; onFait: (id: string) => void; onAnnule: () => void }) {
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (envoi) return
    setEnvoi(true); setErreur('')
    try {
      onFait(await ouvrirFil(sujet.trim(), message.trim(), kind))
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La demande n’est pas partie. Réessayez.')
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-3 border-b border-line bg-white px-4 py-4 md:px-6">
      <div>
        <label htmlFor="as-sujet" className="mb-1 block text-[13.5px] font-semibold text-gray-700">
          Objet <span className="font-black text-primary-600" aria-hidden>*</span>
        </label>
        <input
          id="as-sujet"
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          maxLength={120}
          placeholder={kind === 'staff' ? 'Ex : compte suspect à surveiller' : 'Ex : mon annonce a été masquée'}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="as-message" className="mb-1 block text-[13.5px] font-semibold text-gray-700">
          Votre message <span className="font-black text-primary-600" aria-hidden>*</span>
        </label>
        <textarea
          id="as-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder={
            kind === 'staff'
              ? 'Ce que les autres modérateurs doivent savoir.'
              : 'Dites-nous ce qui se passe, et donnez le titre de l’annonce concernée si c’en est une.'
          }
          className="input resize-y"
        />
        {kind === 'user' && (
          <p className="mt-1.5 text-xs text-gray-500">
            N’écrivez jamais ici un mot de passe ni un code reçu par SMS. Nous ne vous les demanderons jamais.
          </p>
        )}
      </div>
      {erreur && <p className="text-[13px] font-semibold text-red-600">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={!sujet.trim() || !message.trim() || envoi} className="btn-primary disabled:opacity-50">
          {envoi ? 'Envoi…' : 'Envoyer'}
        </button>
        <button type="button" onClick={onAnnule} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 active:opacity-70">
          Annuler
        </button>
      </div>
    </form>
  )
}

// -----------------------------------------------------------------------------
//  Petites pièces
// -----------------------------------------------------------------------------

function Cadre({ titre, action, children }: { titre: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-200 pb-16 md:min-h-0 md:pb-8">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 md:px-6 md:py-5">
        <h1 className="font-display text-[22px] font-extrabold text-ink md:text-2xl">{titre}</h1>
        {action}
      </div>
      {children}
    </div>
  )
}

function Onglet({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-bold transition ${
        actif ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'
      }`}
    >
      {children}
    </button>
  )
}

function Vide({
  icone, titre, texte, action,
}: { icone: React.ReactNode; titre: string; texte: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm">{icone}</div>
      <p className="text-[16px] font-extrabold text-ink">{titre}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-gray-600">{texte}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
