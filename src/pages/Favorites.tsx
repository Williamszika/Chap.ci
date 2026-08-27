import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, Loader2, TrendingDown, X } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { isPhp } from '../lib/backend'
import { mediaUrl, thumbUrl } from '../lib/native'
import { formatFCFA } from '../lib/format'
import {
  phpFavorisDetail, phpReglagesNotifs, phpEnregistrerReglagesNotifs,
  type FavoriDetail,
} from '../lib/php'
import { ListingCard } from '../components/ListingCard'
import { Bascule, CLE_ALERTE_PRIX } from '../components/Bascule'

/**
 * « Mes favoris » — ce que le professionnel surveille (maquette validée le 27/08).
 *
 * Un favori n'est pas qu'un signet : c'est une veille. Le prix qui baisse, le
 * lot qui repart, le fournisseur qui vend enfin. La liste dit donc ce qui a
 * CHANGÉ depuis l'enregistrement — sans le prix d'alors, « prix baissé » ne
 * serait qu'une impression.
 */

type Filtre = 'tous' | 'baisse' | 'dispo'

export function Favorites() {
  const { user } = useAuth()
  const { listings, favorites, toggleFavorite } = useApp()
  const [detail, setDetail] = useState<FavoriDetail[] | null>(null)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [alerte, setAlerte] = useState(true)

  useEffect(() => {
    if (!isPhp || !user) { setDetail([]); return }
    let actif = true
    phpFavorisDetail().then((d) => actif && setDetail(d)).catch(() => actif && setDetail([]))
    phpReglagesNotifs()
      .then((r) => actif && setAlerte(r[CLE_ALERTE_PRIX] !== false))
      .catch(() => {})
    return () => { actif = false }
  }, [user, favorites.length])

  const basculerAlerte = async () => {
    const v = !alerte
    setAlerte(v)
    try {
      const r = await phpReglagesNotifs()
      await phpEnregistrerReglagesNotifs({ ...r, [CLE_ALERTE_PRIX]: v })
    } catch { setAlerte(!v) }
  }

  // Une baisse : le prix affiché est passé sous celui retenu à l'enregistrement.
  const baisse = (f: FavoriDetail) =>
    f.prixAlors !== null && f.prixAlors > 0 && f.prix < f.prixAlors && !f.vendue

  const compte = useMemo(() => ({
    tous: detail?.length ?? 0,
    baisse: detail?.filter(baisse).length ?? 0,
    dispo: detail?.filter((f) => !f.vendue && !f.retiree).length ?? 0,
  }), [detail])

  const liste = useMemo(() => {
    if (!detail) return []
    // Les baisses de prix d'abord : c'est l'information qui périme.
    const tri = [...detail].sort((a, b) => (baisse(b) ? 1 : 0) - (baisse(a) ? 1 : 0))
    if (filtre === 'baisse') return tri.filter(baisse)
    if (filtre === 'dispo') return tri.filter((f) => !f.vendue && !f.retiree)
    return tri
  }, [detail, filtre])

  // Hors backend PHP (mode local), on retombe sur l'ancienne grille de cartes :
  // sans le prix d'alors, la veille n'a rien à dire.
  if (!isPhp) {
    const favListings = favorites
      .map((id) => listings.find((l) => l.id === id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l))
    return (
      <div className="min-h-screen">
        <Entete n={favListings.length} />
        {favListings.length === 0 ? <Vide /> : (
          <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-3 md:gap-4 md:px-6 lg:grid-cols-4 lg:gap-5">
            {favListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    )
  }

  if (detail === null) {
    return <div className="grid min-h-[50vh] place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
  }

  return (
    <div className="min-h-screen">
      <Entete n={compte.tous} />

      {compte.tous === 0 ? <Vide /> : (
        <div className="space-y-3 px-4 pb-6 md:px-6">
          {/* Filtrer — « prix baissé » en premier, c'est ce qu'on vient voir. */}
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            <button onClick={() => setFiltre('tous')}
              className={`chip-etat ${filtre === 'tous' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
              Tous · {compte.tous}
            </button>
            {compte.baisse > 0 && (
              <button onClick={() => setFiltre('baisse')}
                className={`chip-etat ${filtre === 'baisse' ? 'bg-ivoire-green text-white' : 'bg-ivoire-green/10 text-ivoire-green-dark ring-1 ring-ivoire-green/25'}`}>
                Prix baissé · {compte.baisse}
              </button>
            )}
            <button onClick={() => setFiltre('dispo')}
              className={`chip-etat ${filtre === 'dispo' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
              Encore dispo
            </button>
          </div>

          {liste.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-gray-600 shadow-card">
              {filtre === 'baisse' ? 'Aucun prix n’a baissé pour l’instant.' : 'Rien dans cette catégorie.'}
            </div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              {liste.map((f) => {
                const enBaisse = baisse(f)
                const remise = enBaisse && f.prixAlors
                  ? Math.round(((f.prixAlors - f.prix) / f.prixAlors) * 100) : 0
                return (
                  <div key={f.listingId} className="flex items-center gap-3 p-3">
                    <Link to={`/annonce/${f.listingId}`} className="shrink-0">
                      {f.image ? (
                        <img src={mediaUrl(thumbUrl(f.image))} alt=""
                          className={`h-12 w-16 rounded-xl border border-line object-cover ${f.vendue ? 'opacity-40' : ''}`} />
                      ) : (
                        <span className="grid h-12 w-16 place-items-center rounded-xl bg-cream-100 text-lg">🏷️</span>
                      )}
                    </Link>
                    <Link to={`/annonce/${f.listingId}`} className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-ink">{f.titre}</p>
                      {/* Une seule ligne, sans retour : « Prix baissé » se
                          lit déjà dans la pastille verte à droite. */}
                      {enBaisse && f.prixAlors ? (
                        <p className="flex items-center gap-1 truncate text-[11.5px] font-semibold text-ivoire-green-dark">
                          <TrendingDown size={12} className="shrink-0" />
                          <s className="opacity-60">{formatFCFA(f.prixAlors)}</s>
                          <span className="whitespace-nowrap">→ {formatFCFA(f.prix)}</span>
                        </p>
                      ) : f.vendue ? (
                        <p className="truncate text-[11.5px] text-gray-400">Vendue — à retirer ?</p>
                      ) : f.retiree ? (
                        <p className="truncate text-[11.5px] text-gray-400">Retirée par le vendeur</p>
                      ) : (
                        <p className="truncate text-[11.5px] text-gray-500">
                          {formatFCFA(f.prix)}{f.commune ? ` · ${f.commune}` : ''}
                        </p>
                      )}
                    </Link>
                    {enBaisse ? (
                      <span className="shrink-0 rounded-md bg-ivoire-green/10 px-2 py-1 text-[10px] font-extrabold text-ivoire-green-dark">
                        −{remise} %
                      </span>
                    ) : f.vendue ? (
                      <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-extrabold text-gray-500">
                        Vendue
                      </span>
                    ) : null}
                    <button onClick={() => toggleFavorite(f.listingId)}
                      aria-label="Retirer des favoris"
                      className="shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-cream-100 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* PRÉVENEZ-MOI — l'alerte qui fait revenir. */}
          <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5">
            <p className="flex items-center gap-1.5 font-display text-[13.5px] font-extrabold text-ink">
              <Bell size={15} className="text-primary-600" /> Prévenez-moi
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">
              Quand un favori baisse de prix ou repasse en ligne.
            </p>
            <button onClick={basculerAlerte}
              className="mt-2.5 flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-line">
              <Bascule active={alerte} />
              <span className="text-[12.5px] font-bold text-gray-700">Alerte prix baissé</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Entete({ n }: { n: number }) {
  return (
    <header className="safe-top px-4 pb-3 pt-5 md:px-6 md:pt-7">
      <h1 className="font-display text-2xl font-extrabold text-gray-900 md:text-[28px]">Mes favoris</h1>
      <p className="mt-0.5 text-sm text-gray-500">
        {n} annonce{n > 1 ? 's' : ''} surveillée{n > 1 ? 's' : ''}
      </p>
    </header>
  )
}

function Vide() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-red-50">
        <Heart size={36} className="text-red-400" />
      </div>
      <p className="text-lg font-bold text-gray-800">Aucun favori pour l’instant</p>
      <p className="max-w-xs text-sm text-gray-500">
        Appuyez sur le ❤️ des annonces qui vous intéressent pour les retrouver ici.
      </p>
      <Link to="/explorer" className="btn-primary mt-2">Explorer les annonces</Link>
    </div>
  )
}
