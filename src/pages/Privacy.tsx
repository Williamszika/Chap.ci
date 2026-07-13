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

          <Section title="4. Hébergement et partage avec des tiers">
            <p>
              Vos données sont stockées sur notre <b>propre serveur hébergé en Côte d’Ivoire</b> (hébergeur
              TPE Cloud), dans une base de données sécurisée. Nous <b>ne vendons pas</b> et ne louons pas vos
              données personnelles. Nous recourons à un nombre limité de prestataires :
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1.5">
              <li><b>Notre hébergeur</b> : stockage sécurisé de la base de données et des photos.</li>
              <li><b>Services de géocodage</b> : conversion de coordonnées GPS en nom de lieu (ville, commune).</li>
              <li><b>Service d’emailing</b> : envoi éventuel de la newsletter et des emails du site (si vous y consentez).</li>
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
              Les mots de passe sont <b>chiffrés</b> (hachage bcrypt) et ne sont jamais stockés en clair.
              Les accès aux données sont <b>vérifiés côté serveur</b> à chaque requête (chacun n’accède
              qu’à ses propres données). Les échanges avec le site sont protégés par <b>HTTPS</b>.
            </p>
          </Section>

          <Section title="7. Mineurs">
            <p>
              L’application n’est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas
              sciemment de données de mineurs.
            </p>
          </Section>

          <Section title="8. Vos droits (RGPD)">
            <p>Conformément à la réglementation sur la protection des données, vous disposez des droits suivants :</p>
            <ul className="ml-4 mt-2 list-disc space-y-1.5">
              <li><b>Accès</b> : savoir quelles données nous détenons sur vous.</li>
              <li><b>Rectification</b> : corriger vos informations depuis <i>Compte → Paramètres</i>.</li>
              <li><b>Suppression</b> (« droit à l’oubli ») : supprimer votre compte et toutes vos données.</li>
              <li><b>Opposition</b> : vous désabonner de la newsletter à tout moment.</li>
              <li><b>Portabilité</b> : demander une copie de vos données.</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, utilisez l’application ou écrivez-nous à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a>.
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
