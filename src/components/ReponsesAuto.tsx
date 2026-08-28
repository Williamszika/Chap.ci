import { useEffect, useState } from 'react'
import { Bot, Plus, X, Zap } from 'lucide-react'
import { createReponse, deleteReponse, fetchReponses, type ReponsePrete } from '../lib/api'
import { phpReponseAuto, phpEnregistrerReponseAuto } from '../lib/php'
import { Bascule } from './Bascule'

/**
 * « Réponses automatiques » — l'écran des phrases qui répondent à votre place.
 *
 * Ces deux blocs vivaient au BAS de la liste des messages, et seulement pour un
 * vendeur qui avait déjà un acheteur : le Patron a redemandé deux fois une
 * fonctionnalité déjà en ligne parce qu'il ne l'avait jamais vue. Une
 * fonctionnalité qu'on ne trouve pas n'existe pas — elle a maintenant sa tuile
 * dans « Gérer ma boutique », son écran, et une bannière en HAUT des messages.
 */

/** Trois phrases proposées à qui n'a pas encore écrit la sienne. */
const MODELES_AUTO = [
  'Bonjour et merci pour votre message. Je vous réponds dans la journée.',
  // Espace insécable avant le « ! » : cette phrase part chez l'acheteur, la
  // typographie française s'y applique comme dans un courrier.
  'Bonjour ! Nous sommes ouverts du lundi au samedi. Je reviens vers vous très vite.',
  'Merci de votre intérêt. Dites-moi la quantité et votre commune, je vous fais un prix.',
]

/** Trois phrases proposées tant que le vendeur n'en a enregistré aucune. */
const MODELES = [
  'Oui, c’est disponible.',
  'Je livre à…',
  'Mon dernier prix est…',
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
export function ReponseAutomatique({ onChange }: { onChange?: () => void } = {}) {
  const [texte, setTexte] = useState('')
  const [active, setActive] = useState(false)
  const [chargee, setChargee] = useState(false)
  const [modifie, setModifie] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [enregistre, setEnregistre] = useState(false)
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
      // Une confirmation qui s'efface : sans elle, on ne sait pas si le bouton
      // a fait quelque chose, et on appuie trois fois.
      setEnregistre(true)
      window.setTimeout(() => setEnregistre(false), 2500)
      onChange?.()
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
        rows={3} placeholder="Votre phrase d’accueil…"
        className="mt-2.5 w-full resize-none rounded-xl bg-white px-3 py-2 text-[13px] leading-relaxed text-ink outline-none ring-1 ring-line focus:ring-primary-400" />

      {/* Les modèles restent proposés même quand une phrase est déjà écrite :
          le Patron a demandé de pouvoir PRÉ-REMPLIR, pas seulement de partir
          d'une page blanche. Un appui remplace le texte du champ. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MODELES_AUTO.map((m) => (
          <button key={m} onClick={() => { setTexte(m); setModifie(true) }}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-3 py-1.5 text-left text-[11.5px] font-semibold text-gray-600 ring-1 ring-dashed ring-line transition hover:text-primary-700">
            <Plus size={11} className="shrink-0" /> <span className="truncate">{m}</span>
          </button>
        ))}
      </div>

      {modifie && (
        <button onClick={() => enregistrer(texte, active)} disabled={occupe}
          className="mt-2 w-full rounded-xl bg-ink py-2 text-[12.5px] font-extrabold text-white disabled:opacity-50">
          Enregistrer la phrase
        </button>
      )}
      {enregistre && !modifie && (
        <p className="mt-2 text-[12px] font-bold text-ivoire-green-dark">
          ✓ Enregistré{active ? ' — elle part dès maintenant.' : ' — activez-la pour qu’elle parte.'}
        </p>
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
export function ReponsesPretes({ onChange }: { onChange?: () => void } = {}) {
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
      onChange?.()
    }
    catch { /* la phrase reste dans le champ, le vendeur réessaie */ }
    finally { setOccupe(false) }
  }

  const retirer = async (id: string) => {
    setListe((p) => p.filter((r) => r.id !== id))
    try { await deleteReponse(id); onChange?.() } catch { /* rechargée au prochain passage */ }
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

        {/* Aucune enregistrée : on propose les trois plus utiles, à prendre
            d'un appui. Une fois la liste garnie, elles disparaissent — les
            reproposer à côté de « Je livre à Yopougon et Cocody, 2 000 FCFA »
            ne ferait que doubler la même phrase en moins précis. */}
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
      {liste.length >= 12 && (
        <p className="mt-2 text-[11px] text-gray-500">
          Douze phrases enregistrées, le maximum. Retirez-en une pour en ajouter une autre.
        </p>
      )}
    </div>
  )
}

/**
 * L'écran complet « Réponses automatiques » de la console professionnelle.
 * Il s'affiche même sans aucun acheteur : c'est AVANT le premier message qu'on
 * prépare sa phrase d'accueil, pas après.
 */
export function ReponsesAuto({ pro = false, onChange }: { pro?: boolean; onChange?: () => void } = {}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <p className="font-display text-[15px] font-extrabold text-ink">
          Répondre sans être devant son téléphone
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-gray-600">
          Un acheteur qui n’a aucune réponse dans l’heure écrit au vendeur suivant.
          {pro
            ? <> Deux outils pour tenir : une <b>phrase d’accueil</b> qui part toute seule au
              premier message, et vos <b>phrases toutes prêtes</b>, à poser d’un appui dans
              la conversation.</>
            : <> Vos <b>phrases toutes prêtes</b> se posent d’un appui dans la conversation :
              vous n’avez plus qu’à envoyer.</>}
        </p>
      </div>
      {/* La phrase d'accueil part au nom de l'enseigne : elle est réservée aux
          comptes professionnels approuvés, comme le refuse déjà le serveur.
          Mieux vaut ne pas montrer un réglage qui répondrait par un refus. */}
      {pro && <ReponseAutomatique onChange={onChange} />}
      <ReponsesPretes onChange={onChange} />
    </div>
  )
}
