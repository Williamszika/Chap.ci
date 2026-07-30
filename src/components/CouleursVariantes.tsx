// =============================================================================
//  Couleurs de l'annonce — et, pour chaque couleur cochée, SA variante.
//
//  Le vendeur qui a le même téléphone en noir et en bleu ne publie qu'une
//  annonce : il coche les deux couleurs, puis donne à chacune sa photo, son
//  prix et ses détails. Tout est facultatif — cocher la couleur seule reste
//  possible et suffisant.
//
//  La photo n'est pas re-téléversée : la couleur POINTE vers l'une des photos
//  de l'annonce (var_<Couleur>_photo garde son index). C'est la même galerie,
//  simplement étiquetée — et sur la fiche, toucher la couleur y mènera.
// =============================================================================
import { Check, ImageOff } from 'lucide-react'
import { mediaUrl } from '../lib/native'
import { COULEURS, cleVariante, lireCouleurs } from '../data/couleurs'

export function CouleursVariantes({
  attrs,
  setAttr,
  images,
  help,
}: {
  attrs: Record<string, string>
  setAttr: (k: string, v: string) => void
  images: string[]
  help?: string
}) {
  const choisis = lireCouleurs(attrs.couleurs)
  const noms = choisis.map((c) => c.nom)

  function basculer(nom: string) {
    if (noms.includes(nom)) {
      // Décochée : ses détails n'ont plus de raison d'être. Les laisser
      // traîner ferait réapparaître un vieux prix si on la recoche plus tard.
      setAttr(cleVariante(nom, 'photo'), '')
      setAttr(cleVariante(nom, 'prix'), '')
      setAttr(cleVariante(nom, 'note'), '')
      setAttr('couleurs', noms.filter((x) => x !== nom).join(', '))
    } else {
      setAttr('couleurs', [...noms, nom].join(', '))
    }
  }

  return (
    <div className="space-y-3">
      {help && <p className="-mt-1 text-xs text-gray-500">{help}</p>}

      {/* Les pastilles : cocher les couleurs disponibles */}
      <div className="flex flex-wrap gap-2">
        {COULEURS.map((c) => (
          <button
            key={c.nom}
            type="button"
            aria-pressed={noms.includes(c.nom)}
            onClick={() => basculer(c.nom)}
            className={`chip flex items-center gap-1.5 ${noms.includes(c.nom) ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
          >
            <span
              aria-hidden="true"
              className={`h-3.5 w-3.5 shrink-0 rounded-full ${c.clair ? 'ring-1 ring-inset ring-black/20' : ''}`}
              style={{ background: c.css }}
            />
            {c.nom}
          </button>
        ))}
      </div>

      {/* Une carte par couleur cochée : sa photo, son prix, ses détails */}
      {choisis.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs text-gray-500">
            Facultatif : donnez à chaque couleur <b className="font-semibold text-gray-600">sa photo, son prix et ses
            détails</b>. Sans rien préciser, la couleur reprend le prix et les photos de l’annonce.
          </p>
          {choisis.map((c) => {
            const kPhoto = cleVariante(c.nom, 'photo')
            const idxPhoto = /^\d+$/.test(attrs[kPhoto] ?? '') ? Number(attrs[kPhoto]) : null
            return (
              <div key={c.nom} className="space-y-2.5 rounded-xl border border-line2 bg-cream-100/50 p-3">
                <p className="flex items-center gap-2 text-[13.5px] font-bold text-gray-800">
                  <span
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 rounded-full ${c.clair ? 'ring-1 ring-inset ring-black/20' : ''}`}
                    style={{ background: c.css }}
                  />
                  {c.nom}
                </p>

                {/* La photo de cette couleur : on désigne l'une des photos de l'annonce */}
                {images.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {images.map((src, i) => {
                      const on = idxPhoto === i
                      return (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={on}
                          aria-label={`Photo ${i + 1} pour ${c.nom}`}
                          onClick={() => setAttr(kPhoto, on ? '' : String(i))}
                          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border transition ${
                            on ? 'border-primary-500 ring-2 ring-primary-500' : 'border-line2 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
                          {on && (
                            <span className="absolute inset-0 grid place-items-center bg-primary-500/30">
                              <Check size={16} strokeWidth={3} className="text-white drop-shadow" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                    <span className="text-[11.5px] text-gray-500">
                      {idxPhoto !== null ? `Photo ${idxPhoto + 1} liée` : 'Touchez la photo qui montre cette couleur'}
                    </span>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-[11.5px] text-gray-400">
                    <ImageOff size={13} /> Ajoutez d’abord vos photos en haut du formulaire, puis liez ici celle de cette couleur.
                  </p>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="relative">
                    <input
                      value={attrs[cleVariante(c.nom, 'prix')] ?? ''}
                      inputMode="numeric"
                      onChange={(e) => setAttr(cleVariante(c.nom, 'prix'), e.target.value.replace(/\D/g, ''))}
                      placeholder="Prix de cette couleur"
                      aria-label={`Prix pour ${c.nom} (FCFA)`}
                      className="input pr-14"
                      maxLength={12}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      FCFA
                    </span>
                  </div>
                  <input
                    value={attrs[cleVariante(c.nom, 'note')] ?? ''}
                    onChange={(e) => setAttr(cleVariante(c.nom, 'note'), e.target.value)}
                    placeholder="Détails — Ex : 128 Go, dernière pièce"
                    aria-label={`Détails pour ${c.nom}`}
                    className="input"
                    maxLength={100}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
