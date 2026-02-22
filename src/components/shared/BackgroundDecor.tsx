const BLOBS = [
  { size: '9rem', color: 'bg-lavender-light', top: '5%', left: '3%', delay: '0s', opacity: 'opacity-30' },
  { size: '6rem', color: 'bg-teal-light', top: '20%', right: '5%', delay: '0.8s', opacity: 'opacity-25' },
  { size: '11rem', color: 'bg-coral-light', top: '55%', left: '8%', delay: '1.5s', opacity: 'opacity-20' },
  { size: '7rem', color: 'bg-golden', top: '70%', right: '10%', delay: '2.2s', opacity: 'opacity-25' },
  { size: '8rem', color: 'bg-sky', top: '38%', left: '50%', delay: '0.4s', opacity: 'opacity-15' },
] as const

export default function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className={`absolute animate-float ${blob.color} ${blob.opacity}`}
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: 'left' in blob ? blob.left : undefined,
            right: 'right' in blob ? blob.right : undefined,
            animationDelay: blob.delay,
            borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
          }}
        />
      ))}
    </div>
  )
}
