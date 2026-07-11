import { Star } from 'lucide-react'

export function Stars({
  value,
  size = 16,
  editable = false,
  onChange,
}: {
  value: number
  size?: number
  editable?: boolean
  onChange?: (n: number) => void
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        editable ? (
          <button
            type="button"
            key={n}
            onClick={() => onChange?.(n)}
            className="active:scale-90"
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
            />
          </button>
        ) : (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        ),
      )}
    </span>
  )
}
