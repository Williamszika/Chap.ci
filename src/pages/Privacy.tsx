import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'

// Adresse de contact affichée dans la politique — à personnaliser si besoin.
const CONTACT_EMAIL = 'contact@chap.ci'
const LAST_UPDATE = '14 juillet 2026'

export function Privacy() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white pb-16 md:mx-auto md:max-w-3xl">
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
            gardez le contrôle. Elle est établie conformément à la{' '}
            <b>loi ivoirienne n° 2013-450 du 19 juin 2013</b> relative à la protection des données
            à caractère personnel.
          </p>

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données est <b>Chap.ci</b>, éditeur de la plateforme,
              joignable à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a>.
              Les traitements de données mis en œuvre par Chap.ci sont soumis à la loi n° 2013-450 et
              aux formalités prévues auprès de l’<b>ARTCI</b> (Autorité de Régulation des
              Télécommunications/TIC de Côte d’Ivoire), autorité de protection des données personnelles.
            </p>
          </Section>

          <Section title="2. Données que nous collectons">
            <ul className="ml-4 list-disc space-y-1.5">
              <li><b>Compte</b> : prénom, nom, sexe, date de naissance, adresse email et/ou numéro de téléphone, photo de profil (facultative).</li>
              <li><b>Localisation</b> : votre position (GPS si vous l’autorisez, sinon estimation par adresse IP) pour afficher les annonces proches et situer vos annonces.</li>
              <li><b>Annonces</b> : titre, description, prix, photos, catégorie et localisation que vous publiez.</li>
              <li><b>Messages</b> : les conversations entre acheteurs et vendeurs via la messagerie.</li>
              <li><b>Usage technique</b> : préférences stockées localement sur votre appareil (favoris, dernière position, conversations lues).</li>
            </ul>
          </Section>

          <Section title="3. Utilisation des données et consentement">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Créer et gérer votre compte, publier et afficher des annonces.</li>
              <li>Afficher les annonces proches de vous et calculer les distances.</li>
              <li>Permettre la communication acheteur ↔ vendeur via la messagerie intégrée.</li>
              <li>Assurer la sécurité (authentification, double authentification, prévention des abus).</li>
              <li>Vous envoyer la newsletter et des alertes <b>uniquement si vous y avez consenti</b> (désinscription possible à tout moment).</li>
            </ul>
            <p className="mt-2">
              Vos données sont collectées de manière <b>loyale et transparente</b>, pour des finalités
              précises, et ne sont pas réutilisées de façon incompatible avec ces finalités. Nous{' '}
              <b>ne vendons pas</b> vos données personnelles. Les coordonnées des vendeurs ne sont pas
              affichées publiquement : les échanges passent par la messagerie de l’application.
            </p>
          </Section>

          <Section title="4. Localisation">
            <p>
              La position sert uniquement à améliorer votre expérience (annonces à proximité, distance).
              Vous pouvez refuser l’accès GPS : l’application utilise alors une localisation approximative
              par IP. Vous pouvez modifier ce choix dans les réglages de votre appareil à tout moment.
            </p>
          </Section>

          <Section title="5. Hébergement, partage et transferts">
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
            <p className="mt-2">
              Tout transfert éventuel de données vers un pays tiers ne serait réalisé que dans le respect
              des conditions prévues par la loi n° 2013-450 (niveau de protection suffisant et, le cas
              échéant, autorisation de l’ARTCI).
            </p>
          </Section>

          <Section title="6. Conservation et suppression">
            <p>
              Vos données sont conservées tant que votre compte est actif, et pas au-delà de la durée
              nécessaire aux finalités pour lesquelles elles ont été collectées. Vous pouvez{' '}
              <b>supprimer votre compte à tout moment</b> depuis <i>Compte → Paramètres → Supprimer
              mon compte</i>. La suppression efface définitivement votre profil, vos annonces, vos
              commandes, vos messages et vos avis. Certaines données peuvent toutefois être conservées
              temporairement lorsque la loi l’exige (par exemple à des fins de preuve, de lutte contre
              la fraude ou de réquisition judiciaire).
            </p>
          </Section>

          <Section title="7. Sécurité">
            <p>
              Les mots de passe sont <b>chiffrés</b> (hachage bcrypt) et ne sont jamais stockés en clair.
              Les accès aux données sont <b>vérifiés côté serveur</b> à chaque requête (chacun n’accède
              qu’à ses propres données). Les échanges avec le site sont protégés par <b>HTTPS</b>. Nous
              prenons les mesures techniques et organisationnelles raisonnables pour préserver la
              confidentialité et l’intégrité de vos données, conformément à la loi n° 2013-450.
            </p>
          </Section>

          <Section title="8. Mineurs">
            <p>
              L’application n’est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas
              sciemment de données de mineurs.
            </p>
          </Section>

          <Section title="9. Vos droits (loi n° 2013-450)">
            <p>
              Conformément à la loi ivoirienne n° 2013-450 relative à la protection des données à
              caractère personnel, vous disposez des droits suivants :
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1.5">
              <li><b>Information</b> : savoir comment et pourquoi vos données sont traitées (la présente politique).</li>
              <li><b>Accès</b> : savoir quelles données nous détenons sur vous et en obtenir copie.</li>
              <li><b>Rectification</b> : corriger vos informations depuis <i>Compte → Paramètres</i> ou sur demande.</li>
              <li><b>Suppression</b> : supprimer votre compte et toutes vos données.</li>
              <li><b>Opposition</b> : vous opposer, pour un motif légitime, à un traitement ; vous désabonner de la newsletter à tout moment.</li>
              <li><b>Portabilité</b> (engagement volontaire) : demander une copie de vos données dans un format lisible.</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, utilisez l’application ou écrivez-nous à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a>.
              Nous répondons dans les meilleurs délais. Si vous estimez que vos droits ne sont pas
              respectés, vous pouvez saisir l’<b>ARTCI</b> (
              <a href="https://www.artci.ci" target="_blank" rel="noreferrer" className="font-semibold text-primary-600">artci.ci</a>
              ), autorité de protection des données personnelles en Côte d’Ivoire.
            </p>
          </Section>

          <Section title="10. Cadre juridique">
            <p>Cette politique s’inscrit dans le cadre des textes suivants :</p>
            <ul className="ml-4 mt-2 list-disc space-y-1.5">
              <li><b>Loi n° 2013-450 du 19 juin 2013</b> relative à la protection des données à caractère personnel ;</li>
              <li><b>Loi n° 2013-451 du 19 juin 2013</b> relative à la lutte contre la cybercriminalité, telle que modifiée par la loi n° 2023-593 du 7 juin 2023 ;</li>
              <li><b>Loi n° 2013-546 du 30 juillet 2013</b> relative aux transactions électroniques ;</li>
              <li><b>Acte additionnel A/SA.1/01/10 de la CEDEAO</b> relatif à la protection des données à caractère personnel ;</li>
              <li>Réglementation de l’<b>ARTCI</b> applicable aux traitements de données.</li>
            </ul>
          </Section>

          <Section title="11. Contact">
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
