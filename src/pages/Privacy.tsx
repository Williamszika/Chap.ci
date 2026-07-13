import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'

// Adresse de contact affichée dans la politique — à personnaliser si besoin.
const CONTACT_EMAIL = 'contact@chap.ci'
const LAST_UPDATE = '12 juillet 2026'

export function Privacy() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Confidentialité</h1>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <Mark size={48} />
          <Wordmark className="mt-2 text-xl text-ink" />
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <ShieldCheck size={16} /> Politique de confidentialité
          </p>
          <p className="text-xs text-gray-400">Dernière mise à jour : {LAST_UPDATE}</p>
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed text-gray-700">
          <p>
            Chap.ci (« l’application ») est une plateforme de petites annonces en Côte d’Ivoire. La
            présente politique explique quelles données nous collectons, pourquoi, et comment vous
            gardez le contrôle.
          </p>

          <Section title="1. Données que nous collectons">
            <ul className="ml-4 list-disc space-y-1.5">
              <li><b>Compte</b> : prénom, nom, sexe, date de naissance, adresse email et/ou numéro de téléphone, photo de profil (facultative).</li>
              <li><b>Localisation</b> : votre position (GPS si vous l’autorisez, sinon estimation par adresse IP) pour afficher les annonces proches et situer vos annonces.</li>
              <li><b>Annonces</b> : titre, description, prix, photos, catégorie et localisation que vous publiez.</li>
              <li><b>Messages</b> : les conversations entre acheteurs et vendeurs via la messagerie.</li>
              <li><b>Usage technique</b> : préférences stockées localement sur votre appareil (favoris, dernière position, conversations lues).</li>
            </ul>
          </Section>

          <Section title="2. Utilisation des données">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Créer et gérer votre compte, publier et afficher des annonces.</li>
              <li>Afficher les annonces proches de vous et calculer les distances.</li>
              <li>Permettre la communication acheteur ↔ vendeur via la messagerie intégrée.</li>
              <li>Assurer la sécurité (authentification, double authentification, prévention des abus).</li>
            </ul>
            <p className="mt-2">
              Nous ne vendons pas vos données personnelles. Les coordonnées des vendeurs ne sont pas
              affichées publiquement : les échanges passent par la messagerie de l’application.
            </p>
          </Section>

          <Section title="3. Localisation">
            <p>
              La position sert uniquement à améliorer votre expérience (annonces à proximité, distance).
              Vous pouvez refuser l’accès GPS : l’application utilise alors une localisation approximative
              par IP. Vous pouvez modifier ce choix dans les réglages de votre appareil à tout moment.
            </p>
          </Section>

          <Section title="4. Partage avec des tiers">
            <ul className="ml-4 list-disc space-y-1.5">
              <li><b>Supabase</b> : hébergement sécurisé de la base de données et de l’authentification.</li>
              <li><b>Google / Apple</b> : uniquement si vous choisissez de vous connecter avec ces services (nom et email transmis pour créer le compte).</li>
              <li><b>Services de géocodage</b> : conversion de coordonnées en nom de lieu (ville, commune).</li>
            </ul>
            <p className="mt-2">Ces prestataires sont soumis à leurs propres politiques de confidentialité.</p>
          </Section>

          <Section title="5. Conservation et suppression">
            <p>
              Vos données sont conservées tant que votre compte est actif. Vous pouvez{' '}
              <b>supprimer votre compte à tout moment</b> depuis <i>Compte → Paramètres → Supprimer
              mon compte</i>. La suppression efface définitivement votre profil, vos annonces, vos
              commandes, vos messages et vos avis.
            </p>
          </Section>

          <Section title="6. Sécurité">
            <p>
              Les mots de passe sont chiffrés, les accès aux données protégés par des règles de sécurité
              (RLS) côté serveur, et la double authentification (2FA) est disponible pour renforcer la
              protection de votre compte.
            </p>
          </Section>

          <Section title="7. Mineurs">
            <p>
              L’application n’est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas
              sciemment de données de mineurs.
            </p>
          </Section>

          <Section title="8. Vos droits">
            <p>
              Vous pouvez consulter, corriger ou supprimer vos données à tout moment depuis
              l’application, ou nous contacter pour toute demande.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Pour toute question relative à cette politique :{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 font-display text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}
