import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, RefreshCw, Table2, BarChart3 } from 'lucide-react'
import { fetchAdminPays, type AdminPays } from '../lib/admin'
import { formatPrice, timeAgo } from '../lib/format'
import { drapeau, paysParCode } from '../data/pays'
import { KpiCrm, KpisCrm } from './CrmAdmin'

/**
 * ONGLET « PAYS » — les inscrits hors Côte d'Ivoire (07/09/2026).
 *
 * Le Patron : « nous montrer, à part la Côte d'Ivoire, quels sont les pays
 * inscrits, leurs villes et le nombre de personnes inscrites, avec un vrai
 * tableau de bord. Cela nous permettra d'étendre le site dans les pays les
 * plus inscrits. »
 *
 * L'onglet répond donc à trois questions, dans cet ordre :
 *   1. Combien de gens hors CI, et est-ce que ça bouge (30 jours, 12 mois) ?
 *   2. Dans QUELS pays, et dans quelles villes — c'est là qu'on ouvrira.
 *   3. Qui VISITE sans s'inscrire — le pays qui regarde beaucoup et ne
 *      s'inscrit pas est le premier candidat à une ouverture.
 *
 * Une seule teinte pour les barres (c'est une seule mesure), les valeurs
 * écrites à côté des barres, et un tableau pour ceux qui préfèrent lire.
 */

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

const nomPays = (code: string): string => paysParCode(code)?.nom ?? (code === 'ZZ' ? 'Autre pays' : code)

type Tri = 'inscrits' | 'recents' | 'annonces'
const TRIS: [Tri, string][] = [['inscrits', 'Inscrits'], ['recents', '30 jours'], ['annonces', 'Annonces']]

export function PaysTab() {
  const [data, setData] = useState<AdminPays | null>(null)
  const [err, setErr] = useState('')
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    setData(null); setErr('')
    fetchAdminPays().then((d) => { if (alive) setData(d) }).catch((e) => { if (alive) setErr((e as Error).message) })
    return () => { alive = false }
  }, [n])

  if (err) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-red-600">⚠️ {err}</p>
        <button onClick={() => setN((x) => x + 1)} className="btn-outline mt-3 py-2 text-sm"><RefreshCw size={16} /> Réessayer</button>
      </div>
    )
  }
  if (!data) return <div className="flex min-h-[40vh] items-center justify-center text-gray-500"><Loader2 className="animate-spin" size={20} /></div>

  const part = data.total > 0 ? Math.round((data.horsCi / data.total) * 1000) / 10 : 0
  const nbPays = data.pays.filter((p) => p.inscrits > 0).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Hors Côte d’Ivoire</h2>
          <p className="text-xs text-gray-500">
            Les membres qui ont choisi « Autres pays » à l’inscription — leur pays, leur ville, et ceux qui visitent sans s’inscrire encore.
          </p>
        </div>
        <button
          onClick={() => setN((x) => x + 1)}
          className="flex items-center gap-1.5 rounded-full border border-line2 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-cream-100 active:scale-95"
          title={`Calculé ${timeAgo(Date.parse(data.genereLe)).replace(/^À/, 'à')}`}
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      <KpisCrm>
        <KpiCrm valeur={formatPrice(data.horsCi)} libelle="Inscrits hors CI" sous={data.total > 0 ? `${part.toLocaleString('fr-FR')} % des ${formatPrice(data.total)} membres` : 'Aucun membre pour l’instant'} />
        <KpiCrm valeur={`+${formatPrice(data.horsCiRecents)}`} libelle="Sur 30 jours" sous="Nouveaux inscrits hors CI" ton={data.horsCiRecents > 0 ? 'bon' : 'neutre'} />
        <KpiCrm valeur={formatPrice(nbPays)} libelle={nbPays > 1 ? 'Pays représentés' : 'Pays représenté'} sous="Au moins un membre inscrit" />
        <KpiCrm valeur={formatPrice(data.sansLieu)} libelle="Sans lieu" sous="Ni Côte d’Ivoire ni ailleurs : à ne pas compter comme CI" ton={data.sansLieu > 0 && data.sansLieu >= data.horsCi ? 'alerte' : 'neutre'} />
      </KpisCrm>

      {data.horsCi === 0 && data.pays.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
          <p className="text-3xl">🌍</p>
          <p className="mt-2 font-display text-base font-bold text-ink">Personne hors Côte d’Ivoire pour l’instant</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Dès qu’un membre choisit « Autres pays » à l’inscription ou dans son profil, son pays et sa ville
            apparaîtront ici. En attendant, la carte des visiteurs ci-dessous dit déjà d’où l’on regarde le site.
          </p>
        </div>
      ) : (
        <>
          <ParPays pays={data.pays} />
          <ParMois mois={data.mois} />
        </>
      )}

      <Visiteurs visites={data.visites} visiteursCi={data.visiteursCi} inscrits={data.pays} />
    </div>
  )
}

