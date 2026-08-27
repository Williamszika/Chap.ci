/**
 * L'interrupteur des réglages — le même dessin partout dans le compte.
 *
 * Un seul fichier pour un seul objet : les favoris, les notifications et
 * l'adresse s'en servent, et aucun des trois n'a besoin d'importer les deux
 * autres pour l'obtenir.
 */
export function Bascule({ active }: { active: boolean }) {
  return (
    <span className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition ${active ? 'bg-ivoire-green' : 'bg-line2'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  )
}

/** Clé du réglage « alerte prix baissé », partagée par Favoris et Notifications. */
export const CLE_ALERTE_PRIX = 'favori_prix'
