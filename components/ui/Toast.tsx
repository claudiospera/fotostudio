'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const icons: Record<ToastType, string> = {
    success: '✓',
    error:   '✕',
    warning: '!',
  }

  const colors: Record<ToastType, string> = {
    success: 'text-[var(--ac)]',
    error:   'text-[var(--red)]',
    warning: 'text-[var(--amber)]',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 bg-[var(--s1)] border border-[var(--b2)] rounded-[var(--r2)] shadow-xl animate-slide-up text-sm min-w-[260px]"
          >
            <span className={`font-bold ${colors[t.type]}`}>{icons[t.type]}</span>
            <span className="text-[var(--tx)]">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
