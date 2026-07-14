import { useEffect, useState } from 'react'
import { ShoppingBag, Package, CheckCircle2, Star, Store, Loader2, BadgeCheck } from 'lucide-react'
import { getDeal, dealAction, dealEnabled, type DealState } from '../lib/deal'
import { createReview } from '../lib/reviews'

/**
 * Carte de suivi de transaction affichée en haut d'une conversation.
 * Comme l'achat se fait hors application, on fait DÉCLARER chaque étape :
 *  - acheteur : « J'ai acheté » → « Bien reçu » → noter le vendeur
 *  - vendeur  : « Marquer comme vendu » → noter l'acheteur
 */
export function DealCard({ convId, userId }: { convId: string; userId: string }) {
  const [deal, setDeal] = useState<DealState | null>(null)
  const [busy, setBusy] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const load = () => getDeal(convId).then((d) => d && setDeal(d))
  useEffect(() => {
    if (dealEnabled) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId])

  if (!dealEnabled || !deal) return null

  async function act(action: 'bought' | 'received' | 'sold' | 'cancel') {
    setBusy(true)
    try {
      await dealAction(convId, action)
      await load()
    } catch {
      alert('Action impossible pour le moment.')
    } finally {
      setBusy(false)
    }
  }

  const isBuyer = deal.role === 'buyer'
  const status = deal.order?.status ?? null
  const concluded = status === 'finalise' || (!isBuyer && deal.sold)

  // Bandeau selon l'étape.
  let inner: React.ReactNode = null

  if (deal.iReviewed) {
    inner = (
      <Row tone="done" icon={<CheckCircle2 size={18} />}>
        <span>
          Merci, votre avis a été publié{deal.myRating ? ` (${deal.myRating}★)` : ''}.
        </span>
      </Row>
    )
  } else if (concluded) {
    // Transaction conclue → inviter à noter la contrepartie.
    inner = reviewing ? (
      <ReviewForm
        target={isBuyer ? 'vendeur' : 'acheteur'}
        name={deal.otherName}
        onCancel={() => setReviewing(false)}
        onSubmit={async (rating, comment) => {
          await createReview({
            listingId: deal.listingId ?? '',
            sellerId: deal.sellerId,
            reviewerId: userId,
            targetId: deal.otherId,
            kind: isBuyer ? 'seller' : 'buyer',
            rating,
            comment,
          })
          await load()
        }}
      />
    ) : (
      <Row tone="review" icon={<Star size={18} />}>
        <div className="flex-1">
          <p className="font-semibold">Comment s’est passée la transaction&nbsp;?</p>
          <p className="text-xs opacity-80">Notez {isBuyer ? 'le vendeur' : "l’acheteur"} pour aider la communauté.</p>
        </div>
        <button onClick={() => setReviewing(true)} className="btn-primary shrink-0 px-3 py-2 text-sm">
          <Star size={16} /> Noter
        </button>
      </Row>
    )
  } else if (isBuyer) {
    if (status === 'en_cours') {
      inner = (
        <Row tone="progress" icon={<Package size={18} />}>
          <div className="flex-1">
            <p className="font-semibold">Avez-vous bien reçu l’article&nbsp;?</p>
            <p className="text-xs opacity-80">Confirmez la réception pour finaliser et laisser un avis.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button onClick={() => act('received')} disabled={busy} className="btn-primary px-3 py-1.5 text-sm">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Bien reçu
            </button>
            <button onClick={() => act('cancel')} disabled={busy} className="text-[11px] text-gray-400 hover:text-red-500">
              Annuler
            </button>
          </div>
        </Row>
      )
    } else {
      inner = (
        <Row tone="ask" icon={<ShoppingBag size={18} />}>
          <div className="flex-1">
            <p className="font-semibold">Vous avez acheté cet article&nbsp;?</p>
            <p className="text-xs opacity-80">Confirmez pour suivre votre achat et pouvoir noter le vendeur.</p>
          </div>
          <button onClick={() => act('bought')} disabled={busy} className="btn-primary shrink-0 px-3 py-2 text-sm">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={16} />} J’ai acheté
          </button>
        </Row>
      )
    }
  } else {
    // Vendeur, pas encore vendu.
    inner = (
      <Row tone="ask" icon={<Store size={18} />}>
        <div className="flex-1">
          <p className="font-semibold">Vous avez vendu à {deal.otherName}&nbsp;?</p>
          <p className="text-xs opacity-80">Marquez l’annonce vendue et notez l’acheteur.</p>
        </div>
        <button onClick={() => act('sold')} disabled={busy} className="btn-primary shrink-0 px-3 py-2 text-sm">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={16} />} Marquer vendu
        </button>
      </Row>
    )
  }

  return <div className="border-b border-gray-100 bg-white px-3 py-2.5">{inner}</div>
}

function Row({
  tone,
  icon,
  children,
}: {
  tone: 'ask' | 'progress' | 'review' | 'done'
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const toneCls = {
    ask: 'bg-primary-50 text-primary-900',
    progress: 'bg-sky-50 text-sky-900',
    review: 'bg-amber-50 text-amber-900',
    done: 'bg-emerald-50 text-emerald-800',
  }[tone]
  const iconCls = {
    ask: 'bg-primary-500',
    progress: 'bg-sky-500',
    review: 'bg-amber-500',
    done: 'bg-emerald-500',
  }[tone]
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${toneCls}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${iconCls}`}>{icon}</span>
      {children}
    </div>
  )
}

function ReviewForm({
  target,
  name,
  onSubmit,
  onCancel,
}: {
  target: string
  name: string
  onSubmit: (rating: number, comment: string) => Promise<void>
  onCancel: () => void
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await onSubmit(rating, comment.trim())
    } catch {
      alert('Impossible de publier l’avis pour le moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-amber-50 p-3">
      <p className="mb-2 text-sm font-semibold text-amber-900">
        Notez {target === 'vendeur' ? 'le vendeur' : "l’acheteur"} <span className="font-normal">({name})</span>
      </p>
      <div className="mb-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>
            <Star
              size={28}
              className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={400}
        placeholder="Un mot sur la transaction (facultatif)…"
        className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={submit} disabled={busy} className="btn-primary flex-1 py-2 text-sm">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />} Publier l’avis
        </button>
        <button onClick={onCancel} className="btn-outline px-3 py-2 text-sm">
          Annuler
        </button>
      </div>
    </div>
  )
}
