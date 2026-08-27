import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, Check, ChevronRight, Clock, Crosshair, KeyRound, Loader2, Lock, LogOut,
  MapPin, Monitor, ShieldCheck, Smartphone,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { useToast } from '../store/ToastContext'
import { fetchMyProfile, updateMyProfile } from '../lib/profiles'
import { fetchVerifyStatus, type VerifyStatus } from '../lib/verify'
import { downscaleImage, downscaleListingImage } from '../lib/image'
import { mediaUrl } from '../lib/native'
import { regions, cities, citiesByRegion, communesAbidjan, locationLabel } from '../data/locations'
import { TYPES_PRO, labelTypePro } from '../data/secteursPro'
import {
  phpProFiche, phpProVitrine, phpReglagesNotifs, phpEnregistrerReglagesNotifs,
  phpSecurite, phpPositionAnnonces, type Horaire, type Securite,
} from '../lib/php'
import { Bascule, CLE_ALERTE_PRIX } from './Bascule'

/**
 * Les six écrans de réglages d'un compte professionnel (planche 3, validée le
 * 27/08). Chacun est une page à part entière : un professionnel ne cherche pas
 * son numéro RCCM au milieu de la case « recevoir la lettre d'information ».
 */

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const HORAIRES_DEFAUT: Horaire[] = [
  { ouvert: true, de: '08:00', a: '18:00' },
  { ouvert: true, de: '08:00', a: '18:00' },
  { ouvert: true, de: '08:00', a: '18:00' },
  { ouvert: true, de: '08:00', a: '18:00' },
  { ouvert: true, de: '08:00', a: '18:00' },
  { ouvert: true, de: '09:00', a: '14:00' },
  { ouvert: false, de: '', a: '' },
]

/**
 * Les heures d'ouverture proposées : de 6 h à 22 h, par demi-heures.
 *
 * On n'utilise PAS `<input type="time">`. Le navigateur y impose SON format —
 * sur un téléphone réglé en anglais, un commerçant d'Abobo lisait « 08:00 AM »
 * — et sa roulette d'horloge dépassait de la carte. Une liste écrite en
 * français tient dans la ligne et se lit partout pareil.
 */
const HEURES: [string, string][] = (() => {
  const out: [string, string][] = []
  for (let m = 6 * 60; m <= 22 * 60; m += 30) {
    const h = Math.floor(m / 60), r = m % 60
    out.push([`${String(h).padStart(2, '0')}:${String(r).padStart(2, '0')}`,
      r === 0 ? `${h} h` : `${h} h ${r}`])
  }
  return out
})()