// ---------- Par pays : barres, villes dépliables, ou tableau ----------
function ParPays({ pays }: { pays: AdminPays['pays'] }) {
  const [tri, setTri] = useState<Tri>('inscrits')
  const [vue, setVue] = useState<'barres' | 'tableau'>('barres')
  const [ouvert, setOuvert] = useState<string | null>(null)

  const liste = useMemo(() => {
    const l = [...pays]
    l.sort((a, b) => (b[tri] - a[tri]) || (b.inscrits - a.inscrits) || nomPays(a.code).localeCompare(nomPays(b.code), 'fr'))
    return l
  }, [pays, tri])
  const max = Math.max(1, ...liste.map((p) => p[tri]))
  const totalVilles = pays.reduce((s, p) => s + p.villes.length, 0)

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold text-ink">Où l’on s’inscrit</p>
          <p className="text-xs text-gray-500">
            {formatPrice(pays.length)} pays{totalVilles > 0 ? ` · ${formatPrice(totalVilles)} ville${totalVilles > 1 ? 's' : ''} citée${totalVilles > 1 ? 's' : ''}` : ''}. Touchez un pays pour voir ses villes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-0.5">
            {TRIS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTri(id)}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${tri === id ? 'bg-white text-ink shadow-sm' : 'text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVue((v) => (v === 'barres' ? 'tableau' : 'barres'))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line2 bg-white text-gray-600 transition hover:bg-cream-100"
            aria-label={vue === 'barres' ? 'Voir en tableau' : 'Voir en barres'}
            title={vue === 'barres' ? 'Voir en tableau' : 'Voir en barres'}
          >
            {vue === 'barres' ? <Table2 size={15} /> : <BarChart3 size={15} />}
          </button>
        </div>
      </div>

      {vue === 'tableau' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                <th className="py-1.5 pr-2">Pays</th>
                <th className="py-1.5 pr-2 text-right">Inscrits</th>
                <th className="py-1.5 pr-2 text-right">30 jours</th>
                <th className="py-1.5 pr-2 text-right">Annonces</th>
                <th className="py-1.5">Villes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {liste.map((p) => (
                <tr key={p.code}>
                  <td className="py-2 pr-2 font-medium text-gray-800"><span className="mr-1.5">{drapeau(p.code)}</span>{nomPays(p.code)}</td>
                  <td className="tnum py-2 pr-2 text-right font-semibold text-ink">{formatPrice(p.inscrits)}</td>
                  <td className="tnum py-2 pr-2 text-right text-gray-600">{p.recents > 0 ? `+${formatPrice(p.recents)}` : '—'}</td>
                  <td className="tnum py-2 pr-2 text-right text-gray-600">{p.annonces > 0 ? formatPrice(p.annonces) : '—'}</td>
                  <td className="py-2 text-gray-600">
                    {p.villes.length > 0 ? p.villes.map((v) => `${v.ville} (${formatPrice(v.inscrits)})`).join(', ') : <span className="text-gray-400">Ville non renseignée</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-1">
          {liste.map((p) => {
            const v = p[tri]
            const estOuvert = ouvert === p.code
            return (
              <li key={p.code} className={`rounded-xl transition ${estOuvert ? 'bg-cream-100/70' : ''}`}>
                <button
                  type="button"
                  onClick={() => setOuvert(estOuvert ? null : p.code)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-cream-100/70"
                  aria-expanded={estOuvert}
                >
                  <span className="w-7 shrink-0 text-center text-xl leading-none" aria-hidden>{drapeau(p.code)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-gray-800">{nomPays(p.code)}</span>
                      <span className="tnum shrink-0 font-semibold text-ink">
                        {tri === 'recents' && v > 0 ? '+' : ''}{formatPrice(v)}
                        <span className="ml-1.5 text-[11px] font-normal text-gray-400">
                          {tri === 'inscrits' ? (p.recents > 0 ? `+${formatPrice(p.recents)} en 30 j` : '') : tri === 'recents' ? `${formatPrice(p.inscrits)} au total` : `${formatPrice(p.inscrits)} inscrit${p.inscrits > 1 ? 's' : ''}`}
                        </span>
                      </span>
                    </span>
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <span className="block h-full rounded-full bg-primary-500" style={{ width: `${v > 0 ? Math.max(2, (v / max) * 100) : 0}%` }} />
                    </span>
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-gray-400 transition ${estOuvert ? 'rotate-180' : ''}`} />
                </button>
                {estOuvert && (
                  <div className="px-2 pb-3 pl-12">
                    {p.villes.length > 0 ? (
                      <ul className="divide-y divide-line/60">
                        {p.villes.map((vl) => (
                          <li key={vl.ville} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="min-w-0 flex-1 truncate text-gray-700">{vl.ville}</span>
                            <span className="tnum shrink-0 text-gray-600">{formatPrice(vl.inscrits)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-1 text-[12.5px] text-gray-500">
                        {p.inscrits > 0 ? 'Aucune ville renseignée par ces membres.' : 'Pas encore d’inscrit : seulement des annonces publiées depuis ce pays.'}
                      </p>
                    )}
                    {p.annonces > 0 && (
                      <p className="mt-1.5 text-[11.5px] text-gray-500">
                        {formatPrice(p.annonces)} annonce{p.annonces > 1 ? 's' : ''} publiée{p.annonces > 1 ? 's' : ''} depuis ce pays.
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ---------- Par mois : douze colonnes fines ----------
function ParMois({ mois }: { mois: AdminPays['mois'] }) {
  const [actif, setActif] = useState<number | null>(null)
  const max = Math.max(1, ...mois.map((m) => m.inscrits))
  const iMax = mois.reduce((best, m, i) => (m.inscrits > (mois[best]?.inscrits ?? -1) ? i : best), 0)
  const total = mois.reduce((s, m) => s + m.inscrits, 0)
  const libelle = (ym: string, i: number) => {
    const [a, m] = ym.split('-')
    const nom = MOIS_COURTS[Number(m) - 1] ?? m
    return i === 0 || m === '01' ? `${nom} ${a.slice(2)}` : nom
  }
  const libelleLong = (ym: string) => {
    const [a, m] = ym.split('-')
    return `${MOIS_COURTS[Number(m) - 1] ?? m} ${a}`
  }
  const H = 120

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3">
        <p className="font-display text-base font-bold text-ink">Inscriptions hors CI, mois par mois</p>
        <p className="text-xs text-gray-500">
          {total > 0 ? `${formatPrice(total)} sur douze mois. Le mois en cours est incomplet.` : 'Aucune inscription hors CI sur les douze derniers mois.'}
        </p>
      </div>
      <div className="relative" onMouseLeave={() => setActif(null)}>
        {actif !== null && mois[actif] && (
          <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1 text-[12px] text-white shadow">
            <span className="font-semibold">{formatPrice(mois[actif].inscrits)}</span> inscrit{mois[actif].inscrits > 1 ? 's' : ''} · {libelleLong(mois[actif].mois)}
          </div>
        )}
        <div className="flex items-end gap-1.5 md:gap-3" style={{ height: H + 22 }}>
          {mois.map((m, i) => {
            const h = m.inscrits > 0 ? Math.max(4, Math.round((m.inscrits / max) * H)) : 2
            const dernier = i === mois.length - 1
            const etiquette = m.inscrits > 0 && (i === iMax || dernier)
            return (
              <button
                key={m.mois}
                type="button"
                onMouseEnter={() => setActif(i)}
                onFocus={() => setActif(i)}
                onBlur={() => setActif(null)}
                onClick={() => setActif(actif === i ? null : i)}
                className="group flex min-w-0 flex-1 flex-col items-center justify-end outline-none"
                aria-label={`${libelleLong(m.mois)} : ${formatPrice(m.inscrits)} inscrit${m.inscrits > 1 ? 's' : ''}`}
                style={{ height: H + 22 }}
              >
                <span className={`tnum mb-1 text-[11px] font-semibold leading-none ${etiquette || actif === i ? 'text-ink' : 'text-transparent'}`}>{formatPrice(m.inscrits)}</span>
                <span
                  className={`w-full max-w-[28px] rounded-t transition ${actif === i ? 'bg-primary-700' : m.inscrits > 0 ? 'bg-primary-500' : 'bg-gray-200'} ${dernier ? 'opacity-70' : ''}`}
                  style={{ height: h }}
                />
                <span className={`mt-1.5 truncate text-[10.5px] leading-none ${dernier ? 'font-semibold text-gray-600' : 'text-gray-400'}`}>{libelle(m.mois, i)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------- Les visiteurs hors CI : où l'on regarde sans s'inscrire ----------
function Visiteurs({ visites, visiteursCi, inscrits }: {
  visites: AdminPays['visites']
  visiteursCi: number
  inscrits: AdminPays['pays']
}) {
  const inscritsPar = new Map(inscrits.map((p) => [p.code, p.inscrits]))
  const max = Math.max(1, ...visites.map((v) => v.visiteurs))
  const totalHors = visites.reduce((s, v) => s + v.visiteurs, 0)
  const aConquerir = visites.filter((v) => v.visiteurs >= 5 && !(inscritsPar.get(v.code) ?? 0)).slice(0, 3)

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3">
        <p className="font-display text-base font-bold text-ink">Qui visite depuis l’étranger</p>
        <p className="text-xs text-gray-500">
          Trente derniers jours, d’après l’adresse de connexion. {formatPrice(visiteursCi)} visiteur{visiteursCi > 1 ? 's' : ''} depuis la Côte d’Ivoire sur la même période.
        </p>
      </div>

      {visites.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">Aucune visite venue d’un autre pays sur trente jours.</p>
      ) : (
        <>
          {aConquerir.length > 0 && (
            <div className="mb-3 rounded-xl bg-cream-100/70 px-3 py-2.5 text-[12.5px] leading-snug text-gray-700">
              <span className="font-semibold">Regardent sans s’inscrire :</span>{' '}
              {aConquerir.map((v, i) => (
                <span key={v.code}>
                  {i > 0 ? ', ' : ''}{drapeau(v.code)} {nomPays(v.code)} ({formatPrice(v.visiteurs)})
                </span>
              ))}
              . C’est là qu’une ouverture rapporterait le plus.
            </div>
          )}
          <ul className="space-y-2">
            {visites.map((v) => {
              const n = inscritsPar.get(v.code) ?? 0
              return (
                <li key={v.code}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-gray-800">
                      <span className="mr-1.5" aria-hidden>{drapeau(v.code)}</span>{nomPays(v.code)}
                      {n > 0 && <span className="ml-1.5 text-[11px] font-normal text-gray-400">{formatPrice(n)} inscrit{n > 1 ? 's' : ''}</span>}
                    </span>
                    <span className="tnum shrink-0 text-gray-600">{formatPrice(v.visiteurs)}</span>
                  </div>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full bg-primary-500" style={{ width: `${Math.max(2, (v.visiteurs / max) * 100)}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[11px] text-gray-500">
            {formatPrice(totalHors)} visiteur{totalHors > 1 ? 's' : ''} hors Côte d’Ivoire sur les vingt pays les plus fréquents.
          </p>
        </>
      )}
    </section>
  )
}
