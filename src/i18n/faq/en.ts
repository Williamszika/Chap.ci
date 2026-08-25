import type { TexteFaq } from './index'

export const faq: TexteFaq = {
  titre: 'Frequently asked questions',
  sous: 'Everything you need to buy and sell with peace of mind.',
  recherche: 'Search for a question…',
  aucunTitre: 'No answer found',
  aucunTexte: 'Try other words, or contact us directly — we reply fast.',
  contactTitre: 'Didn’t find your answer?',
  contactTexte: 'Our team is here to help. Write to us and we’ll get back to you quickly.',
  contactBouton: 'Contact us',
  sections: [
    {
      titre: 'General',
      items: [
        {
          q: 'What is Chap.ci?',
          r: 'Chap.ci is the 100% Ivorian classifieds site. You buy and sell chap-chap (fast) all over Côte d’Ivoire: cars, phones, property, fashion, food, services and much more.',
        },
        {
          q: 'Is it free?',
          r: 'Yes — signing up, posting listings and messaging are entirely free. You can support the platform with a Mobile Money donation if you wish, but nothing is compulsory.',
        },
        {
          q: 'Do I need to install an app?',
          r: 'No. Chap.ci works in your browser, on phone, tablet and computer. You can also add it to your home screen and use it like an app: iPhone (Safari → Share → “Add to Home Screen”) or Android (Chrome → ⋮ menu → “Install app”).',
        },
        {
          q: 'Are the website, the home-screen install and the app the same thing?',
          r: 'Yes, it’s the same Chap.ci, with the same listings and the same account. Three ways in: the website, in your browser; the home-screen install, which gives you an icon like a real app without downloading anything; and the Android app, being prepared on the Play Store. Until it goes live, installing from the website is faster and lighter on your data plan — and you get new features without waiting for an update.',
        },
        {
          q: 'In which cities does Chap.ci work?',
          r: 'Everywhere in Côte d’Ivoire. You can filter listings by district, region, city and commune — from Abidjan to Bouaké, San-Pédro, Yamoussoukro, Korhogo…',
        },
      ],
    },
    {
      titre: 'My account',
      items: [
        {
          q: 'How do I create an account?',
          r: 'Click “Sign in / Create an account”, then register with your email, your phone, or with Google/Apple. It’s free and immediate.',
        },
        {
          q: 'Why do I need an account to post a listing?',
          r: 'An account lets buyers identify you and write to you with confidence, and it limits fake profiles and fraudulent listings. Creating one is free and takes less than a minute. To buy or write to a seller, on the other hand, no account is required.',
        },
        {
          q: 'I forgot my password, what should I do?',
          r: 'On the sign-in page, click “Forgot password?” and follow the instructions sent by email to choose a new one.',
        },
        {
          q: 'How do I delete my account?',
          r: 'Go to Account → Settings → Delete my account. A password confirmation is required. Deletion is final: your listings and data are erased.',
        },
        {
          q: 'How do I protect my account?',
          r: 'Turn on two-factor authentication (2FA) from Account → Settings, and never share your password. Chap.ci will never ask for your password by message.',
        },
      ],
    },
    {
      titre: 'Buying',
      items: [
        {
          q: 'How do I contact a seller?',
          r: 'Open the listing and click “Contact the seller”. You chat through the built-in messaging, without revealing your phone number.',
        },
        {
          q: 'Can I negotiate the price?',
          r: 'Yes, if the listing says “negotiable”. Offer your price politely in the messaging. Stay courteous: a good exchange often closes a good deal.',
        },
        {
          q: 'How do I pay safely?',
          r: 'Prefer payment on delivery or handing over in person in a public place. Always check the item before paying. Avoid sending money in advance to someone you don’t know.',
        },
        {
          q: 'How does delivery work?',
          r: 'Delivery is arranged directly between you and the seller in the messaging: hand-to-hand (ideally in a busy public place), or delivery if the seller offers it on the listing (“Delivery” badge). Agree in advance on the place, the time and any delivery fees. Chap.ci does not handle transport and is not a party to the transaction: prefer paying at the moment of hand-over.',
        },
        {
          q: 'How do I confirm a purchase and leave a review?',
          r: 'Since the transaction happens hand to hand (Mobile Money, cash…), you are the one who confirms it. In the conversation with the seller: tap “I bought it”, then “Received” once the item is in hand. You can then rate the seller ⭐. The seller, in turn, can rate you as a buyer. If you forget, we send you a little reminder by email.',
        },
        {
          q: 'How do I save a search to be alerted?',
          r: 'In the explorer, set your filters then click “Create an alert”. You’ll receive an email as soon as a new listing matches. Find your alerts in Account → Settings → My alerts.',
        },
      ],
    },
    {
      titre: 'Selling',
      items: [
        {
          q: 'How do I post a listing?',
          r: 'Click Post, add photos, choose the category, fill in the title, price and description, then publish. The form adapts to the category (brand, year, surface area…) for more precise listings.',
        },
        {
          q: 'How many photos can I add, and how do I get them right?',
          r: 'At least three photos are required to publish, five at most. Take them yourself, in good light and from different angles — that’s what sets a genuine listing apart from a copied one, and avoids arguments once the buyer is on site. Show the flaws if there are any: it inspires more trust than hiding them. The first photo is the cover and attracts many more buyers. Images are automatically optimised on upload.',
        },
        {
          q: 'How do I edit, hide or delete my listing?',
          r: 'From Account → My listings, each listing can be edited, hidden (paused without deleting) then shown again, or deleted for good.',
        },
        {
          q: 'How do I sell faster?',
          r: 'Set a fair price, an honest and complete description, good photos, and reply quickly to messages. A responsive, well-rated seller inspires trust and closes faster.',
        },
      ],
    },
    {
      titre: 'Safety & trust',
      items: [
        {
          q: 'How do I avoid scams?',
          r: 'Never pay a stranger in advance, be wary of abnormally low prices, meet in a public place, check the item before paying, and keep your exchanges in the Chap.ci messaging. When in doubt, go no further.',
        },
        {
          q: 'How do I report a suspicious listing or user?',
          r: 'On every listing, use the “Report” button and state the reason. Our moderation team reviews the reports. A heavily reported listing is automatically hidden pending checks.',
        },
        {
          q: 'What should I do in a dispute with a buyer or a seller?',
          r: 'First keep calm, and keep the whole exchange in the Chap.ci messaging (it serves as evidence). Try to reach an amicable agreement. If the person doesn’t keep their commitments, report the listing or the profile, and write to us at contact@chap.ci with the details. Chap.ci is a technical intermediary and not a party to the transaction: we cannot refund, but we can sanction a member acting in bad faith. In the event of proven fraud, file a complaint with the PLCC (the Ivorian platform against cybercrime).',
        },
        {
          q: 'What are reviews for?',
          r: 'After a transaction, the buyer can leave the seller a review. Verified reviews help the whole community buy with confidence. A good review history strengthens your seller profile.',
        },
      ],
    },
    {
      titre: 'Payment & donation',
      items: [
        {
          q: 'Which payment methods are accepted?',
          r: 'Payments happen directly between buyer and seller, usually by Mobile Money (Orange Money, MTN MoMo, Wave), in cash on delivery, or in person. Chap.ci takes nothing from your sales.',
        },
        {
          q: 'How can I support Chap.ci?',
          r: 'Chap.ci is free and independent. You can support us with a Mobile Money donation from the “Donate” page. Thank you to everyone helping the platform grow 🇨🇮',
        },
      ],
    },
  ],
}
