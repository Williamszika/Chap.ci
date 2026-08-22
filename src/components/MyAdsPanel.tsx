import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Megaphone, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react'
import { mediaUrl } from '../lib/native'
import { fetchMyAds, type MyAd, type MyAds } from '../lib/ads'
import { formatFCFA, formatPrice } from '../lib/format'
import { AdStatsChart } from './AdStatsChart'

const n = (x: number) => x.toLocaleString('fr-FR')

/** Date et HEURE : « le 4 août » ne dit pas si la bannière tombe le matin ou le soir. */
function dateHeure(ms?: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
function dateCourte(ms?: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Statut RÉEL d'une publicité.
 *
 * La base garde « active » jusqu'au passage de la tâche automatique : une
 * bannière dont la date est dépassée s'y affiche donc encore comme en ligne.
 * On corrige à l'affichage — sinon on proposerait de prolonger une campagne
 * déjà terminée, et le serveur refuserait sans que l'annonceur comprenne.
 */
function statutReel(a: MyAd): string {
  if (a.status === 'active' && a.expiresAt && a.expiresAt <= Date.now()) return 'expired'
  return a.status
}

const PASTILLE: Record<string, [string, string]> = {
  pending: ['En attente de validation', 'bg-amber-50 text-amber-700'],
  active: ['En ligne', 'bg-ivoire-green/10 text-ivoire-green-dark'],
  rejected: ['Refusée', 'bg-red-50 text-red-600'],
  expired: ['Terminée', 'bg-gray-100 text-gray-500'],
  merged: ['Prolongation appliquée', 'bg-sky-50 text-sky-700'],
}

const FORMULE: Record<string, [string, string]> = {
  day: ['jour', 'jours'],
  week: ['semaine', 'semaines'],
  month: ['mois', 'mois'],
}

/** Grande valeur du bandeau de synthèse. */
function Chiffre({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-3.5 text-center shadow-card">
      <p className="tnum font-display text-lg font-extrabold leading-none text-ink md:text-xl">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-[10.5px] text-gray-500">{sub}</p>}
    </div>
  )
}

/**
 * « Mes publicités » — historique, coût et performance des campagnes du compte.
 *
 * L'annonceur reçoit déjà tout par e-mail (réception, mise en ligne, rapport
 * tous les 3 jours, veille de la fin, bilan). Cette page sert à autre chose :
 * revoir SANS ATTENDRE un e-mail, comparer une campagne à la précédente, et
 * prolonger en un geste tant que la bannière est encore à l'écran.
 */
export function MyAdsPanel() {
  const navigate = useNavigate()
  const [data, setData] = useState<MyAds | null>(null)
  const [err, setErr] = useState('')

  const load = () => {
    setErr('')
    fetchMyAds().then(setData).catch((e) => setErr((e as Error).message))
  }
  useEffect(load, [])

  if (err) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
        <AlertTriangle className="mx-auto text-amber-500" size={22} />
        <p className="mt-2 text-sm text-gray-600">{err}</p>
        <button onClick={load} className="btn-outline mt-3 px-4 py-2 text-sm">
          <RefreshCw size={15} /> Réessayer
        </button>
      </div>
    )
  }
  if (!data) {
    return <div className="grid min-h-[30vh] place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
  }

  if (data.ads.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cream-100 text-2xl">📺</div>
        <p className="mt-3 font-display text-[17px] font-extrabold text-ink">Aucune publicité pour l’instant</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">
          Affichez votre boutique ou votre annonce en tête de l’accueil, dès {formatFCFA(2000)} la
          semaine. Vos chiffres — affichages, clics, coût — apparaîtront ici.
        </p>
        <Link to="/publicite" className="btn-primary mt-4 inline-flex">
          <Megaphone size={17} /> Créer une publicité
        </Link>
      </div>
    )
  }

  const { total, courbe, ads } = data
  // Coût pour mille affichages : la seule mesure comparable d'une campagne à
  // l'autre. Le « coût par affichage » brut donne 0,0 F et n'apprend rien.
  const cpm = total.vues > 0 ? Math.round((total.depense / total.vues) * 1000) : 0

  return (
    <div className="space-y-4">
      {/* Synthèse — toutes campagnes confondues */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Chiffre value={formatPrice(total.depense)} label="dépensé" sub="FCFA au total" />
        <Chiffre value={n(total.vues)} label="affichages" />
        <Chiffre value={n(total.clics)} label="clics" sub={`${String(total.ctr).replace('.', ',')} % de clics`} />
        <Chiffre value={cpm > 0 ? n(cpm) : '—'} label="coût / 1 000 vues" sub="FCFA" />
      </div>

      {/* Courbe consolidée (30 derniers jours) */}
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
        <p className="font-display text-[15px] font-extrabold text-ink">Votre audience, jour par jour</p>
        <p className="mt-0.5 text-xs text-gray-400">Toutes vos publicités réunies · 30 derniers jours</p>
        <AdStatsChart className="mt-3" data={courbe.map((c) => ({ day: c.day, views: Number(c.v), clicks: Number(c.c) }))} />
      </section>

      {/* Historique des campagnes */}
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
        <p className="font-display text-[15px] font-extrabold text-ink">Mes campagnes · {ads.length}</p>
        <div className="mt-1 divide-y divide-line">
          {ads.map((a) => {
            const st = statutReel(a)
            const [label, cls] = PASTILLE[st] ?? PASTILLE.pending
            const [u, up] = FORMULE[a.formule] ?? ['jour', 'jours']
            const ctr = String(a.ctr).replace('.', ',')
            return (
              <div key={a.id} className="py-3.5">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-900">
                    {a.images[0]
                      ? <img src={mediaUrl(a.images[0])} alt="" className="h-full w-full object-cover" />
                      : <span className="grid h-full w-full place-items-center text-lg">📺</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-display text-sm font-bold text-ink">
                        {a.title || <span className="italic text-gray-400">(image seule)</span>}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{label}</span>
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-gray-500">
                      <b className="tnum text-gray-600">{formatFCFA(a.price)}</b> · {a.qty} {a.qty > 1 ? up : u}
                      {st === 'active' && a.expiresAt && <> · fin le <b className="text-gray-600">{dateHeure(a.expiresAt)}</b></>}
                      {st === 'expired' && a.expiresAt && <> · terminée le {dateCourte(a.expiresAt)}</>}
                      {st === 'pending' && <> · demande envoyée le {dateCourte(a.createdAt)}</>}
                    </p>

                    {/* Chiffres de la campagne */}
                    {(a.views > 0 || st === 'active' || st === 'expired') && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[12.5px] text-gray-600">
                        <span><b className="tnum text-ink">{n(a.views)}</b> affichages</span>
                        <span><b className="tnum text-ink">{n(a.clicks)}</b> clic{a.clicks > 1 ? 's' : ''}</span>
                        <span><b className="tnum text-ink">{ctr} %</b> de clics</span>
                      </div>
                    )}

                    {/* Motif de refus : sans lui, l'annonceur refait la même erreur. */}
                    {st === 'rejected' && a.rejectReason && (
                      <p className="mt-2 rounded-lg border-l-[3px] border-red-500 bg-red-50 px-3 py-2 text-[12.5px] leading-relaxed text-gray-700">
                        <b>Motif du refus :</b> {a.rejectReason}
                      </p>
                    )}
                    {st === 'pending' && (
                      <p className="mt-2 rounded-lg bg-[#FFF6EC] px-3 py-2 text-[12px] leading-relaxed text-gray-600">
                        Nous vérifions votre paiement de <b className="tnum">{formatFCFA(a.price)}</b>. Votre bannière
                        passe à l’écran dès validation — vous recevrez un e-mail.
                      </p>
                    )}
                    {/* Une prolongation n'est pas une seconde bannière : son
                        temps a été ajouté à la campagne d'origine, et c'est là
                        que ses affichages sont comptés. Sans cette phrase, la
                        ligne semble être une campagne à 0 affichage. */}
                    {st === 'merged' && (
                      <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[12px] leading-relaxed text-gray-600">
                        Durée ajoutée à votre bannière d’origine. Les affichages et les clics de cette
                        période sont comptés sur celle-ci.
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {/* Prolonger : UNIQUEMENT tant que la bannière est à l'écran.
                          Après la fin, ce n'est plus une prolongation mais une
                          nouvelle campagne — et l'affichage aurait été coupé. */}
                      {st === 'active' && (
                        <button
                          onClick={() => navigate(`/publicite?prolonger=${encodeURIComponent(a.id)}`)}
                          className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
                        >
                          <RefreshCw size={13} /> Prolonger
                        </button>
                      )}
                      {st === 'expired' && (
                        <Link
                          to="/publicite"
                          className="flex items-center gap-1 rounded-lg border border-line2 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-cream-100"
                        >
                          <Megaphone size={13} /> Relancer
                        </Link>
                      )}
                      {st === 'active' && (
                        <Link
                          to={`/pub/${a.id}`}
                          className="flex items-center gap-1 rounded-lg border border-line2 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-cream-100"
                        >
                          Voir la page <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <p className="px-1 text-center text-[11.5px] leading-relaxed text-gray-400">
        Un affichage est compté une fois par visiteur et par visite. Vous recevez aussi ces chiffres
        par e-mail tous les 3 jours, la veille de la fin, puis en bilan.
      </p>
    </div>
  )
}