function ChoixHeure({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  return (
    <select value={valeur} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-cream-100 px-1.5 py-1 text-[12px] font-semibold text-ink outline-none">
      {/* Une heure enregistrée hors de la liste (ancienne saisie) reste offerte. */}
      {!HEURES.some(([v]) => v === valeur) && <option value={valeur}>{valeur}</option>}
      {HEURES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

/** Un champ encadré, étiquette en capitales — le dessin de toute la planche. */
function Champ({ etiquette, aide, accent, children }: {
  etiquette: React.ReactNode; aide?: React.ReactNode; accent?: boolean; children: React.ReactNode
}) {
  return (
    <label className={`block rounded-2xl border p-3 ${accent ? 'border-accent-ocre/35 bg-[#FFFDF6]' : 'border-line bg-white'}`}>
      <span className="block text-[10px] font-extrabold uppercase tracking-[0.07em] text-gray-400">{etiquette}</span>
      {children}
      {aide && <span className="mt-1.5 block text-[11px] leading-relaxed text-gray-500">{aide}</span>}
    </label>
  )
}

const SAISIE = 'mt-1 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-gray-300'

/** Une ligne cliquable de réglage : rond, titre, sous-titre, chevron. */
function Ligne({ emoji, titre, sous, onClick, to }: {
  emoji: React.ReactNode; titre: string; sous?: string; onClick?: () => void; to?: string
}) {
  const dedans = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-[15px]">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-ink">{titre}</span>
        {sous && <span className="mt-0.5 block text-[11.5px] text-gray-500">{sous}</span>}
      </span>
      <ChevronRight size={16} className="shrink-0 text-gray-300" />
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-cream-50'
  return to ? <Link to={to} className={cls}>{dedans}</Link> : <button onClick={onClick} className={cls}>{dedans}</button>
}

/** Un interrupteur de réglage, avec son explication. */
function Interrupteur({ titre, sous, actif, onChange }: {
  titre: string; sous: string; actif: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button onClick={() => onChange(!actif)} className="flex w-full items-center gap-3 py-2.5 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-ink">{titre}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-gray-500">{sous}</span>
      </span>
      <Bascule active={actif} />
    </button>
  )
}

// ───────────────────────────── ⑦ MA FICHE ─────────────────────────────

/**
 * « Modifier ma fiche » — la carte de visite du professionnel.
 *
 * Le RCCM est mis en avant volontairement : un numéro vérifiable est ce qui
 * sépare une enseigne d'un pseudonyme, et c'est lui qui fait écrire l'acheteur
 * qui hésite entre deux vendeurs.
 */
export function FicheProEdit({ pro, lieu, banniere, logo, onEnregistre, onAdresse }: {
  pro: {
    nom: string; type: string; secteur: string; numero?: string; tel?: string
    description?: string; horaires?: Horaire[] | null
  }
  /** « Abidjan · Abobo » — rappel de ce qui est enregistré, sans le modifier ici. */
  lieu?: string
  banniere?: string
  logo?: string
  onEnregistre: () => void
  /** Ouvre l'écran « Adresse & localisation », seul endroit où le lieu se règle. */
  onAdresse: () => void
}) {
  const toast = useToast()
  const [nom, setNom] = useState(pro.nom ?? '')
  const type = pro.type === 'commerce' ? 'boutique' : (pro.type ?? 'boutique')
  const secteur = pro.secteur ?? ''
  const numero = pro.numero ?? ''
  const [tel, setTel] = useState(pro.tel ?? '')
  const [description, setDescription] = useState(pro.description ?? '')
  const [horaires, setHoraires] = useState<Horaire[]>(pro.horaires?.length === 7 ? pro.horaires : HORAIRES_DEFAUT)
  const [enCours, setEnCours] = useState(false)
  const [image, setImage] = useState<'banniere' | 'logo' | null>(null)
  const fichier = useRef<HTMLInputElement>(null)

  const def = useMemo(() => TYPES_PRO.find((t) => t.id === type) ?? TYPES_PRO[0], [type])

  const choisirImage = (quoi: 'banniere' | 'logo') => { setImage(quoi); fichier.current?.click() }
  const envoyerImage = async (f: File) => {
    if (!image) return
    setEnCours(true)
    try {
      const data = image === 'banniere'
        ? await downscaleListingImage(f, 1600, 0.82)
        : await downscaleImage(f, 512, 0.85)
      await phpProVitrine({ [image]: data })
      onEnregistre()
      toast.success(image === 'banniere' ? 'Bannière mise à jour.' : 'Logo mis à jour.')
    } catch (e) { toast.error((e as Error).message) }
    finally { setEnCours(false); setImage(null) }
  }

  const enregistrer = async () => {
    setEnCours(true)
    try {
      await phpProFiche({ nom, tel, description, horaires })
      onEnregistre()
      toast.success('Votre fiche est à jour.')
    } catch (e) { toast.error((e as Error).message) }
    finally { setEnCours(false) }
  }

  return (
    <div className="space-y-3">
      <input ref={fichier} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) envoyerImage(f) }} />

      {/* Bannière et logo — les mêmes qu'au tableau de bord. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="relative h-[86px] bg-gradient-to-br from-ink to-primary-700">
          {banniere && <img src={mediaUrl(banniere)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10" />
          <button onClick={() => choisirImage('banniere')}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/45 px-2.5 py-1.5 text-[10.5px] font-bold text-white backdrop-blur">
            <Camera size={12} /> Bannière
          </button>
          <button onClick={() => choisirImage('logo')}
            className="absolute -bottom-6 left-3 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-[3px] border-white bg-primary-500 text-lg font-black text-white">
            {logo ? <img src={mediaUrl(logo)} alt="" className="h-full w-full object-cover" />
              : (nom.trim().charAt(0) || '?').toUpperCase()}
          </button>
        </div>
        <p className="px-3.5 pb-3.5 pt-8 text-[11.5px] leading-relaxed text-gray-500">
          Bannière et logo se changent ici aussi — ce sont les mêmes que sur votre tableau de bord
          et sur votre page vendeur.
        </p>
      </div>

      <Champ etiquette="Nom commercial">
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80}
          placeholder="Ex : Zika Fête" className={SAISIE} />
      </Champ>

      {/* CE QUE L'ÉQUIPE A VÉRIFIÉ — en lecture seule.
          Type, secteur et numéro sont les trois éléments contrôlés avant
          l'approbation du dossier : le numéro se vérifie au registre, et c'est
          lui qui porte « entreprise enregistrée » sur la page vendeur. Les
          laisser modifiables, ce serait laisser une boutique approuvée se
          déclarer association le lendemain, badge compris. */}
      <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.07em] text-gray-400">
          <Lock size={11} /> Vérifié par l’équipe
        </p>
        <dl className="mt-2 grid gap-2.5 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-extrabold uppercase tracking-[0.07em] text-gray-400">Type</dt>
            <dd className="mt-0.5 text-[14px] font-semibold text-gray-700">{labelTypePro(type)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-extrabold uppercase tracking-[0.07em] text-gray-400">Secteur</dt>
            <dd className="mt-0.5 text-[14px] font-semibold text-gray-700">{secteur || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-[0.07em] text-gray-400">{def.numero}</dt>
            <dd className="mt-0.5 text-[14px] font-semibold text-gray-700">
              {numero || <span className="font-normal text-gray-400">non renseigné</span>}
            </dd>
          </div>
        </dl>
        <p className="mt-2.5 rounded-xl bg-cream-100 px-3 py-2 text-[11.5px] leading-relaxed text-gray-600">
          Ces trois-là ont été contrôlés avant l’approbation de votre dossier : ils ne se
          changent pas depuis ici. Une erreur ou un changement réel (nouveau RCCM,
          changement d’activité) ?{' '}
          <Link to="/assistance" className="font-bold text-primary-700">Écrivez à l’équipe</Link>,
          elle le corrige.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Champ etiquette="Téléphone professionnel">
          <input value={tel} onChange={(e) => setTel(e.target.value)} maxLength={20}
            inputMode="tel" placeholder="07 00 00 00 00" className={SAISIE} />
        </Champ>
        {/* Le lieu se règle à UN SEUL endroit — « Adresse & localisation », qui
            détecte la position et enchaîne région → ville → commune. Deux
            formulaires pour la même donnée, c'est deux valeurs différentes. */}
        <Champ etiquette="Où l’on vous trouve"
          aide={<>Se règle dans <button onClick={onAdresse} className="font-bold text-primary-700">Adresse &amp; localisation</button>.</>}>
          <span className="mt-1 block text-[14px] font-semibold text-gray-700">
            {lieu || <span className="font-normal text-gray-400">non renseigné</span>}
          </span>
        </Champ>
      </div>

      <Champ etiquette={<>Ce que vous faites <span className="text-gray-300">— 2 lignes</span></>}
        aide={`${description.length} / 300 caractères · cette phrase s’affiche en haut de votre page vendeur`}>
        <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))}
          rows={3} placeholder="Décoration, location de matériel et sonorisation pour mariages et anniversaires à Abidjan."
          className={`${SAISIE} resize-none leading-relaxed`} />
      </Champ>

      {/* HORAIRES — l'acheteur sait quand vous écrire. */}
      <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5">
        <p className="flex items-center gap-1.5 font-display text-[13.5px] font-extrabold text-ink">
          <Clock size={15} className="text-primary-600" /> Vos horaires
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">
          Affichés sur votre page vendeur — l’acheteur sait quand vous écrire.
        </p>
        <div className="mt-2.5 space-y-1.5">
          {horaires.map((h, i) => {
            const poser = (champ: 'de' | 'a', v: string) =>
              setHoraires((p) => p.map((x, j) => (j === i ? { ...x, [champ]: v } : x)))
            const basculer = () =>
              setHoraires((p) => p.map((x, j) => (j === i ? { ...x, ouvert: !x.ouvert } : x)))
            return (
              <div key={JOURS[i]} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-line">
                <button onClick={basculer}
                  className={`min-w-0 flex-1 truncate text-left text-[12.5px] font-bold ${h.ouvert ? 'text-ink' : 'text-gray-400'}`}>
                  {JOURS[i]}
                </button>
                {h.ouvert ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <ChoixHeure valeur={h.de || '08:00'} onChange={(v) => poser('de', v)} />
                    <span className="text-gray-400">–</span>
                    <ChoixHeure valeur={h.a || '18:00'} onChange={(v) => poser('a', v)} />
                  </span>
                ) : (
                  <span className="shrink-0 text-[12px] text-gray-400">fermé</span>
                )}
                <button onClick={basculer} className="shrink-0"><Bascule active={h.ouvert} /></button>
              </div>
            )
          })}
        </div>
      </div>

      <button onClick={enregistrer} disabled={enCours || nom.trim().length < 2}
        className="btn-primary w-full py-3 disabled:opacity-50">
        {enCours ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Enregistrer ma fiche
      </button>
    </div>
  )
}

