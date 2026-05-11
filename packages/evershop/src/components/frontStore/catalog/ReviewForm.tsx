import React, { useState } from 'react';

interface ReviewFormProps {
  productId: number;
  canReview: boolean;
  submitUrl: string;
}

export function ReviewForm({ productId, canReview, submitUrl }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-5 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <h4 className="font-bold text-emerald-900">¡Gracias por tu reseña!</h4>
        <p className="text-sm text-emerald-700 mt-1">
          La revisaremos antes de publicarla.
        </p>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
        <h4 className="font-bold text-gray-700 text-sm">¿Compraste este producto?</h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Para dejar una reseña necesitas haber comprado este producto y haber iniciado sesión.
        </p>
        <a
          href="/account/login"
          className="inline-block mt-3 text-xs font-semibold text-rose-600 hover:text-rose-700"
        >
          Iniciar sesión →
        </a>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError('Por favor selecciona una calificación');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, comment })
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setError(data?.error?.message || 'No se pudo enviar la reseña');
        return;
      }
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 p-5 space-y-4">
      <h4 className="font-bold text-gray-900">Deja tu reseña</h4>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Tu calificación
        </label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-8 h-8 ${
                  (hover || rating) >= n ? 'text-amber-400' : 'text-gray-300'
                }`}
                fill="currentColor"
              >
                <path d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Título (opcional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Algo que resuma tu experiencia"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Tu reseña
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="¿Qué te gustó? ¿Qué te sorprendió?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
        />
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-rose-600 text-white font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Enviando...' : 'Publicar reseña'}
      </button>

      <p className="text-[10px] text-gray-400 text-center">
        Tu reseña será revisada antes de publicarse.
      </p>
    </form>
  );
}
