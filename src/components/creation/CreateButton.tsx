'use client'

export interface CreateButtonProps {
  disabled: boolean
  loading: boolean
  onClick: () => void
}

export default function CreateButton({
  disabled,
  loading,
  onClick,
}: CreateButtonProps) {
  return (
    <div className="w-full flex justify-center animate-fade-in">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={`relative w-full max-w-md min-h-[56px] rounded-2xl font-display text-lg font-bold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 ${
          disabled
            ? 'bg-warm-gray/40 cursor-not-allowed'
            : loading
              ? 'bg-gradient-to-r from-coral via-lavender to-teal'
              : 'bg-gradient-to-r from-coral via-lavender to-teal shimmer-gradient animate-shimmer hover:shadow-hover hover:scale-[1.02] active:scale-[0.98] btn-bounce'
        }`}
        title={disabled ? 'Pick at least a subject and a style!' : undefined}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
            />
            Lottie is painting...
          </span>
        ) : (
          <span>✨ Create My Art! ✨</span>
        )}
      </button>

      {disabled && !loading && (
        <p className="absolute -bottom-6 text-xs text-warm-gray text-center w-full">
          Pick at least a subject and a style!
        </p>
      )}
    </div>
  )
}

export { CreateButton }
