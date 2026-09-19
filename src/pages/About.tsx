import { Wordmark } from '../components/Logo'
import { useTraductionPage } from '../lib/langue'
import type { TexteAPropos } from '../i18n/apropos'
import { ChoixLangue } from '../components/ChoixLangue'
import { FONDATEURS, initiales } from '../data/fondateurs'

// « À propos » du modèle artifact : un héro chaleureux + 4 cartes de valeurs.
// Le français vit ici ; les autres langues (`?lang=`, posé par l'application)
// se chargent à la demande depuis src/i18n/apropos.ts — mêmes emojis, textes
// traduits dans le même ordre.
const values = [
  { e: '⚡', t: 'Chap-chap', d: 'Publier et vendre en quelques minutes, sans friction.' },
  { e: '🛡️', t: 'En confiance', d: 'Contacts masqués, avis vérifiés, comptes sécurisés.' },
  { e: '🇨🇮', t: '100 % ivoirien', d: 'Pensé pour la Côte d’Ivoire, ses villes et ses paiements.' },
  { e: '📱', t: 'Mobile Money', d: 'Orange, MTN, Wave, Moov — comme dans la vraie vie.' },
]

export function About() {
  const { t, dir } = useTraductionPage<TexteAPropos>((l) =>
    import('../i18n/apropos').then((m) => m.traductions[l] ?? null),
  )

  return (
    <div className="pb-10" dir={dir}>
      <ChoixLangue />
      {/* Héro « info-hero » — dégradé orange doux, titre display centré */}
      <section className="bg-[linear-gradient(160deg,#FFF6EC,#FFFDF9)] px-5 py-9 text-center md:-mx-6 md:py-14">
        <h1 className="mx-auto max-w-2xl font-display text-[26px] font-extrabold leading-[1.1] tracking-tight text-ink md:text-[34px]">
          <Wordmark />
          {t ? t.titre : ', c’est nous 🧡'}
        </h1>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-[#57534E] md:mt-3">
          {t
            ? t.sous
            : 'La marketplace 100 % ivoirienne qui connecte acheteurs et vendeurs, de Cocody à Korhogo. Vendre chap-chap, en confiance.'}
        </p>
      </section>

      {/* Cartes de valeurs — 2 colonnes sur mobile, 4 sur grand écran */}
      <div className="px-4 md:px-6">
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {values.map((v, i) => (
            <div
              key={v.t}
              className="rounded-[14px] border border-line bg-white p-4 shadow-[0_1px_3px_rgba(60,40,10,0.09),0_1px_2px_rgba(60,40,10,0.05)]"
            >
              <div className="text-[26px] leading-none" aria-hidden>{v.e}</div>
              <p className="mt-2 font-display text-sm font-bold text-ink">{t?.valeurs[i]?.t ?? v.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{t?.valeurs[i]?.d ?? v.d}</p>
            </div>
          ))}
        </div>

        {/* LES FONDATEURS — 19/09/2026.
         *
         * Les noms ne sont pas traduits : un nom de personne est le même dans
         * toutes les langues. Seul le libellé du rôle l'est, et il ne l'est pas
         * encore — `t` ne porte pas ce champ, donc on affiche le français. Une
         * clé ajoutée aux six langues viendra avec les portraits.
         *
         * ⚠️ Cette section a une JUMELLE servie par web/seo.php sur
         * `https://chap.ci/a-propos`, sans `#`. C'est elle que Google lit :
         * celle-ci vit derrière le `#` et reste invisible aux robots. Les deux
         * listes sortent du même fichier de données et `npm run banc:fondateurs`
         * refuse qu'elles s'écartent. */}
        <h2 className="mt-9 font-display text-lg font-bold text-ink">Les fondateurs</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FONDATEURS.map((f) => (
            <div
              key={f.nom}
              className="flex items-center gap-3 rounded-[14px] border border-line bg-white p-4
                         shadow-[0_1px_3px_rgba(60,40,10,0.09),0_1px_2px_rgba(60,40,10,0.05)]"
            >
              {f.photo ? (
                <img
                  src={f.photo}
                  alt={f.nom}
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                /* Pas de portrait livré : une pastille d'initiales, jamais une
                 * image cassée sur la page de ceux qui cherchent qui est
                 * derrière Chap.ci. */
                <div
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full
                             bg-[#FFF1E0] font-display text-lg font-bold text-[#B35700]"
                >
                  {initiales(f.nom)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-[15px] font-bold text-ink">{f.nom}</p>
                <p className="text-[13px] text-gray-500">{f.role} de Chap.ci</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
