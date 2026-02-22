'use client'

import { useMemo } from 'react'

export type MascotState = 'idle' | 'thinking' | 'celebrating' | 'painting' | 'sleeping' | 'waving'
export type MascotSize = 'sm' | 'md' | 'lg'

export interface LottieMascotProps {
  state?: MascotState
  size?: MascotSize
  className?: string
}

const SIZE_MAP: Record<MascotSize, number> = {
  sm: 64,
  md: 120,
  lg: 180,
}

/**
 * Lottie the Axolotl — a CSS-only mascot illustration.
 *
 * Built with divs, border-radius, gradients, and CSS animations.
 * Each `state` triggers different animation overlays.
 */
export default function LottieMascot({
  state = 'idle',
  size = 'md',
  className = '',
}: LottieMascotProps) {
  const px = SIZE_MAP[size]
  const scale = px / 120 // md=120 is the baseline

  // Memoize sparkle positions for celebrating state
  const sparkles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: `${15 + i * 14}%`,
      delay: `${i * 0.12}s`,
    }))
  }, [])

  // Memoize orbit dots for thinking state
  const orbitDots = useMemo(() => {
    return [
      { color: 'bg-coral', delay: '0s' },
      { color: 'bg-lavender', delay: '0.8s' },
      { color: 'bg-teal', delay: '1.6s' },
    ]
  }, [])

  const isAsleep = state === 'sleeping'

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
      role="img"
    >
      {/* Container with idle float or celebrating bounce */}
      <div
        className={`relative w-full h-full ${
          state === 'idle' ? 'animate-float' :
          state === 'celebrating' ? 'animate-bounce-soft' :
          ''
        }`}
      >
        {/* ── Body ── */}
        <div
          className="absolute rounded-[50%_50%_48%_48%] bg-gradient-to-b from-coral-light to-coral"
          style={{
            width: '58%',
            height: '62%',
            top: '25%',
            left: '21%',
          }}
        >
          {/* Belly highlight */}
          <div
            className="absolute rounded-[50%] bg-white/25"
            style={{
              width: '60%',
              height: '50%',
              top: '25%',
              left: '20%',
            }}
          />
        </div>

        {/* ── Head ── */}
        <div
          className="absolute rounded-[50%_50%_45%_45%] bg-gradient-to-b from-coral-light to-coral"
          style={{
            width: '65%',
            height: '48%',
            top: '5%',
            left: '17.5%',
          }}
        >
          {/* Face highlight (forehead sheen) */}
          <div
            className="absolute rounded-[50%] bg-white/20"
            style={{
              width: '50%',
              height: '30%',
              top: '10%',
              left: '25%',
            }}
          />

          {/* Left eye */}
          <div
            className="absolute rounded-full bg-charcoal"
            style={{
              width: isAsleep ? '18%' : '14%',
              height: isAsleep ? '3%' : '14%',
              top: '42%',
              left: '26%',
              borderRadius: isAsleep ? '999px' : '50%',
            }}
          />
          {/* Left eye shine */}
          {!isAsleep && (
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: '5%',
                height: '5%',
                top: '40%',
                left: '30%',
              }}
            />
          )}

          {/* Right eye */}
          <div
            className="absolute rounded-full bg-charcoal"
            style={{
              width: isAsleep ? '18%' : '14%',
              height: isAsleep ? '3%' : '14%',
              top: '42%',
              right: '26%',
              borderRadius: isAsleep ? '999px' : '50%',
            }}
          />
          {/* Right eye shine */}
          {!isAsleep && (
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: '5%',
                height: '5%',
                top: '40%',
                right: '30%',
              }}
            />
          )}

          {/* Smile */}
          <div
            className="absolute border-b-2 border-charcoal/60 rounded-b-full"
            style={{
              width: '20%',
              height: '10%',
              top: '60%',
              left: '40%',
              borderBottomLeftRadius: '50%',
              borderBottomRightRadius: '50%',
            }}
          />

          {/* Blush spots */}
          <div
            className="absolute rounded-full bg-coral-dark/25"
            style={{
              width: '14%',
              height: '8%',
              top: '55%',
              left: '14%',
            }}
          />
          <div
            className="absolute rounded-full bg-coral-dark/25"
            style={{
              width: '14%',
              height: '8%',
              top: '55%',
              right: '14%',
            }}
          />
        </div>

        {/* ── Left gills (3 branches) ── */}
        {[0, 1, 2].map((i) => (
          <div
            key={`gill-l-${i}`}
            className="absolute bg-gradient-to-l from-coral to-lavender rounded-full"
            style={{
              width: '22%',
              height: `${3 + scale}%`,
              top: `${10 + i * 8}%`,
              left: '2%',
              transform: `rotate(${-20 + i * 20}deg)`,
              transformOrigin: 'right center',
            }}
          >
            {/* Gill tip */}
            <div
              className="absolute rounded-full bg-lavender-light"
              style={{
                width: '30%',
                height: '100%',
                left: 0,
                borderRadius: '50%',
              }}
            />
          </div>
        ))}

        {/* ── Right gills (3 branches) ── */}
        {[0, 1, 2].map((i) => (
          <div
            key={`gill-r-${i}`}
            className="absolute bg-gradient-to-r from-coral to-lavender rounded-full"
            style={{
              width: '22%',
              height: `${3 + scale}%`,
              top: `${10 + i * 8}%`,
              right: '2%',
              transform: `rotate(${20 - i * 20}deg)`,
              transformOrigin: 'left center',
            }}
          >
            <div
              className="absolute rounded-full bg-lavender-light"
              style={{
                width: '30%',
                height: '100%',
                right: 0,
                borderRadius: '50%',
              }}
            />
          </div>
        ))}

        {/* ── Tail ── */}
        <div
          className="absolute bg-gradient-to-b from-coral to-coral-light rounded-full"
          style={{
            width: '12%',
            height: '28%',
            bottom: '5%',
            left: '44%',
            borderRadius: '40% 40% 50% 50%',
            transform: 'rotate(-5deg)',
          }}
        />

        {/* ── Left arm/fin ── */}
        <div
          className={`absolute bg-coral rounded-full origin-top-right ${
            state === 'waving' ? 'animate-wave' : ''
          }`}
          style={{
            width: '14%',
            height: '20%',
            top: '42%',
            left: '12%',
            borderRadius: '50% 50% 40% 60%',
            transform: state === 'waving' ? undefined : 'rotate(15deg)',
          }}
        />

        {/* ── Right arm/fin ── */}
        <div
          className="absolute bg-coral rounded-full"
          style={{
            width: '14%',
            height: '20%',
            top: '42%',
            right: '12%',
            borderRadius: '50% 50% 60% 40%',
            transform: 'rotate(-15deg)',
          }}
        />

        {/* ── Paintbrush (painting state) ── */}
        {state === 'painting' && (
          <div
            className="absolute animate-paint-stroke origin-bottom-left"
            style={{
              right: '2%',
              top: '35%',
              width: '30%',
              height: '8%',
            }}
          >
            {/* Brush handle */}
            <div
              className="absolute bg-golden rounded-full"
              style={{
                width: '70%',
                height: '100%',
                right: 0,
                top: 0,
              }}
            />
            {/* Brush tip */}
            <div
              className="absolute bg-teal rounded-[2px]"
              style={{
                width: '35%',
                height: '120%',
                left: 0,
                top: '-10%',
                borderRadius: '30% 30% 50% 50%',
              }}
            />
          </div>
        )}
      </div>

      {/* ── State overlays ── */}

      {/* Thinking: orbiting paint dots */}
      {state === 'thinking' && (
        <div className="absolute inset-0">
          {orbitDots.map((dot) => (
            <div
              key={dot.delay}
              className="absolute top-1/2 left-1/2"
              style={{ animationDelay: dot.delay }}
            >
              <div
                className={`animate-orbit ${dot.color} rounded-full`}
                style={{
                  width: Math.max(6, 8 * scale),
                  height: Math.max(6, 8 * scale),
                  animationDelay: dot.delay,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Celebrating: sparkle particles rising */}
      {state === 'celebrating' && (
        <div className="absolute inset-0 overflow-visible">
          {sparkles.map((s) => (
            <div
              key={s.id}
              className="absolute animate-sparkle-rise text-golden"
              style={{
                left: s.left,
                top: '10%',
                animationDelay: s.delay,
                fontSize: Math.max(10, 14 * scale),
              }}
            >
              ✦
            </div>
          ))}
        </div>
      )}

      {/* Sleeping: floating z's */}
      {state === 'sleeping' && (
        <div className="absolute overflow-visible" style={{ top: '0%', right: '5%' }}>
          {['z', 'Z', 'z'].map((char, i) => (
            <span
              key={i}
              className="absolute font-display font-bold text-lavender animate-zzz-float"
              style={{
                fontSize: Math.max(10, (12 + i * 4) * scale),
                animationDelay: `${i * 0.7}s`,
                right: `${i * 8}%`,
                top: `${-i * 10}%`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export { LottieMascot }
