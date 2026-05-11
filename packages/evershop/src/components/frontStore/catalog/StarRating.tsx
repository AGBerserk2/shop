import React from 'react';

interface StarRatingProps {
  rating: number; // 0–5, can be fractional
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  hideWhenEmpty?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

const TEXT_SIZE_MAP = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

// Half-step rounding: 0.25 → 0, 0.26–0.75 → 0.5, 0.76+ → 1.
// Keeps the visual signal honest (no 4.97 stars showing as five solid stars).
function toHalfSteps(r: number): number {
  if (r <= 0) return 0;
  if (r >= 5) return 5;
  return Math.round(r * 2) / 2;
}

export function StarRating({
  rating,
  count = 0,
  size = 'sm',
  showCount = true,
  hideWhenEmpty = true,
  className = ''
}: StarRatingProps) {
  const half = toHalfSteps(rating);

  if (hideWhenEmpty && (!count || count <= 0)) {
    return null;
  }

  const sizeClass = SIZE_MAP[size];
  const textClass = TEXT_SIZE_MAP[size];

  // We render 5 stars, each split into a left half and a right half. Each half
  // is either filled (amber) or empty (gray). This gives clean half-steps.
  const halves: ('full' | 'empty')[] = [];
  let remaining = half * 2; // 0..10 half-steps
  for (let i = 0; i < 10; i++) {
    if (remaining > 0) {
      halves.push('full');
      remaining -= 1;
    } else {
      halves.push('empty');
    }
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} aria-label={`${rating} de 5 estrellas, ${count} reseñas`}>
      <div className="inline-flex items-center gap-[1px]" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const left = halves[i * 2];
          const right = halves[i * 2 + 1];
          return (
            <span key={i} className={`relative inline-block ${sizeClass}`}>
              <StarShape className={`absolute inset-0 ${sizeClass}`} fill={left === 'full' ? 'left' : 'none'} />
              <StarShape className={`absolute inset-0 ${sizeClass}`} fill={right === 'full' ? 'right' : 'none'} />
            </span>
          );
        })}
      </div>
      {showCount && count > 0 && (
        <span className={`${textClass} text-gray-500 tabular-nums`}>
          {rating > 0 ? rating.toFixed(1) : '—'} ({count})
        </span>
      )}
    </div>
  );
}

function StarShape({
  className,
  fill
}: {
  className?: string;
  fill: 'left' | 'right' | 'none';
}) {
  // Star path. Half-fill done via a clip-path inset on the half we want filled.
  const clip =
    fill === 'left'
      ? 'inset(0 50% 0 0)'
      : fill === 'right'
      ? 'inset(0 0 0 50%)'
      : 'inset(0 100% 0 0)'; // none → fully clipped (invisible fill, only outline shows)

  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {/* Outline */}
      <path
        d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z"
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Fill clipped to the requested half */}
      <path
        d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z"
        fill="#F59E0B"
        style={{ clipPath: clip, WebkitClipPath: clip }}
      />
    </svg>
  );
}
