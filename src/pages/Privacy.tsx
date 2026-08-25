import { useEffect, useState } from 'react'
import { useTraductionPage } from '../lib/langue'
import { chargerConfidentialite } from '../i18n/confidentialite'
import type { TexteLegal } from '../i18n/legal'

// Adresse de contact affichée dans la politique — à personnaliser si besoin.
const CONTACT_EMAIL = 'contact@chap.ci'
const LAST_UPDATE = '23 juillet 2026'

// Sommaire (ordinateur / tablette) : id d'ancre + libellé court.
const TOC: [string, string][] = [
  ['sec-1', '1. Responsable du traitement'],
  ['sec-2', '2. Données collectées'],
  ['sec-3', '3. Utilisation & consentement'],
  ['sec-4', '4. Localisation'],
  ['sec-5', '5. Hébergement & partage'],
  ['sec-6', '6. Conservation & suppression'],
  ['sec-7', '7. Sécurité'],
  ['sec-8', '8. Mineurs'],
  ['sec-9', '9. Vos droits'],
  ['sec-10', '10. Cadre juridique'],
  ['sec-11', '11. Cookies & pub'],
  ['sec-12', '12. Contact'],
]

export function Privacy() {
  const { t, dir } = useTraductionPage<TexteLegal>(chargerConfidentialite)
  const [active, setActive] = useState('sec-1')

  // Sommaire affiché : titres traduits si `?lang=` est présent — les ancres
  // sec-1 … sec-N, elles, ne changent jamais.
  const toc = t ? t.sections.map((s, i): [string, string] => [`sec-${i + 1}`, s.titre]) : TOC

  // Surligne dans le sommaire la section actuellement à l'écran.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-88px 0px -65% 0px' },
    )
    toc.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
    // Le changement de langue remplace les sections : on se re-lie à elles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  // Défilement doux vers une section (HashRouter : on n'utilise pas d'ancre href).
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen pb-16" dir={dir}>
      {/* En-tête « legal-head » de l'artifact : titre à gauche + filet */}
      <header className="border-b border-line bg-white px-4 pb-4 pt-6 md:-mx-6 md:px-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-[26px]">
          {t ? t.titre : 'RGPD'}
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          {t ? t.sousTitre : <>Comment Chap.ci protège vos données. Mise à jour : {LAST_UPDATE}.</>}
        </p>
      </header>

      {/* Traduction d'information : le droit reste porté par le texte français. */}
      {t && (
        <div className="mx-4 mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-[13px] leading-relaxed text-gray-700 md:mx-6">
          🇫🇷 {t.avis}
        </div>
      )}

      {/* Corps « legal-body » : 960px centré — sommaire-carte + texte (2 colonnes
          dès md) ; sur téléphone, la carte sommaire s'affiche au-dessus du texte. */}
      <div className="mx-auto max-w-[960px] px-4 py-5 md:grid md:grid-cols-[230px_minmax(0,1fr)] md:items-start md:gap-6 md:px-6 md:py-7">
        {/* Sommaire — carte blanche collante (artifact « toc ») */}
        <nav
          aria-label="Sommaire"
          className="mb-5 rounded-[14px] border border-line bg-white p-4 shadow-[0_1px_3px_rgba(60,40,10,0.09),0_1px_2px_rgba(60,40,10,0.05)] md:sticky md:top-20 md:mb-0"
        >
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">{t ? t.sommaire : 'Sommaire'}</p>
          <div className="flex flex-col">
            {toc.map(([id, label]) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`py-1 text-start text-[13px] font-semibold leading-snug transition ${
                  active === id ? 'text-primary-700' : 'text-primary-600/80 hover:text-primary-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenu */}
        <div className="min-w-0">
          {t ? (
            <div className="space-y-5 text-[15px] leading-relaxed text-gray-700">
              <p>{t.intro}</p>
              {t.sections.map((s, i) => (
                <Section key={i} id={`sec-${i + 1}`} title={s.titre}>
                  <p className="whitespace-pre-line">{s.texte}</p>
                </Section>
              ))}
            </div>
          ) : (
            <div className="space-y-5 text-[15px] leading-relaxed text-gray-700">
            <p>
              Chap.ci (« l’application ») est une plateforme de petites annonces en Côte d’Ivoire. La
              présente politique explique quelles données nous collectons, pourquoi, et comment vous
              gardez le contrôle. Elle est établie conformément à la{' '}
              <b>loi ivoirienne n° 2013-450 du 19 juin 2013</b> relative à la protection des données
              à caractère personnel.
            </p>

            <Section id="sec-1" title="1. Responsable du traitement">
              <p>
                Le responsable du traitement des données est <b>Chap.ci</b>, éditeur de la plateforme,
                joignable à{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a>.
                Les traitements de données mis en œuvre par Chap.ci sont soumis à la loi n° 2013-450 et
                aux formalités prévues auprès de l’<b>ARTCI</b> (Autorité de Régulation des
                Télécommunications/TIC de Côte d’Ivoire), autorité de protection des données personnelles.
              </p>
            </Section>

            <Section id="sec-2" title="2. Données que nous collectons">
              <ul className="ml-4 list-disc space-y-1.5">
                <li><b>Compte</b> : prénom, nom, sexe, date de naissance, adresse email et/ou numéro de téléphone, photo de profil (facultative).</li>
                <li><b>Connexion</b> : si vous vous connectez via <b>Google</b>, nous recevons votre email et votre nom depuis votre compte Google ; si vous vous connectez par <b>téléphone</b>, nous utilisons votre numéro et un code de vérification envoyé par SMS.</li>
                <li><b>Localisation</b> : votre position (GPS si vous l’autorisez, sinon estimation par adresse IP) pour afficher les annonces proches et situer vos annonces.</li>
                <li><b>Annonces</b> : titre, description, prix, photos, catégorie et localisation que vous publiez.</li>
                <li><b>Messages</b> : les conversations entre acheteurs et vendeurs via la messagerie, ainsi que vos échanges avec notre équipe d’assistance.</li>
                <li><b>Dernière activité</b> : la date de votre dernier passage sur le site, enregistrée au plus une fois toutes les cinq minutes. Elle sert uniquement à notre équipe de modération, pour savoir si vous êtes joignable avant de vous écrire. <b>Elle n’apparaît sur aucune page publique</b> : les autres utilisateurs ne la voient jamais, ni sur votre profil de vendeur, ni ailleurs.</li>
                <li><b>Notifications sur votre appareil</b> : si — et seulement si — vous les activez, votre navigateur nous remet une adresse technique chez son propre service de notification (Google pour Chrome, Mozilla pour Firefox, Apple pour Safari) et deux clés de chiffrement. Nous conservons aussi un nom d’appareil très général, du type « Chrome sur Android », pour que vous reconnaissiez vos appareils dans votre compte. Le contenu de chaque notification est <b>chiffré pour votre appareil seul</b> : le service qui la transporte ne peut pas la lire. Vous pouvez retirer un appareil à tout moment depuis <i>Mon compte → Notifications</i>, et tout est effacé avec votre compte.</li>
                <li><b>Mesure d’audience</b> : nous comptons les visites de façon <b>anonyme</b> — un identifiant aléatoire dans votre navigateur, sans nom ni e-mail — pour savoir combien de personnes viennent et depuis quel <b>pays et quelle ville</b> (déduits de votre adresse IP par notre hébergeur, au niveau de la ville seulement). Ces chiffres servent uniquement à améliorer le site.</li>
                <li><b>Cookies &amp; outils tiers</b> : avec votre accord (bandeau à votre première visite, refusable à tout moment), nous utilisons des outils de mesure tiers — Meta, TikTok et Google Analytics — qui posent des cookies. <b>Si vous refusez, ils ne se chargent pas</b>, et le site fonctionne normalement.</li>
                <li><b>Usage technique</b> : préférences stockées localement sur votre appareil (favoris, dernière position, conversations lues).</li>
              </ul>
            </Section>

            <Section id="sec-3" title="3. Utilisation des données et consentement">
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Créer et gérer votre compte, publier et afficher des annonces.</li>
                <li>Afficher les annonces proches de vous et calculer les distances.</li>
                <li>Permettre la communication acheteur ↔ vendeur via la messagerie intégrée.</li>
                <li>Assurer la sécurité (authentification, connexion par Google ou par code SMS, double authentification, prévention des abus).</li>
                <li>Vous envoyer la newsletter et des alertes <b>uniquement si vous y avez consenti</b> (désinscription possible à tout moment).</li>
              </ul>
              <p className="mt-2">
                Vos données sont collectées de manière <b>loyale et transparente</b>, pour des finalités
                précises, et ne sont pas réutilisées de façon incompatible avec ces finalités. Nous{' '}
                <b>ne vendons pas</b> vos données personnelles. Les coordonnées des vendeurs ne sont pas
                affichées publiquement : les échanges passent par la messagerie de l’application.
              </p>
              {/* Google Play exige que tout traitement automatise du contenu utilisateur soit
                  annonce dans la politique de confidentialite. L'analyse est locale : c'est
                  precisement ce qui la rend acceptable, donc c'est ce qu'il faut dire en premier. */}
              <p className="mt-3 rounded-xl border border-line bg-cream-100/60 p-3">
                <b>Analyse automatique des photos, sur votre téléphone.</b> Lorsque vous ajoutez une photo à
                une annonce, elle est examinée par un programme de reconnaissance d’images afin d’écarter les
                contenus à caractère sexuel, que nos règles interdisent. Cet examen a lieu{' '}
                <b>entièrement sur votre appareil</b>, avant tout envoi : la photo n’est transmise à aucun
                service extérieur pour être analysée, aucun résultat d’analyse n’est conservé, et rien n’en
                est déduit sur vous. Si une photo est écartée, vous en êtes informé immédiatement et vous
                pouvez en choisir une autre. Le programme de reconnaissance est <b>livré avec
                l’application</b> : il ne va rien chercher sur Internet, et il fonctionne même hors
                connexion.
              </p>
            </Section>

            <Section id="sec-4" title="4. Localisation">
              <p>
                La position sert uniquement à améliorer votre expérience (annonces à proximité, distance).
                Vous pouvez refuser l’accès GPS : l’application utilise alors une localisation approximative
                par IP. Vous pouvez modifier ce choix dans les réglages de votre appareil à tout moment.
              </p>
            </Section>

            <Section id="sec-5" title="5. Hébergement, partage et transferts">
              <p>
                Vos données sont stockées sur notre <b>propre serveur hébergé en Côte d’Ivoire</b> (hébergeur
                TPE Cloud), dans une base de données sécurisée. Nous <b>ne vendons pas</b> et ne louons pas vos
                données personnelles. Nous recourons à un nombre limité de prestataires :
              </p>
              <ul className="ml-4 mt-2 list-disc space-y-1.5">
                <li><b>Notre hébergeur</b> : stockage sécurisé de la base de données et des photos.</li>
                <li><b>Google</b> (Sign-In) : si vous choisissez de vous connecter avec Google, l’authentification est réalisée par Google, qui nous transmet votre email et votre nom.</li>
                <li><b>Fournisseur SMS</b> : envoi du code de vérification lorsque vous vous connectez par téléphone. <i>Ce mode de connexion n’est pas actif aujourd’hui : aucun SMS n’est envoyé.</i></li>
                {/* Nommer ces quatre-là n'est pas une formalité. La loi ivoirienne
                    n° 2013-450 demande que la personne sache À QUI ses données sont
                    transmises — pas seulement qu'elles le sont. « Services de géocodage »
                    ne disait rien, et la position exacte d'une personne n'est pas une
                    donnée moins sensible qu'une photo d'annonce. */}
                <li>
                  <b>Services de géolocalisation</b> : pour convertir vos coordonnées GPS en nom de lieu
                  (ville, commune) et pour estimer votre position à partir de votre adresse IP si vous
                  refusez le GPS. Ces services sont établis hors de Côte d’Ivoire :{' '}
                  <b>BigDataCloud</b>, <b>Nominatim</b> (Fondation OpenStreetMap), <b>ipwho.is</b> et{' '}
                  <b>ipapi.co</b>. Ils reçoivent la coordonnée ou l’adresse IP concernée, et rien d’autre :
                  ni votre nom, ni votre compte, ni vos annonces.
                </li>
                <li><b>Service d’emailing</b> : envoi éventuel de la newsletter et des emails du site (si vous y consentez).</li>
              </ul>
              <p className="mt-2">
                Ces transferts vers des pays tiers sont limités à ce qui est indispensable au
                fonctionnement du service, et réalisés dans le respect des conditions prévues par la loi
                n° 2013-450 (niveau de protection suffisant et, le cas échéant, autorisation de l’ARTCI).
                <b> Vos données de compte, vos annonces, vos photos et vos messages, eux, ne quittent pas
                la Côte d’Ivoire.</b>
              </p>
            </Section>

            <Section id="sec-6" title="6. Conservation et suppression">
              <p>
                Vos données sont conservées tant que votre compte est actif, et pas au-delà de la durée
                nécessaire aux finalités pour lesquelles elles ont été collectées. Vous pouvez{' '}
                <b>supprimer votre compte à tout moment</b> depuis <i>Compte → Paramètres → Supprimer
                mon compte</i>. La suppression efface définitivement votre profil, vos annonces, vos
                commandes, vos messages et vos avis.
              </p>
              <p className="mt-3">
                Deux catégories survivent temporairement à la suppression, avec des durées précises :
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  les <b>journaux techniques de sécurité</b> (adresses IP, tentatives de connexion),
                  effacés automatiquement au bout de <b>6 mois</b> — ils servent à détecter les
                  attaques et les tentatives de fraude, et peuvent être requis par la justice ;
                </li>
                <li>
                  les <b>statistiques de fréquentation anonymes</b>, effacées au bout de{' '}
                  <b>4 mois</b> — elles ne permettent pas de vous identifier.
                </li>
              </ul>
              <p className="mt-3">
                Ces deux purges sont automatiques et quotidiennes. Vous pouvez aussi demander la
                suppression <a href="#/suppression-compte" className="font-semibold text-primary-600 underline underline-offset-2">depuis
                cette page</a>, sans être connecté.
              </p>
            </Section>

            <Section id="sec-7" title="7. Sécurité">
              <p>
                Les mots de passe sont <b>chiffrés</b> (hachage bcrypt) et ne sont jamais stockés en clair.
                Les codes de vérification par SMS sont <b>à usage unique</b>, à durée de vie limitée et
                stockés sous forme chiffrée. Les accès aux données sont <b>vérifiés côté serveur</b> à
                chaque requête (chacun n’accède qu’à ses propres données). Les échanges avec le site sont
                protégés par <b>HTTPS</b>. Nous prenons les mesures techniques et organisationnelles
                raisonnables pour préserver la confidentialité et l’intégrité de vos données, conformément
                à la loi n° 2013-450.
              </p>
            </Section>

            <Section id="sec-8" title="8. Mineurs">
              <p>
                L’application n’est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas
                sciemment de données de mineurs.
              </p>
            </Section>

            <Section id="sec-9" title="9. Vos droits (loi n° 2013-450)">
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

            <Section id="sec-10" title="10. Cadre juridique">
              <p>Cette politique s’inscrit dans le cadre des textes suivants :</p>
              <ul className="ml-4 mt-2 list-disc space-y-1.5">
                <li><b>Loi n° 2013-450 du 19 juin 2013</b> relative à la protection des données à caractère personnel ;</li>
                <li><b>Loi n° 2013-451 du 19 juin 2013</b> relative à la lutte contre la cybercriminalité, telle que modifiée par la loi n° 2023-593 du 7 juin 2023 ;</li>
                <li><b>Loi n° 2013-546 du 30 juillet 2013</b> relative aux transactions électroniques ;</li>
                <li><b>Acte additionnel A/SA.1/01/10 de la CEDEAO</b> relatif à la protection des données à caractère personnel ;</li>
                <li>Réglementation de l’<b>ARTCI</b> applicable aux traitements de données.</li>
              </ul>
            </Section>

            <Section id="sec-11" title="11. Cookies et mesure publicitaire">
              <p>
                Sur le site web <b>chap.ci</b>, en plus des cookies strictement nécessaires au
                fonctionnement (connexion, préférences), nous utilisons des outils de mesure
                d’audience et de publicité qui déposent des cookies ou identifiants :
              </p>
              <ul className="ml-4 mt-2 list-disc space-y-1.5">
                <li><b>Google Analytics</b> — mesure de la fréquentation (pages vues, provenance des visites) ;</li>
                <li>
                  <b>Meta Pixel</b> (Facebook / Instagram) et <b>TikTok Pixel</b> — mesure de
                  l’efficacité de nos publicités et affichage d’annonces pertinentes sur ces réseaux.
                </li>
              </ul>
              <p className="mt-2">
                À cette occasion, certaines données de navigation (pages visitées, actions comme une
                inscription ou la publication d’une annonce) peuvent être partagées avec <b>Google</b>,
                <b> Meta</b> et <b>TikTok</b>, qui les traitent selon leurs propres règles de
                confidentialité. Aucune donnée n’est vendue.
              </p>
              <p className="mt-2">
                <b>Vos choix :</b> vous pouvez refuser ou limiter ces traceurs à tout moment — en
                bloquant les cookies dans votre navigateur, via les paramètres de publicité de chaque
                plateforme (Google, Meta, TikTok), ou en activant « Limiter le suivi publicitaire »
                dans les réglages de votre téléphone. Le refus n’empêche pas d’utiliser Chap.ci. Ces
                traceurs ne sont pas actifs dans l’application mobile.
              </p>
            </Section>

            <Section id="sec-12" title="12. Contact">
              <p>
                Pour toute question relative à cette politique :{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-1.5 font-display text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}
