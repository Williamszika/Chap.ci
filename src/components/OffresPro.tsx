import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, Trash2, ArrowUp, ArrowDown, Pencil, Lock, Unlock, Users } from 'lucide-react'
import {
  phpMesOffres, phpCreerOffre, phpModifierOffre, phpSupprimerOffre, ApiError,
  type Offre, type OffreEntree, type TypeChamp, type ChampFormulaire,
} from '../lib/php'
import { useToast } from '../store/ToastContext'
import { CarteOffre, CONTRATS, TYPES_CHAMP } from './Offres'

/**
 * « Offres d'emploi » — la console de la structure (06/09/2026).
 *
 * Elle publie un poste, dit comment on y postule (son lien, ou un formulaire
 * qu'elle dessine ici question par question), ferme, rouvre, supprime, et
 * ouvre les candidatures reçues. Les abonnés sont prévenus à chaque
 * publication : c'est le serveur qui le dit, en retour.
 */

interface Question { cle: number; id?: string; label: string; type: TypeChamp; requis: boolean; options: string }
type Voie = 'formulaire' | 'lien' | 'les-deux'

/** Les trois questions que le serveur poserait de toute façon. */
const QUESTIONS_DEFAUT: ChampFormulaire[] = [
  { id: 'nom', label: 'Votre nom complet', type: 'texte', requis: true },
  { id: 'tel', label: 'Votre numéro de téléphone', type: 'tel', requis: true },
  { id: 'message', label: 'Présentez-vous en quelques lignes', type: 'long', requis: true },
]
let compteurCles = 0
const nouvelle = (q: Omit<Question, 'cle'>): Question => ({ ...q, cle: ++compteurCles })

const ETIQ = 'mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500'

export function OffresPro({ pro, onChange }: { pro: boolean; onChange?: () => void }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [offres, setOffres] = useState<Offre[] | null>(null)
  const [edition, setEdition] = useState<Offre | 'nouvelle' | null>(null)
  const [occupe, setOccupe] = useState<string | null>(null)

  const recharger = () => { phpMesOffres().then(setOffres).catch(() => setOffres([])) }
  useEffect(() => { if (pro) recharger() }, [pro])

  if (!pro) {
    return (
      <div className="card p-4 text-sm leading-relaxed text-gray-600">
        Les offres d’emploi sont réservées aux comptes professionnels approuvés — entreprises, ONG,
        centres de formation, structures. Faites vérifier votre dossier depuis l’onglet Pro.
      </div>
    )
  }

  if (edition) {
    return (
      <FormulaireOffre offre={edition === 'nouvelle' ? null : edition}
        onRetour={() => setEdition(null)}
        onEnregistre={() => { setEdition(null); recharger(); onChange?.() }} />
    )
  }

  async function basculer(o: Offre) {
    setOccupe(o.id)
    try {
      await phpModifierOffre(o.id, { statut: o.statut === 'ouverte' ? 'fermee' : 'ouverte' })
      toast.success(o.statut === 'ouverte' ? 'Offre fermée : elle ne se voit plus sur votre page.' : 'Offre rouverte.')
      recharger(); onChange?.()
    } catch (e) { toast.error((e as ApiError).message || 'Impossible pour le moment.') }
    finally { setOccupe(null) }
  }
  async function supprimer(o: Offre) {
    if (!window.confirm(`Supprimer « ${o.titre} » ? Les candidatures reçues partent avec.`)) return
    setOccupe(o.id)
    try { await phpSupprimerOffre(o.id); toast.success('Offre supprimée.'); recharger(); onChange?.() }
    catch (e) { toast.error((e as ApiError).message || 'Impossible pour le moment.') }
    finally { setOccupe(null) }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-4">
        <p className="font-display text-[15px] font-extrabold text-ink">💼 Recrutez depuis votre page</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Vos offres apparaissent sur votre page vendeur, onglet Emplois. À chaque publication, vos
          abonnés sont prévenus. Les candidats répondent à vos questions ici même, ou passent par
          votre lien (Google Forms, WhatsApp, votre site).
        </p>
        <button onClick={() => setEdition('nouvelle')} className="btn-primary mt-3 w-full sm:w-auto">
          <Plus size={16} /> Publier une offre
        </button>
      </div>

      {offres === null ? (
        <div className="grid min-h-[20vh] place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
      ) : offres.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Aucune offre pour l’instant.</p>
      ) : (
        offres.map((o) => (
          <CarteOffre key={o.id} offre={o} mienne onOpen={() => navigate(`/emploi/${o.id}`)} actions={
            <>
              <button onClick={() => navigate(`/emploi/${o.id}`)} className="chip min-h-11">
                <Users size={14} /> Candidatures{o.candidatures ? ` · ${o.candidatures}` : ''}
              </button>
              <button onClick={() => setEdition(o)} className="chip min-h-11"><Pencil size={14} /> Modifier</button>
              <button onClick={() => basculer(o)} disabled={occupe === o.id} className="chip min-h-11">
                {o.statut === 'ouverte' ? <><Lock size={14} /> Fermer</> : <><Unlock size={14} /> Rouvrir</>}
              </button>
              <button onClick={() => supprimer(o)} disabled={occupe === o.id} className="chip min-h-11 text-red-600">
                <Trash2 size={14} /> Supprimer
              </button>
            </>
          } />
        ))
      )}
    </div>
  )
}

