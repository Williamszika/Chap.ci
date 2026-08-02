// =============================================================================
//  COMPTABILITÉ — un seul écran, deux registres, un résultat.
//
//  Il remplace l'onglet « Recettes », qui ne montrait qu'une moitié des
//  comptes. Ce que la loi ivoirienne demande à un entreprenant, ce sont DEUX
//  registres chronologiques — les recettes ET les dépenses — conservés trois
//  ans et présentables à toute réquisition du service des Impôts. Un écran qui
//  n'affiche que les entrées ne permet pas de répondre à un contrôle.
//
//  Trois principes tiennent cet écran :
//
//  1. RIEN À RESSAISIR. Les publicités encaissées entrent toutes seules dans le
//     registre, avec leur date, leur montant et le numéro du payeur. On ne
//     saisit à la main que ce que le site ne peut pas connaître : les dépenses,
//     et les dons reçus directement sur le compte Mobile Money.
//
//  2. CE QUI EST ÉCRIT NE BOUGE PLUS. Une ligne venue d'une vraie opération ne
//     se supprime pas. Un exercice clos ne reçoit plus rien. Une comptabilité
//     qu'on peut réécrire après coup ne vaut rien devant l'administration.
//
//  3. TOUT SORT. Deux fichiers pour le comptable, un document imprimable pour
//     les Impôts. Un chiffre qui ne peut pas quitter l'écran ne sert à rien le
//     jour où on le demande.
// =============================================================================
import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, Plus, Download, FileText, Lock, RefreshCw, Trash2, Check,
  TrendingUp, TrendingDown, Scale, Info, AlertTriangle,
} from 'lucide-react'
import * as php from '../lib/php'
import { formatPrice } from '../lib/format'