// ──────────────────────────── ⑧ PROFIL & PHOTO ────────────────────────────

/**
 * « Profil & photo » — la personne derrière l'enseigne.
 *
 * Le professionnel a deux identités et cela l'inquiète : le bloc du bas le dit
 * une bonne fois pour toutes — les acheteurs voient l'enseigne, jamais le nom.
 */
export function ProfilPhoto({ nomEnseigne, onChange }: { nomEnseigne?: string; onChange?: () => void }) {
  const { user } = useAuth()
  const toast = useToast()
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [avatar, setAvatar] = useState('')
  const [statut, setStatut] = useState<VerifyStatus | null>(null)
  const [enCours, setEnCours] = useState(false)
  const fichier = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    let actif = true
    fetchMyProfile().then((p) => {
      if (!actif) return
      setNom(p.fullName); setTel(p.phone); setAvatar(p.avatarUrl)
    }).catch(() => {})
    fetchVerifyStatus().then((s) => actif && setStatut(s)).catch(() => {})
    return () => { actif = false }
  }, [user])

  const changerPhoto = async (f: File) => {
    if (!user) return
    setEnCours(true)
    try {
      const data = await downscaleImage(f, 256)
      await updateMyProfile(user.id, { avatar_url: data })
      setAvatar(data); onChange?.()
      toast.success('Photo mise à jour.')
    } catch (e) { toast.error((e as Error).message) }
    finally { setEnCours(false) }
  }

  const enregistrer = async () => {
    if (!user) return
    setEnCours(true)
    try {
      await updateMyProfile(user.id, { full_name: nom.trim(), phone: tel.trim() })
      onChange?.()
      toast.success('Profil enregistré.')
    } catch (e) { toast.error((e as Error).message) }
    finally { setEnCours(false) }
  }

  return (
    <div className="space-y-3">
      <input ref={fichier} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) changerPhoto(f) }} />

      <div className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
        <span className="mx-auto grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-display text-[28px] font-black text-white">
          {avatar ? <img src={mediaUrl(avatar)} alt="" className="h-full w-full object-cover" />
            : (nom.trim().charAt(0) || user?.email?.charAt(0) || '?').toUpperCase()}
        </span>
        <button onClick={() => fichier.current?.click()} disabled={enCours}
          className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-primary-700 disabled:opacity-50">
          <Camera size={13} /> Changer ma photo
        </button>
      </div>

      <Champ etiquette="Nom complet">
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} className={SAISIE} />
      </Champ>

      <Champ etiquette="Adresse e-mail">
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[14px] text-gray-600">{user?.email}</span>
          {statut?.emailVerified ? (
            <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">✓ confirmée</span>
          ) : (
            <Link to="/compte" className="shrink-0 rounded-md bg-cream-100 px-2 py-1 text-[10px] font-extrabold text-primary-700">
              à confirmer
            </Link>
          )}
        </span>
      </Champ>

      <Champ etiquette="Téléphone">
        <input value={tel} onChange={(e) => setTel(e.target.value)} maxLength={20}
          inputMode="tel" placeholder="07 00 00 00 00" className={SAISIE} />
      </Champ>

      <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5 text-[12px] leading-relaxed text-gray-600">
        <b className="text-ink">Deux identités, une seule personne.</b> Les acheteurs voient
        {' '}<b>{nomEnseigne || 'votre enseigne'}</b> ; votre nom reste privé.
      </div>

      <button onClick={enregistrer} disabled={enCours} className="btn-primary w-full py-3 disabled:opacity-50">
        {enCours ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Enregistrer
      </button>
    </div>
  )
}