/** Le poste, la voie de candidature, et le constructeur de questions. */
function FormulaireOffre({ offre, onRetour, onEnregistre }: {
  offre: Offre | null; onRetour: () => void; onEnregistre: () => void
}) {
  const toast = useToast()
  const [titre, setTitre] = useState(offre?.titre ?? '')
  const [contrat, setContrat] = useState(offre?.contrat ?? '')
  const [lieu, setLieu] = useState(offre?.lieu ?? '')
  const [salaire, setSalaire] = useState(offre?.salaire ?? '')
  const [description, setDescription] = useState(offre?.description ?? '')
  const [voie, setVoie] = useState<Voie>(() => {
    if (!offre) return 'formulaire'
    if (offre.lien && offre.formulaire.length) return 'les-deux'
    return offre.lien ? 'lien' : 'formulaire'
  })
  const [lien, setLien] = useState(offre?.lien ?? '')
  const [questions, setQuestions] = useState<Question[]>(() =>
    (offre && offre.formulaire.length ? offre.formulaire : QUESTIONS_DEFAUT)
      .map((c) => nouvelle({ id: c.id, label: c.label, type: c.type, requis: c.requis, options: (c.options ?? []).join('\n') })))
  const [envoi, setEnvoi] = useState(false)
  const avecFormulaire = voie !== 'lien'
  const avecLien = voie !== 'formulaire'

  const majQ = (cle: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.cle === cle ? { ...q, ...patch } : q)))
  const deplacer = (i: number, d: -1 | 1) => setQuestions((qs) => {
    const j = i + d
    if (j < 0 || j >= qs.length) return qs
    const n = [...qs]; [n[i], n[j]] = [n[j], n[i]]
    return n
  })
  const retirer = (cle: number) => setQuestions((qs) => qs.filter((q) => q.cle !== cle))
  const ajouter = () => setQuestions((qs) =>
    qs.length >= 12 ? qs : [...qs, nouvelle({ label: '', type: 'texte', requis: false, options: '' })])

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    if (titre.trim().length < 4) { toast.error('Donnez un titre au poste (ex. : « Vendeuse en boutique, Cocody »).'); return }
    if (description.trim().length < 20) { toast.error('Décrivez le poste en quelques lignes : les missions, le profil, les horaires.'); return }
    if (avecLien && !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(lien.trim())) {
      toast.error('Le lien doit commencer par https:// — copiez-le depuis Google Forms, WhatsApp ou votre site.'); return
    }
    // Chaque question garde son identifiant (c'est lui qui relie une réponse
    // à sa question) ; une question nouvelle en reçoit un qui n'existe pas.
    const pris = new Set(questions.map((q) => q.id).filter(Boolean) as string[])
    let n = 0
    const formulaire: NonNullable<OffreEntree['formulaire']> = avecFormulaire ? questions.map((q) => {
      let id = q.id
      if (!id) { do { n++; id = `q${n}` } while (pris.has(id)); pris.add(id) }
      return {
        id, label: q.label.trim(), type: q.type, requis: q.requis,
        ...(q.type === 'choix' ? { options: q.options.split('\n').map((s) => s.trim()).filter(Boolean) } : {}),
      }
    }) : []
    if (avecFormulaire) {
      if (!formulaire.length) { toast.error('Ajoutez au moins une question, ou passez par un lien.'); return }
      for (const c of formulaire) {
        if (!c.label) { toast.error('Chaque question a besoin d’un libellé.'); return }
        if (c.type === 'choix' && (c.options?.length ?? 0) < 2) { toast.error(`« ${c.label} » : donnez au moins deux options, une par ligne.`); return }
      }
    }
    setEnvoi(true)
    try {
      const d: OffreEntree = {
        titre: titre.trim(), description: description.trim(),
        contrat: contrat.trim(), lieu: lieu.trim(), salaire: salaire.trim(),
        lien: avecLien ? lien.trim() : '', formulaire,
      }
      if (offre) {
        await phpModifierOffre(offre.id, d)
        toast.success('Offre mise à jour.')
      } else {
        const r = await phpCreerOffre(d)
        const p = r.abonnesPrevenus ?? 0
        toast.success(p > 0 ? `Offre publiée · ${p} abonné${p > 1 ? 's' : ''} prévenu${p > 1 ? 's' : ''}.` : 'Offre publiée sur votre page.')
      }
      onEnregistre()
    } catch (err) {
      toast.error((err as ApiError).message || 'Enregistrement impossible.')
    } finally { setEnvoi(false) }
  }

  return (
    <form onSubmit={enregistrer} className="space-y-4">
      <button type="button" onClick={onRetour} className="inline-flex min-h-11 items-center text-sm font-semibold text-gray-500">
        ‹ Mes offres
      </button>

      <section className="card space-y-3 p-4">
        <h2 className="font-display text-base font-bold text-ink">{offre ? 'Modifier l’offre' : 'Le poste'}</h2>
        <label className="block">
          <span className={ETIQ}>Intitulé du poste *</span>
          <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120}
            placeholder="Ex. : Vendeuse en boutique, Cocody" />
        </label>
        <div>
          <span className={ETIQ}>Type de contrat</span>
          <div className="flex flex-wrap gap-1.5">
            {CONTRATS.map((c) => (
              <button type="button" key={c} onClick={() => setContrat(contrat === c ? '' : c)} aria-pressed={contrat === c}
                className={`chip min-h-11 ${contrat === c ? 'border-primary-500 bg-primary-500 text-white' : ''}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ETIQ}>Lieu</span>
            <input className="input" value={lieu} onChange={(e) => setLieu(e.target.value)} maxLength={80} placeholder="Cocody, Abidjan" />
          </label>
          <label className="block">
            <span className={ETIQ}>Salaire</span>
            <input className="input" value={salaire} onChange={(e) => setSalaire(e.target.value)} maxLength={80} placeholder="120 000 FCFA / mois" />
          </label>
        </div>
        <label className="block">
          <span className={ETIQ}>Description *</span>
          <textarea className="input min-h-[140px]" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000}
            placeholder="Les missions, le profil attendu, les horaires, comment se passe l’entretien…" />
        </label>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-display text-base font-bold text-ink">Comment postule-t-on ?</h2>
        <div className="grid gap-2">
          {([
            ['formulaire', 'Un formulaire sur Chap.ci', 'Vous choisissez les questions ; les réponses arrivent dans votre compte'],
            ['lien', 'Un lien vers votre formulaire', 'Google Forms, WhatsApp, votre site'],
            ['les-deux', 'Les deux', 'Le candidat choisit'],
          ] as [Voie, string, string][]).map(([v, t, s]) => (
            <button type="button" key={v} onClick={() => setVoie(v)} aria-pressed={voie === v}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left ${voie === v ? 'border-primary-500 bg-primary-50' : 'border-line bg-white'}`}>
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${voie === v ? 'border-primary-500' : 'border-gray-300'}`}>
                {voie === v && <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{t}</span>
                <span className="block text-xs text-gray-500">{s}</span>
              </span>
            </button>
          ))}
        </div>
        {avecLien && (
          <label className="block">
            <span className={ETIQ}>Adresse du formulaire</span>
            <input className="input" type="url" inputMode="url" value={lien} onChange={(e) => setLien(e.target.value)}
              maxLength={300} placeholder="https://forms.gle/…" />
          </label>
        )}
      </section>

      {avecFormulaire && (
        <section className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">Vos questions</h2>
            <span className="tnum text-xs text-gray-500">{questions.length}/12</span>
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            Le candidat y répond depuis l’offre. Douze questions au plus — les meilleures offres en posent trois ou quatre.
          </p>
          {questions.map((q, i) => (
            <div key={q.cle} className="rounded-xl border border-line bg-cream-100/60 p-3">
              <div className="flex items-start gap-2">
                <span className="tnum mt-3 w-5 shrink-0 text-xs font-extrabold text-gray-400">{i + 1}.</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <input className="input" value={q.label} onChange={(e) => majQ(q.cle, { label: e.target.value })} maxLength={80}
                    placeholder="La question (ex. : Combien d’années d’expérience ?)" aria-label={`Question ${i + 1}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <select className="input min-w-0 flex-1 py-2 text-xs" value={q.type} aria-label="Type de réponse"
                      onChange={(e) => majQ(q.cle, { type: e.target.value as TypeChamp })}>
                      {TYPES_CHAMP.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <label className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <input type="checkbox" checked={q.requis} onChange={(e) => majQ(q.cle, { requis: e.target.checked })} /> Obligatoire
                    </label>
                  </div>
                  {q.type === 'choix' && (
                    <textarea className="input min-h-[80px] text-sm" value={q.options} aria-label="Les options, une par ligne"
                      onChange={(e) => majQ(q.cle, { options: e.target.value })}
                      placeholder={'Une option par ligne :\nMoins de 2 ans\n2 à 5 ans\nPlus de 5 ans'} />
                  )}
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter la question"
                    className="grid h-11 w-11 place-items-center rounded-lg text-gray-500 disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => deplacer(i, 1)} disabled={i === questions.length - 1} aria-label="Descendre la question"
                    className="grid h-11 w-11 place-items-center rounded-lg text-gray-500 disabled:opacity-30"><ArrowDown size={15} /></button>
                  <button type="button" onClick={() => retirer(q.cle)} aria-label="Retirer la question"
                    className="grid h-11 w-11 place-items-center rounded-lg text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={ajouter} disabled={questions.length >= 12} className="btn-outline w-full">
            <Plus size={16} /> Ajouter une question
          </button>
        </section>
      )}

      <button type="submit" disabled={envoi} className="btn-primary w-full">
        {envoi && <Loader2 className="animate-spin" size={16} />} {offre ? 'Enregistrer' : 'Publier l’offre'}
      </button>
      {!offre && (
        <p className="text-center text-[11px] leading-relaxed text-gray-500">
          L’offre reste en ligne soixante jours ; vous pouvez la fermer à tout moment. Vos abonnés sont prévenus dès la publication.
        </p>
      )}
    </form>
  )
}