const F = (x: number) => `${formatPrice(x)} F`
const jourCourt = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
const moisCourt = (m: string) => {
  const d = new Date(`${m}-01T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString('fr-FR', { month: 'short' })
}

/** Le nom lisible d'un moyen de paiement. */
const MODES: Record<string, string> = {
  orange: 'Orange Money', mtn: 'MTN MoMo', moov: 'Moov Money', wave: 'Wave',
  especes: 'Espèces', virement: 'Virement', carte: 'Carte', autre: 'Autre',
}

interface Ligne {
  id: string
  numero: number
  date: string
  libelle: string
  montant: number
  categorie: string
  mode: string
  reference: string
  tiers: string
  piece: string
  note: string
  source: string
  /** Retrouvé sur le relevé de l'opérateur. */
  pointe: boolean
}
interface Cat { code: string; nom: string; compte: string }
interface Compta {
  exercice: number
  exercices: number[]
  clos: boolean
  reprises: number
  recettes: Ligne[]
  depenses: Ligne[]
  totaux: { recettes: number; depenses: number; resultat: number; nbRecettes: number; nbDepenses: number; aPointer: number }
  parMois: { mois: string; recettes: number; depenses: number; resultat: number }[]
  parCategorie: { recettes: (Cat & { total: number })[]; depenses: (Cat & { total: number })[] }
  regime: { code: string; nom: string; seuil: number | null; obligation: string }
  /** L'identité imprimée en tête des registres. Vide tant que le Patron ne l'a pas renseignée. */
  entite?: { nom: string; rccm: string; ncc: string }
  categories: { recettes: Cat[]; depenses: Cat[] }
  modes: string[]
}

export function ComptabiliteTab() {
  const [exercice, setExercice] = useState(() => new Date().getUTCFullYear())
  const [d, setD] = useState<Compta | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [ouvrirSaisie, setOuvrirSaisie] = useState(false)
  const [occupe, setOccupe] = useState('')

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')
    try {
      setD(await php.phpComptabilite<Compta>(exercice))
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setChargement(false)
    }
  }, [exercice])

  useEffect(() => { charger() }, [charger])

  async function telecharger(quoi: 'recettes' | 'depenses' | 'smt') {
    setOccupe(quoi)
    try { await php.phpComptaExport(exercice, quoi) }
    catch (e) { setErreur((e as Error).message) }
    finally { setOccupe('') }
  }

  async function pointer(l: Ligne) {
    // Optimiste : la case répond tout de suite, le serveur suit. Sur un réseau
    // ivoirien, attendre l'aller-retour pour cocher une case donne
    // l'impression que rien ne marche.
    setD((v) => v && {
      ...v,
      recettes: v.recettes.map((x) => (x.id === l.id ? { ...x, pointe: !l.pointe } : x)),
      depenses: v.depenses.map((x) => (x.id === l.id ? { ...x, pointe: !l.pointe } : x)),
      totaux: { ...v.totaux, aPointer: v.totaux.aPointer + (l.pointe ? 1 : -1) },
    })
    try { await php.phpComptaPointer(l.id, !l.pointe) }
    catch (e) { setErreur((e as Error).message); await charger() }
  }

  async function supprimer(l: Ligne) {
    if (!window.confirm(`Supprimer définitivement « ${l.libelle} » (${F(l.montant)}) ?`)) return
    try { await php.phpComptaSupprimer(l.id); await charger() }
    catch (e) { setErreur((e as Error).message) }
  }

  async function cloturer() {
    if (!window.confirm(
      `Clôturer l’exercice ${exercice} ?\n\n` +
      `Plus aucune écriture ne pourra y être ajoutée ni modifiée. ` +
      `C’est ce qui donne sa valeur au registre — et c’est irréversible.`,
    )) return
    setOccupe('cloture')
    try { await php.phpComptaCloturer(exercice); await charger() }
    catch (e) { setErreur((e as Error).message) }
    finally { setOccupe('') }
  }

  if (chargement && !d) {
    return <div className="py-24 text-center text-sm text-gray-500"><Loader2 className="mx-auto animate-spin" size={22} /></div>
  }
  if (!d) {
    return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur || 'Comptabilité indisponible.'}</p>
  }

  const maxMois = Math.max(1, ...d.parMois.map((m) => Math.max(m.recettes, m.depenses)))
  const positif = d.totaux.resultat >= 0

  return (
    <div className="space-y-5">
      {erreur && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />{erreur}
        </p>
      )}

      {/* Exercice + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-gray-700">Exercice</label>
        <select
          value={exercice}
          onChange={(e) => setExercice(Number(e.target.value))}
          className="rounded-xl border border-line2 bg-white px-3 py-1.5 text-sm font-semibold"
        >
          {d.exercices.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {d.clos ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-semibold text-gray-600">
            <Lock size={12} /> Exercice clos
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ivoire-green/10 px-2.5 py-1 text-[12px] font-semibold text-ivoire-green-dark">
            En cours
          </span>
        )}
        <button onClick={charger} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 md:hover:bg-cream-100">
          <RefreshCw size={14} className={chargement ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Les trois chiffres qui comptent */}
      <div className="grid grid-cols-3 gap-2.5">
        <Carte icone={<TrendingUp size={15} />} label="Recettes" valeur={F(d.totaux.recettes)} sous={`${d.totaux.nbRecettes} écriture${d.totaux.nbRecettes > 1 ? 's' : ''}`} ton="vert" />
        <Carte icone={<TrendingDown size={15} />} label="Dépenses" valeur={F(d.totaux.depenses)} sous={`${d.totaux.nbDepenses} écriture${d.totaux.nbDepenses > 1 ? 's' : ''}`} ton="ocre" />
        <Carte icone={<Scale size={15} />} label="Résultat" valeur={F(d.totaux.resultat)} sous={positif ? 'bénéfice' : 'perte'} ton={positif ? 'vert' : 'rouge'} />
      </div>

      {/* Le régime fiscal, calculé sur le chiffre d'affaires réel */}
      <div className="flex gap-2.5 rounded-2xl border border-line bg-cream-100/60 p-4">
        <Info size={17} className="mt-px shrink-0 text-gray-500" />
        <div className="min-w-0 text-[13px] leading-relaxed text-gray-700">
          <p><b className="text-ink">{d.regime.nom}</b></p>
          <p className="mt-0.5">{d.regime.obligation}</p>
          {d.regime.seuil !== null && (
            <p className="mt-1.5 text-[12px] text-gray-500">
              Chiffre d’affaires {d.exercice} : <b className="tnum text-gray-700">{F(d.totaux.recettes)}</b> — le régime change au-delà de{' '}
              <span className="tnum">{F(d.regime.seuil)}</span>.
            </p>
          )}
          <p className="mt-1.5 text-[12px] text-gray-500">
            Ce calcul informe ; il ne remplace pas un comptable et n’a pas valeur de déclaration.
          </p>
        </div>
      </div>

      {/* Ce qui part aux impôts */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <p className="font-display text-sm font-extrabold text-ink">À remettre aux Impôts</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-gray-600">
          Les deux registres chronologiques exigés par le Code général des impôts, et l’état financier
          de fin d’exercice au Système Minimal de Trésorerie. À conserver trois ans.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <BoutonExport onClick={() => telecharger('recettes')} occupe={occupe === 'recettes'} icone={<Download size={15} />}>
            Registre des recettes (CSV)
          </BoutonExport>
          <BoutonExport onClick={() => telecharger('depenses')} occupe={occupe === 'depenses'} icone={<Download size={15} />}>
            Registre des dépenses (CSV)
          </BoutonExport>
          <BoutonExport onClick={() => telecharger('smt')} occupe={occupe === 'smt'} icone={<FileText size={15} />} principal>
            État financier — à imprimer
          </BoutonExport>
        </div>

        {/* L'identité fiscale manquante.
            Les trois documents partent avec le nom, le RCCM et le NCC en en-tête.
            Le RCCM et le NCC vivent dans `api/config.php`, que le zip de mise à
            jour n'écrase jamais — ils n'arrivent donc pas tout seuls. Un registre
            sans eux se fait refuser au guichet, et ce n'est pas au guichet qu'il
            faut l'apprendre. */}
        {d.entite && (!d.entite.rccm || !d.entite.ncc) && (
          <div className="mt-3 rounded-xl border border-accent-ocre/40 bg-accent-ocre/8 p-3">
            <p className="text-[12.5px] font-bold text-accent-ocre-dark">
              {!d.entite.rccm && !d.entite.ncc
                ? 'Vos documents partent sans numéro RCCM ni compte contribuable.'
                : !d.entite.rccm
                  ? 'Vos documents partent sans numéro RCCM.'
                  : 'Vos documents partent sans compte contribuable (NCC).'}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-gray-700">
              Les registres et l’état financier s’impriment quand même, mais l’administration
              attend ces numéros en en-tête. Ajoutez-les une fois dans{' '}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-gray-800">api/config.php</code>,
              bloc <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-gray-800">entite</code> —
              ce fichier n’est jamais écrasé par une mise à jour, la saisie tient donc pour de bon.
            </p>
          </div>
        )}
      </div>

      {/* Mois par mois */}
      {d.parMois.some((m) => m.recettes || m.depenses) && (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="font-display text-sm font-extrabold text-ink">Mois par mois</p>
          <div className="mt-3 flex items-end gap-1.5">
            {d.parMois.map((m) => (
              <div key={m.mois} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-ivoire-green/70"
                    style={{ height: `${Math.round((m.recettes / maxMois) * 100)}%` }}
                    title={`Recettes : ${F(m.recettes)}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-accent-ocre/60"
                    style={{ height: `${Math.round((m.depenses / maxMois) * 100)}%` }}
                    title={`Dépenses : ${F(m.depenses)}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-gray-500">{moisCourt(m.mois)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-3 text-[11.5px] text-gray-500">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-ivoire-green/70" /> recettes</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-accent-ocre/60" /> dépenses</span>
          </p>
        </div>
      )}

      {/* Saisie */}
      {!d.clos && (
        <>
          <button
            onClick={() => setOuvrirSaisie((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition active:scale-[0.98] md:hover:brightness-105"
          >
            <Plus size={16} /> Inscrire une opération
          </button>
          {ouvrirSaisie && (
            <Saisie
              categories={d.categories}
              modes={d.modes}
              onFait={async () => { setOuvrirSaisie(false); await charger() }}
              onErreur={setErreur}
            />
          )}
        </>
      )}

      {/* Les deux registres */}
      <Registre
        titre="Registre des recettes"
        sous="Ventes d’espace publicitaire, mises en avant, dons. Les publicités encaissées y entrent seules."
        lignes={d.recettes}
        cats={d.categories.recettes}
        ventil={d.parCategorie.recettes}
        total={d.totaux.recettes}
        clos={d.clos}
        onSupprimer={supprimer}
        onPointer={pointer}
      />
      <Registre
        titre="Registre des achats et dépenses"
        sous="Hébergement, nom de domaine, boutique d’applications, honoraires… Tout ce qui sort, avec sa pièce justificative."
        lignes={d.depenses}
        cats={d.categories.depenses}
        ventil={d.parCategorie.depenses}
        total={d.totaux.depenses}
        clos={d.clos}
        onSupprimer={supprimer}
        onPointer={pointer}
      />

      {/* Clôture */}
      {!d.clos && exercice < new Date().getUTCFullYear() && (
        <div className="rounded-2xl border border-accent-ocre/30 bg-accent-ocre/8 p-4">
          <p className="text-[13px] font-semibold text-accent-ocre-dark">Clôturer l’exercice {exercice}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-gray-700">
            Une fois clos, l’exercice ne reçoit plus aucune écriture et n’en laisse modifier aucune.
            C’est ce qui garantit que le registre imprimé aujourd’hui dira la même chose dans trois ans —
            et c’est irréversible.
          </p>
          <button
            onClick={cloturer}
            disabled={occupe === 'cloture'}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-accent-ocre bg-white px-3.5 py-2 text-sm font-bold text-accent-ocre-dark disabled:opacity-50"
          >
            {occupe === 'cloture' ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />} Clôturer définitivement
          </button>
        </div>
      )}
    </div>
  )
}

function Carte({ icone, label, valeur, sous, ton }: {
  icone: React.ReactNode; label: string; valeur: string; sous: string; ton: 'vert' | 'ocre' | 'rouge'
}) {
  const couleurs = {
    vert: 'text-ivoire-green-dark bg-ivoire-green/8 border-ivoire-green/25',
    ocre: 'text-accent-ocre-dark bg-accent-ocre/8 border-accent-ocre/25',
    rouge: 'text-red-700 bg-red-50 border-red-200',
  }[ton]
  return (
    <div className={`rounded-2xl border px-3 py-3 text-center shadow-card ${couleurs}`}>
      <div className="flex items-center justify-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide">
        {icone} {label}
      </div>
      <p className="tnum mt-1 font-display text-[16px] font-extrabold leading-none md:text-xl">{valeur}</p>
      <p className="mt-0.5 text-[10.5px] opacity-75">{sous}</p>
    </div>
  )
}

function BoutonExport({ onClick, occupe, icone, children, principal }: {
  onClick: () => void; occupe: boolean; icone: React.ReactNode; children: React.ReactNode; principal?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={occupe}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition disabled:opacity-50 ${
        principal
          ? 'bg-ink text-white md:hover:brightness-125'
          : 'border border-line2 bg-white text-gray-700 md:hover:bg-cream-100'
      }`}
    >
      {occupe ? <Loader2 size={15} className="animate-spin" /> : icone}
      {children}
    </button>
  )
}

