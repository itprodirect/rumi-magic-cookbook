'use client'

import { useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type?: ToastType
  visible: boolean
  onClose: () => void
  /** Auto-dismiss delay in ms. Default 3000. Set 0 to disable. */
  duration?: number
}

const TYPE_CONFIG: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-teal/15 border-teal/40 text-teal-dark', icon: '✅' },
  error: { bg: 'bg-coral/15 border-coral/40 text-coral-dark', icon: '😕' },
  info: { bg: 'bg-lavender/20 border-lavender/40 text-lavender-dark', icon: '💡' },
}

/**
 * Friendly notification toast.
 * Slides in from top, auto-dismisses, accessible via role="alert".
 */
export default function Toast({
  message,
  type = 'info',
  visible,
  onClose,
  duration = 3000,
}: ToastProps) {
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!visible || duration === 0) return
    const timer = setTimeout(handleClose, duration)
    return () => clearTimeout(timer)
  }, [visible, duration, handleClose])

  if (!visible) return null

  const config = TYPE_CONFIG[type]

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
      role="alert"
      aria-live="polite"
    >
      <div
        className={`animate-toast-in rounded-xl border px-4 py-3 shadow-soft flex items-center gap-3 ${config.bg}`}
      >
        <span className="text-lg flex-shrink-0" aria-hidden="true">
          {config.icon}
        </span>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-current/50 hover:text-current transition-colors p-1"
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export { Toast }