// ──────────────────────────── ⑨ NOTIFICATIONS ────────────────────────────

/** Les cases, dans l'ordre de la planche. Les clés partent au serveur telles quelles. */
const CASES_COMPTE: [string, string, string][] = [
  ['message', 'Nouveau message', 'Un acheteur vous écrit'],
  ['favorite', 'Nouveau favori', 'Une annonce est enregistrée'],
  ['vente', 'Vente conclue', 'Une commande est finalisée'],
  ['avis', 'Nouvel avis', 'Un acheteur vous note'],
  ['email', 'Recevoir aussi par e-mail', 'Quand vous n’êtes ni sur le site ni joignable sur le téléphone'],
]
const CASES_PRO: [string, string, string][] = [
  ['sans_reponse', 'Message sans réponse', 'Au bout de 24 h — protège votre taux de réponse'],
  ['essouffle', 'Annonce qui s’essouffle', 'Plus de vues depuis 10 jours'],
  ['bilan', 'Bilan de la semaine', 'Chaque lundi matin, vos chiffres'],
]

/**
 * « Notifications » — ce qui vous dérange, et ce qui ne doit pas.
 *
 * Les rappels du professionnel sont la moitié utile : « message sans réponse
 * depuis 24 h » sauve une vente, « bilan du lundi » fait revenir.
 */