/** Un registre : sa ventilation par nature, puis ses écritures numérotées. */
function Registre({ titre, sous, lignes, cats, ventil, total, clos, onSupprimer, onPointer }: {
  titre: string; sous: string; lignes: Ligne[]; cats: Cat[]
  ventil: (Cat & { total: number })[]; total: number; clos: boolean
  onSupprimer: (l: Ligne) => void
  onPointer: (l: Ligne) => void
}) {
  const nomCat = (code: string) => cats.find((c) => c.code === code)?.nom ?? code
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line px-4 py-3">
        <p className="font-display text-sm font-extrabold text-ink">{titre}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">{sous}</p>
      </div>

      {ventil.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-line bg-cream-100/50 px-4 py-2.5">
          {ventil.map((v) => (
            <span key={v.code} className="rounded-full border border-line2 bg-white px-2.5 py-1 text-[11.5px] text-gray-700">
              {v.nom} · <b className="tnum">{F(v.total)}</b>
            </span>
          ))}
        </div>
      )}

      {lignes.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-gray-500">Aucune écriture sur cet exercice.</p>
      ) : (
        <div className="divide-y divide-line">
          {lignes.map((l) => (
            <div key={l.id} className="flex items-start gap-2.5 px-4 py-2.5">
              <span className="tnum mt-0.5 w-6 shrink-0 text-right text-[12px] font-bold text-gray-400">{l.numero}</span>
              {/* Le pointage : « je l'ai retrouvée sur le relevé de
                  l'opérateur ». Une ligne non pointée n'est pas douteuse —
                  elle n'a simplement pas encore été vérifiée. */}
              <button
                onClick={() => onPointer(l)}
                aria-pressed={l.pointe}
                aria-label={l.pointe ? `Retirer le pointage de ${l.libelle}` : `Pointer ${l.libelle} sur le relevé`}
                title={l.pointe ? 'Retrouvée sur le relevé' : 'Pas encore retrouvée sur le relevé'}
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                  l.pointe ? 'border-ivoire-green bg-ivoire-green text-white' : 'border-line2 bg-white text-transparent md:hover:border-primary-400'
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{l.libelle}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-gray-500">
                  <span className="tnum">{jourCourt(l.date)}</span>
                  <span>·</span>
                  <span>{nomCat(l.categorie)}</span>
                  <span>·</span>
                  <span>{MODES[l.mode] ?? l.mode}</span>
                  {l.reference && <><span>·</span><span className="tnum">{l.reference}</span></>}
                  {l.tiers && <><span>·</span><span className="truncate">{l.tiers}</span></>}
                  {l.source !== 'manuel' && (
                    <span className="rounded bg-gray-100 px-1.5 py-px text-[10.5px] font-semibold text-gray-600">
                      {l.source === 'ads' ? 'publicité du site' : 'reprise'}
                    </span>
                  )}
                </p>
                {l.note && <p className="mt-0.5 text-[11.5px] italic text-gray-500">{l.note}</p>}
              </div>
              <span className="tnum shrink-0 text-[13.5px] font-bold text-ink">{F(l.montant)}</span>
              {/* Seule une saisie manuelle se supprime : une ligne venue d'une
                  opération réelle correspond à de l'argent reçu, et l'effacer
                  ferait mentir le registre. */}
              {!clos && l.source === 'manuel' && (
                <button
                  onClick={() => onSupprimer(l)}
                  aria-label={`Supprimer ${l.libelle}`}
                  className="mt-0.5 shrink-0 rounded-lg p-1 text-gray-400 transition md:hover:bg-red-50 md:hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between bg-cream-100/60 px-4 py-2.5">
            <span className="text-[12px] font-bold uppercase tracking-wide text-gray-600">Total</span>
            <span className="tnum font-display text-[15px] font-extrabold text-ink">{F(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** La saisie d'une opération. Volontairement courte : ce qu'un contrôleur veut lire. */
function Saisie({ categories, modes, onFait, onErreur }: {
  categories: { recettes: Cat[]; depenses: Cat[] }
  modes: string[]
  onFait: () => void
  onErreur: (m: string) => void
}) {
  const [sens, setSens] = useState<'depense' | 'recette'>('depense')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [libelle, setLibelle] = useState('')
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('hebergement')
  const [mode, setMode] = useState('orange')
  const [reference, setReference] = useState('')
  const [tiers, setTiers] = useState('')
  const [piece, setPiece] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const cats = sens === 'recette' ? categories.recettes : categories.depenses
  useEffect(() => { setCategorie(cats[0]?.code ?? 'autre') }, [sens]) // eslint-disable-line react-hooks/exhaustive-deps

  async function envoyer() {
    if (!libelle.trim()) return onErreur('Décrivez l’opération : c’est ce que lira le contrôleur.')
    if (!Number(montant)) return onErreur('Indiquez le montant en francs CFA.')
    setEnvoi(true)
    try {
      await php.phpComptaAjout({ sens, date, libelle, montant: Number(montant), categorie, mode, reference, tiers, piece })
      onFait()
    } catch (e) { onErreur((e as Error).message) }
    finally { setEnvoi(false) }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex gap-2">
        {(['depense', 'recette'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSens(s)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${
              sens === s ? 'border-primary-500 bg-primary-500 text-white' : 'border-line2 bg-white text-gray-700'
            }`}
          >
            {s === 'depense' ? 'Une dépense' : 'Une recette'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Champ label="Date de l’opération">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </Champ>
        <Champ label="Montant (FCFA)">
          <input inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value.replace(/\D/g, ''))} placeholder="Ex : 50000" className="input" />
        </Champ>
      </div>

      <Champ label="Libellé" aide="Ce que le contrôleur lira. Soyez précis : « Hébergement TPE Cloud, année 2026 » plutôt que « serveur ».">
        <input value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={160} placeholder="Ex : Hébergement TPE Cloud — abonnement annuel" className="input" />
      </Champ>

      <div className="grid grid-cols-2 gap-2.5">
        <Champ label="Nature">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="input">
            {cats.map((c) => <option key={c.code} value={c.code}>{c.nom}</option>)}
          </select>
        </Champ>
        <Champ label="Réglé par">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="input">
            {modes.map((m) => <option key={m} value={m}>{MODES[m] ?? m}</option>)}
          </select>
        </Champ>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Champ label="Référence" aide="N° de transaction Mobile Money.">
          <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} placeholder="Ex : MP260115.1432.A12345" className="input" />
        </Champ>
        <Champ label="Bénéficiaire / payeur">
          <input value={tiers} onChange={(e) => setTiers(e.target.value)} maxLength={120} placeholder="Ex : TPE Cloud SARL" className="input" />
        </Champ>
      </div>

      <Champ label="Pièce justificative" aide="Où se trouve le reçu : « facture n° 2026-014 », « capture Orange Money du 15/01 ». C'est ce qu'on vous demandera de produire.">
        <input value={piece} onChange={(e) => setPiece(e.target.value)} maxLength={120} placeholder="Ex : facture TPE Cloud n° 2026-014" className="input" />
      </Champ>

      <button
        onClick={envoyer}
        disabled={envoi}
        className="w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {envoi ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Inscrire au registre'}
      </button>
    </div>
  )
}

function Champ({ label, aide, children }: { label: string; aide?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      {children}
      {aide && <p className="mt-1 text-[11px] leading-snug text-gray-500">{aide}</p>}
    </div>
  )
}
