import type { TexteLegal } from '../legal'

export const politique: TexteLegal = {
  titre: 'Privacy Policy',
  sousTitre: 'How Chap.ci protects your data. Last updated: 23 July 2026.',
  avis: 'This translation is provided for information only. In the event of any discrepancy, only the French version is authoritative.',
  sommaire: 'Contents',
  intro:
    'Chap.ci (“the application”) is a classifieds platform in Côte d’Ivoire. This policy explains what data we collect, why, and how you stay in control. It is drawn up in accordance with Ivorian Law No. 2013-450 of 19 June 2013 on the protection of personal data.',
  sections: [
    {
      titre: '1. Data controller',
      texte: `The data controller is Chap.ci, publisher of the platform, reachable at contact@chap.ci. The data processing carried out by Chap.ci is subject to Law No. 2013-450 and to the formalities required by the ARTCI (Côte d’Ivoire’s Telecommunications/ICT Regulatory Authority), the personal-data protection authority.`,
    },
    {
      titre: '2. Data we collect',
      texte: `• Account: first name, last name, gender, date of birth, email address and/or phone number, profile photo (optional).
• Sign-in: if you sign in with Google, we receive your email and name from your Google account; if you sign in by phone, we use your number and a verification code sent by SMS.
• Location: your position (GPS if you allow it, otherwise an estimate from your IP address) to show nearby listings and to place your own listings.
• Listings: the title, description, price, photos, category and location you publish.
• Messages: the conversations between buyers and sellers through the messaging, as well as your exchanges with our support team.
• Last activity: the date of your last visit to the site, recorded at most once every five minutes. It is used only by our moderation team, to know whether you are reachable before writing to you. It appears on no public page: other users never see it, neither on your seller profile nor anywhere else.
• Notifications on your device: if — and only if — you turn them on, your browser gives us a technical address at its own notification service (Google for Chrome, Mozilla for Firefox, Apple for Safari) and two encryption keys. We also keep a very general device name, such as “Chrome on Android”, so you can recognise your devices in your account. The content of each notification is encrypted for your device alone: the service that transports it cannot read it. You can remove a device at any time from My account → Notifications, and everything is erased with your account.
• Audience measurement: we count visits anonymously — a random identifier in your browser, with no name or email — to know how many people come and from which country and city (deduced from your IP address by our host, at city level only). These figures are used solely to improve the site.
• Cookies & third-party tools: with your consent (a banner on your first visit, refusable at any time), we use third-party measurement tools — Meta, TikTok and Google Analytics — which set cookies. If you refuse, they are not loaded, and the site works normally.
• Technical usage: preferences stored locally on your device (favourites, last position, read conversations).`,
    },
    {
      titre: '3. How data is used, and consent',
      texte: `• Creating and managing your account, publishing and displaying listings.
• Showing listings near you and calculating distances.
• Enabling buyer ↔ seller communication through the built-in messaging.
• Keeping the service secure (authentication, sign-in with Google or by SMS code, two-factor authentication, abuse prevention).
• Sending you the newsletter and alerts only if you have consented (you can unsubscribe at any time).

Your data is collected fairly and transparently, for specific purposes, and is not reused in a way incompatible with those purposes. We do not sell your personal data. Sellers’ contact details are not displayed publicly: exchanges go through the application’s messaging.

Automatic photo analysis, on your phone. When you add a photo to a listing, it is examined by an image-recognition program in order to filter out sexual content, which our rules prohibit. This examination takes place entirely on your device, before anything is sent: the photo is not transmitted to any external service for analysis, no analysis result is kept, and nothing about you is inferred from it. If a photo is rejected, you are informed immediately and can choose another one. The recognition program ships with the application: it fetches nothing from the Internet and works even offline.`,
    },
    {
      titre: '4. Location',
      texte: `Your position is used only to improve your experience (nearby listings, distances). You can refuse GPS access: the application then uses an approximate location based on your IP address. You can change this choice in your device’s settings at any time.`,
    },
    {
      titre: '5. Hosting, sharing and transfers',
      texte: `Your data is stored on our own server hosted in Côte d’Ivoire (host: TPE Cloud), in a secured database. We do not sell and do not rent your personal data. We rely on a limited number of providers:

• Our host: secure storage of the database and photos.
• Google (Sign-In): if you choose to sign in with Google, authentication is performed by Google, which passes us your email and name.
• SMS provider: sending the verification code when you sign in by phone. This sign-in method is not active today: no SMS is sent.
• Geolocation services: to convert your GPS coordinates into a place name (city, commune) and to estimate your position from your IP address if you refuse GPS. These services are established outside Côte d’Ivoire: BigDataCloud, Nominatim (OpenStreetMap Foundation), ipwho.is and ipapi.co. They receive the coordinate or IP address concerned, and nothing else: neither your name, nor your account, nor your listings.
• Emailing service: sending the newsletter and the site’s emails, if you consent to them.

These transfers to third countries are limited to what is strictly necessary for the service to work, and carried out in compliance with the conditions set by Law No. 2013-450 (an adequate level of protection and, where applicable, ARTCI authorisation). Your account data, your listings, your photos and your messages, for their part, do not leave Côte d’Ivoire.`,
    },
    {
      titre: '6. Retention and deletion',
      texte: `Your data is kept as long as your account is active, and no longer than necessary for the purposes for which it was collected. You can delete your account at any time from Account → Settings → Delete my account. Deletion permanently erases your profile, your listings, your orders, your messages and your reviews.

Two categories temporarily survive deletion, with precise durations:

• technical security logs (IP addresses, sign-in attempts), automatically erased after 6 months — they serve to detect attacks and fraud attempts, and may be required by the courts;
• anonymous traffic statistics, erased after 4 months — they cannot identify you.

Both purges are automatic and daily. You can also request deletion from the account-deletion page, without being signed in.`,
    },
    {
      titre: '7. Security',
      texte: `Passwords are encrypted (bcrypt hashing) and are never stored in clear text. SMS verification codes are single-use, short-lived and stored in encrypted form. Access to data is checked server-side on every request (each person only reaches their own data). Exchanges with the site are protected by HTTPS. We take reasonable technical and organisational measures to preserve the confidentiality and integrity of your data, in accordance with Law No. 2013-450.`,
    },
    {
      titre: '8. Minors',
      texte: `The application is not intended for people under 18. We do not knowingly collect data from minors.`,
    },
    {
      titre: '9. Your rights (Law No. 2013-450)',
      texte: `In accordance with Ivorian Law No. 2013-450 on the protection of personal data, you have the following rights:

• Information: knowing how and why your data is processed (this policy).
• Access: knowing what data we hold about you and obtaining a copy.
• Rectification: correcting your information from Account → Settings or on request.
• Deletion: deleting your account and all your data.
• Objection: objecting, on legitimate grounds, to a processing operation; unsubscribing from the newsletter at any time.
• Portability (voluntary commitment): requesting a copy of your data in a readable format.

To exercise these rights, use the application or write to us at contact@chap.ci. We answer as promptly as possible. If you consider that your rights are not respected, you can refer the matter to the ARTCI (artci.ci), the personal-data protection authority in Côte d’Ivoire.`,
    },
    {
      titre: '10. Legal framework',
      texte: `This policy falls within the framework of the following texts:

• Law No. 2013-450 of 19 June 2013 on the protection of personal data;
• Law No. 2013-451 of 19 June 2013 on the fight against cybercrime, as amended by Law No. 2023-593 of 7 June 2023;
• Law No. 2013-546 of 30 July 2013 on electronic transactions;
• ECOWAS Supplementary Act A/SA.1/01/10 on personal data protection;
• the ARTCI regulations applicable to data processing.`,
    },
    {
      titre: '11. Cookies and advertising measurement',
      texte: `On the chap.ci website, in addition to the cookies strictly necessary for operation (sign-in, preferences), we use audience-measurement and advertising tools that set cookies or identifiers:

• Google Analytics — traffic measurement (page views, where visits come from);
• Meta Pixel (Facebook / Instagram) and TikTok Pixel — measuring the effectiveness of our advertising and showing relevant ads on those networks.

On that occasion, some browsing data (pages visited, actions such as signing up or publishing a listing) may be shared with Google, Meta and TikTok, which process it under their own privacy rules. No data is sold.

Your choices: you can refuse or limit these trackers at any time — by blocking cookies in your browser, through each platform’s advertising settings (Google, Meta, TikTok), or by enabling “Limit ad tracking” in your phone’s settings. Refusing does not prevent you from using Chap.ci. These trackers are not active in the mobile application.`,
    },
    {
      titre: '12. Contact',
      texte: `For any question about this policy: contact@chap.ci.`,
    },
  ],
}