export function ReglagesNotifs({ pro }: { pro: boolean }) {
  const toast = useToast()
  const [r, setR] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    let actif = true
    phpReglagesNotifs().then((v) => actif && setR(v)).catch(() => actif && setR({}))
    return () => { actif = false }
  }, [])

  // Tout est allumé par défaut : on n'a jamais dit non tant qu'on n'a pas dit non.
  const on = (k: string) => r?.[k] !== false
  const basculer = async (k: string, v: boolean) => {
    const suivant = { ...(r ?? {}), [k]: v }
    setR(suivant)
    try { await phpEnregistrerReglagesNotifs(suivant) }
    catch { setR(r); toast.error('Réglage non enregistré. Réessayez.') }
  }

  if (!r) return <div className="grid min-h-[30vh] place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>

  return (
    <div className="space-y-3">
      <div className="divide-y divide-line rounded-2xl border border-line bg-white px-3.5 shadow-card">
        {CASES_COMPTE.map(([k, t, s]) => (
          <Interrupteur key={k} titre={t} sous={s} actif={on(k)} onChange={(v) => basculer(k, v)} />
        ))}
        <Interrupteur titre="Alerte prix baissé" sous="Un favori passe sous le prix où vous l’avez enregistré"
          actif={on(CLE_ALERTE_PRIX)} onChange={(v) => basculer(CLE_ALERTE_PRIX, v)} />
      </div>

      {pro && (
        <div className="divide-y divide-accent-ocre/25 rounded-2xl border border-accent-ocre/30 bg-cream-100 px-3.5">
          <p className="pt-3 font-display text-[13.5px] font-extrabold text-ink">💼 Rappels du professionnel</p>
          {CASES_PRO.map(([k, t, s]) => (
            <Interrupteur key={k} titre={t} sous={s} actif={on(k)} onChange={(v) => basculer(k, v)} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white px-3.5 shadow-card">
        <Interrupteur titre="🌙 Heures calmes" sous="Rien entre 22 h et 6 h"
          actif={on('calme')} onChange={(v) => basculer('calme', v)} />
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed text-gray-400">
        Ces réglages valent pour les notifications du site et de l’application. Pour activer les
        notifications sur cet appareil, ouvrez <Link to="/notifications" className="font-bold text-primary-700">la cloche</Link>.
      </p>
    </div>
  )
}

// ──────────────────────────────── ⑩ SÉCURITÉ ────────────────────────────────

/** « Changé il y a 2 mois » — la mesure qui compte pour un mot de passe. */
function ilYa(ms: number | null): string {
  if (!ms) return 'jamais changé'
  const j = Math.floor((Date.now() - ms) / 86400000)
  if (j < 1) return 'changé aujourd’hui'
  if (j < 31) return `changé il y a ${j} jour${j > 1 ? 's' : ''}`
  const m = Math.round(j / 30)
  if (m < 12) return `changé il y a ${m} mois`
  return `changé il y a ${Math.round(m / 12)} an${m >= 24 ? 's' : ''}`
}

function quandCourt(ms: number): string {
  return new Date(ms).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * « Sécurité » — protéger un compte qui gagne de l'argent.
 *
 * Les appareils et les dernières connexions sont là pour une seule question :
 * « est-ce que quelqu'un d'autre est entré ? ». Tout le reste est décor.
 */
export function SecuriteCompte({ onMotDePasse, onDoubleAuth }: {
  onMotDePasse: () => void; onDoubleAuth: () => void
}) {
  const [s, setS] = useState<Securite | null>(null)

  useEffect(() => {
    let actif = true
    phpSecurite().then((v) => actif && setS(v)).catch(() => actif && setS(null))
    return () => { actif = false }
  }, [])

  return (
    <div className="space-y-3">
      <button onClick={onDoubleAuth}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left ${
          s?.twofa ? 'border-emerald-200 bg-emerald-50/60' : 'border-accent-ocre/35 bg-cream-100'}`}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          s?.twofa ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-primary-700'}`}>
          <ShieldCheck size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-extrabold text-ink">
            {s?.twofa ? 'Double authentification active' : 'Activer la double authentification'}
          </span>
          <span className="mt-0.5 block text-[11.5px] text-gray-600">
            {s?.twofa ? 'Un code est demandé à chaque connexion'
              : 'Un code en plus du mot de passe — c’est ce qui arrête un vol de compte'}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-gray-400" />
      </button>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <Ligne emoji={<KeyRound size={16} className="text-gray-600" />} titre="Mot de passe"
          sous={ilYa(s?.motDePasseLe ?? null)} onClick={onMotDePasse} />
      </div>

      {/* MES APPAREILS — ceux qui reçoivent les notifications du compte. */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <p className="px-3.5 pt-3 font-display text-[13.5px] font-extrabold text-ink">Mes appareils</p>
        {!s ? (
          <p className="px-3.5 pb-3.5 pt-1 text-[11.5px] text-gray-400">Chargement…</p>
        ) : s.appareils.length === 0 ? (
          <p className="px-3.5 pb-3.5 pt-1 text-[11.5px] leading-relaxed text-gray-500">
            Aucun appareil abonné aux notifications. Activez-les depuis la cloche pour être
            prévenu quand un acheteur écrit.
          </p>
        ) : (
          <div className="divide-y divide-line px-3.5">
            {s.appareils.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-gray-600">
                  {a.nom.includes('iPhone') || a.nom.includes('Android') ? <Smartphone size={16} /> : <Monitor size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-ink">{a.nom}</span>
                  <span className="mt-0.5 block text-[11.5px] text-gray-500">
                    connecté depuis le {new Date(a.depuis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DERNIÈRES CONNEXIONS — pour reconnaître ce qui n'est pas soi. */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <p className="px-3.5 pt-3 font-display text-[13.5px] font-extrabold text-ink">Dernières connexions</p>
        {!s || s.connexions.length === 0 ? (
          <p className="px-3.5 pb-3.5 pt-1 text-[11.5px] text-gray-500">
            Aucune connexion enregistrée pour l’instant.
          </p>
        ) : (
          <div className="divide-y divide-line px-3.5">
            {s.connexions.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-ink">{quandCourt(c.quand)}</span>
                  <span className="mt-0.5 block text-[11.5px] text-gray-500">{c.appareil}</span>
                </span>
                <span className="tnum shrink-0 text-[11px] text-gray-400">{c.ip}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5 text-[12px] leading-relaxed text-gray-600">
        <b className="text-ink">Pourquoi c’est plus sérieux pour un pro :</b> votre compte porte
        votre enseigne, vos avis et vos ventes. Perdre l’accès, c’est perdre la réputation
        construite.
      </div>
    </div>
  )
}

// ───────────────────────── ⑪ ADRESSE & LOCALISATION ─────────────────────────

/**
 * « Adresse & localisation » — où l'on vous trouve.
 *
 * La commune fait remonter les annonces dans « Près de moi ». Le point exact
 * n'est jamais publié : il sert à calculer une distance, pas à donner une porte.
 */
export function AdressePosition({ onChange }: { onChange?: () => void }) {
  const { user } = useAuth()
  const { place, status, allowGps } = useGeo()
  const toast = useToast()
  const [regionId, setRegionId] = useState('')
  const [cityId, setCityId] = useState('')
  const [commune, setCommune] = useState('')
  const [adresse, setAdresse] = useState('')
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null)
  const [montrer, setMontrer] = useState(true)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    if (!user) return
    let actif = true
    fetchMyProfile().then((p) => {
      if (!actif) return
      setRegionId(p.regionId); setCityId(p.cityId)
      setCommune(p.commune); setAdresse(p.address)
      if (p.lat != null && p.lng != null) setCoord({ lat: p.lat, lng: p.lng })
    }).catch(() => {})
    phpReglagesNotifs().then((r) => actif && setMontrer(r.position !== false)).catch(() => {})
    return () => { actif = false }
  }, [user])

  // TOUTES les villes de Côte d'Ivoire : la liste n'est bornée par la région
  // que si l'on en a choisi une. Un vendeur de Korhogo doit se trouver sans
  // savoir dans quel district administratif tombe sa ville.
  const villes = useMemo(
    () => (regionId ? citiesByRegion(regionId) : cities),
    [regionId],
  )
  const villeChoisie = useMemo(() => cities.find((v) => v.id === cityId), [cityId])
  // Les communes n'existent que pour les villes qui en ont — Abidjan, et les
  // grandes villes que `locations.ts` détaille.
  const communes = useMemo(
    () => villeChoisie?.communes ?? (cityId === '' && regionId === 'abidjan' ? communesAbidjan : []),
    [villeChoisie, cityId, regionId],
  )

  /**
   * « Détecter ma position » — le GPS d'abord, l'adresse IP en repli, puis la
   * région, la ville et la commune remplies toutes seules. C'est le geste qui
   * évite trois listes déroulantes à quelqu'un qui tient son téléphone.
   */
  const detecter = async () => {
    setEnCours(true)
    try {
      await allowGps()
    } finally { setEnCours(false) }
  }

  // Ce que la détection a trouvé se reporte dans le formulaire — mais on
  // n'écrase JAMAIS un choix déjà fait à la main.
  useEffect(() => {
    if (!place) return
    setRegionId((v) => v || place.regionId || '')
    setCityId((v) => v || place.cityId || '')
    setCommune((v) => v || place.commune || '')
    setAdresse((v) => v || place.address || '')
    if (place.lat != null && place.lng != null) setCoord({ lat: place.lat, lng: place.lng })
  }, [place])

  const basculerPosition = async (v: boolean) => {
    setMontrer(v)
    try {
      await phpEnregistrerReglagesNotifs({ position: v })
      // L'interrupteur agit sur les annonces DÉJÀ publiées : sinon « sur mes
      // annonces » ne voudrait rien dire.
      const r = await phpPositionAnnonces(v)
      if (!v) toast.success(`Position retirée de ${r.annonces} annonce${r.annonces > 1 ? 's' : ''}.`)
      else if (r.sansPosition) toast.error('Enregistrez d’abord votre commune ci-dessous.')
      else toast.success(`Position remise sur ${r.annonces} annonce${r.annonces > 1 ? 's' : ''}.`)
    } catch { setMontrer(!v) }
  }

  const enregistrer = async () => {
    if (!user) return
    setEnCours(true)
    try {
      await updateMyProfile(user.id, {
        region_id: regionId, city_id: cityId, commune, address: adresse.trim(),
        lat: coord?.lat ?? null, lng: coord?.lng ?? null,
      })
      onChange?.()
      toast.success('Adresse enregistrée.')
    } catch (e) { toast.error((e as Error).message) }
    finally { setEnCours(false) }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="relative grid h-[110px] place-items-center bg-gradient-to-br from-[#E8EEFB] to-[#DCE6F7]">
          <MapPin size={26} className="text-primary-600" />
          <p className="absolute bottom-2 left-0 right-0 px-4 text-center text-[11px] font-semibold text-gray-600">
            {coord
              ? `${locationLabel(regionId, cityId, commune) || 'Position enregistrée'}`
              : 'Position non enregistrée'}
          </p>
        </div>
        <div className="p-3.5">
          <button onClick={detecter} disabled={enCours || status === 'loading'}
            className="btn-primary w-full py-2.5 text-[13.5px] disabled:opacity-50">
            {status === 'loading' || enCours
              ? <Loader2 size={16} className="animate-spin" />
              : <Crosshair size={16} />} Détecter ma position
          </button>
          <p className="mt-2 text-[11.5px] leading-relaxed text-gray-500">
            Votre téléphone donne la position, et la région, la ville et la commune se
            remplissent toutes seules. Vous pouvez ensuite corriger à la main.
            {status === 'denied' || status === 'unavailable'
              ? ' Le GPS n’a rien donné : choisissez votre ville ci-dessous.' : ''}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
            Le point exact n’est jamais publié : les acheteurs voient la commune, pas votre porte.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Champ etiquette={<>Région <span className="text-gray-300">— facultatif</span></>}>
          <select value={regionId}
            onChange={(e) => {
              const r = e.target.value
              setRegionId(r)
              // On ne garde la ville que si elle appartient encore à la région.
              if (r && villeChoisie && villeChoisie.regionId !== r) { setCityId(''); setCommune('') }
            }}
            className={`${SAISIE} font-semibold`}>
            <option value="">Toute la Côte d’Ivoire</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Champ>
        <Champ etiquette="Ville">
          <select value={cityId}
            onChange={(e) => {
              const v = e.target.value
              setCityId(v); setCommune('')
              // Choisir une ville pose sa région : une liste de moins à remplir.
              const trouvee = cities.find((c) => c.id === v)
              if (trouvee) setRegionId(trouvee.regionId)
            }}
            className={`${SAISIE} font-semibold`}>
            <option value="">— à choisir —</option>
            {villes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Champ>
      </div>

      {/* La commune n'apparaît que pour les villes qui en ont — Abidjan et les
          grandes villes. Elle reste visible si le compte en porte déjà une :
          sinon on ne verrait nulle part ce qui est enregistré. */}
      {(communes.length > 0 || commune !== '') && (
        <Champ etiquette="Commune">
          <select value={commune} onChange={(e) => setCommune(e.target.value)} className={`${SAISIE} font-semibold`}>
            <option value="">— à choisir —</option>
            {commune !== '' && !communes.includes(commune) && <option value={commune}>{commune}</option>}
            {communes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Champ>
      )}

      <Champ etiquette="Quartier / repère"
        aide="Vos annonces remontent dans « Près de moi » pour les acheteurs de votre commune.">
        <input value={adresse} onChange={(e) => setAdresse(e.target.value)} maxLength={120}
          placeholder="Ex : derrière la pharmacie Sainte-Rita" className={SAISIE} />
      </Champ>

      <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 px-3.5">
        <Interrupteur titre="Montrer ma position sur mes annonces"
          sous="Le point exact reste flouté à 500 m · s’applique aussi à vos annonces déjà publiées"
          actif={montrer} onChange={basculerPosition} />
      </div>

      <button onClick={enregistrer} disabled={enCours} className="btn-primary w-full py-3 disabled:opacity-50">
        {enCours ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Enregistrer
      </button>
    </div>
  )
}

// ───────────────────────────── ⑭ SE DÉCONNECTER ─────────────────────────────

/**
 * Une question, pas un piège. On dit ce qui NE s'arrête pas — les annonces
 * restent, les acheteurs écrivent toujours — parce que c'est la peur qui fait
 * hésiter, et elle est infondée.
 */
export function DialogueDeconnexion({ onRester, onSortir }: { onRester: () => void; onSortir: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 px-6" onClick={onRester}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 text-center shadow-xl">
        <div className="text-[26px]">👋</div>
        <p className="mt-1.5 font-display text-[17px] font-extrabold text-ink">Se déconnecter ?</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
          Vos annonces restent en ligne et vos acheteurs peuvent toujours vous écrire. Vous devrez
          ressaisir votre mot de passe pour revenir.
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={onRester}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-[13px] font-extrabold text-gray-700">
            Rester
          </button>
          <button onClick={onSortir}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C43025] px-4 py-2.5 text-[13px] font-extrabold text-white">
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

export { labelTypePro }
