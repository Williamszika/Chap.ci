/**
 * Carte-squelette affichée pendant le chargement des annonces.
 * Reprend exactement la silhouette de <ListingCard> (image 4/3, prix, titre,
 * lieu) pour éviter tout saut de mise en page. L'effet `animate-pulse` est
 * neutralisé automatiquement par prefers-reduced-motion (règle globale index.css).
 */
export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="space-y-2 p-2.5">
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}
