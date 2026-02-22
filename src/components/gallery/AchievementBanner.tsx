'use client'

export interface AchievementBannerProps {
  count: number
}

interface Milestone {
  threshold: number
  emoji: string
  title: string
}

const MILESTONES: Milestone[] = [
  { threshold: 100, emoji: '👑', title: 'Legendary Artist!' },
  { threshold: 50, emoji: '🏆', title: 'Master Creator!' },
  { threshold: 25, emoji: '✨', title: 'Art Wizard!' },
  { threshold: 10, emoji: '🖼️', title: 'Gallery Star!' },
  { threshold: 5, emoji: '🎨', title: 'Rising Artist!' },
]

function getMilestone(count: number): Milestone | null {
  return MILESTONES.find((m) => count >= m.threshold) ?? null
}

export default function AchievementBanner({ count }: AchievementBannerProps) {
  if (count === 0) return null

  const milestone = getMilestone(count)

  return (
    <div
      className={`rounded-2xl px-5 py-3 text-center shadow-soft animate-fade-in ${
        milestone
          ? 'bg-gradient-to-r from-golden/20 via-coral-light/15 to-lavender-light/20 border border-golden/30'
          : 'bg-white/70 border border-warm-gray/15'
      }`}
    >
      <p className="font-display text-lg font-bold text-charcoal">
        ⭐ {count} Masterpiece{count !== 1 ? 's' : ''} Created
      </p>
      {milestone && (
        <p className={`mt-0.5 text-sm font-semibold text-coral-dark ${
          milestone.threshold >= 25 ? 'shimmer-gradient animate-shimmer bg-clip-text text-transparent' : ''
        }`}>
          {milestone.emoji} {milestone.title}
        </p>
      )}
    </div>
  )
}

export { AchievementBanner }
