'use client'

// components/shop/CartProvider.tsx
// Context carrello con persistenza localStorage + sync DB per utenti loggati

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useUser } from '@clerk/nextjs'
import type { Cart, CartItem } from '@/lib/shop/types'

const STORAGE_KEY = 'fotostudio_cart'

const emptyCart = (): Cart => ({ items: [], updatedAt: new Date().toISOString() })

export interface AppliedCoupon {
  code: string
  discount: number   // in centesimi
  label: string
}

interface CartContextValue {
  cart: Cart
  itemCount: number
  total: number           // subtotale in centesimi
  finalTotal: number      // total - discount
  coupon: AppliedCoupon | null
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: string) => void
  updateQuantity: (productId: string, variantId: string, qty: number) => void
  clearCart: () => void
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>
  removeCoupon: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// ─── helpers localStorage ────────────────────────────────────────────────────

function loadLocal(): Cart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Cart
  } catch {}
  return emptyCart()
}

function saveLocal(cart: Cart) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)) } catch {}
}

// ─── merge: usato SOLO quando l'utente si logga con un carrello locale non vuoto
// Remote (DB) è source of truth per gli item già presenti; aggiunge solo item
// locali assenti nel DB (aggiunti mentre era sloggato).
// Se il DB ha già tutti gli item, ritorna semplicemente remote.

function mergeItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const remoteKeys = new Set(remote.map(i => `${i.productId}||${i.variantId}`))
  const localOnly = local.filter(i => !remoteKeys.has(`${i.productId}||${i.variantId}`))
  return localOnly.length ? [...remote, ...localOnly] : remote
}

// ─── CartProvider ────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  // Carica dal localStorage al mount
  useEffect(() => {
    setCart(loadLocal())
  }, [])

  // Quando Clerk è pronto e l'utente è loggato: carica dal DB (source of truth)
  // Il merge avviene solo se ci sono item locali non presenti nel DB.
  // Usa sessionStorage per evitare fetch multipli nella stessa sessione.
  useEffect(() => {
    if (!isLoaded) return
    const userId = user?.id ?? null
    if (!userId) return

    const sessionKey = `cart_synced_${userId}`
    if (sessionStorage.getItem(sessionKey)) return   // già sincronizzato in questa sessione
    sessionStorage.setItem(sessionKey, '1')

    fetch('/api/shop/cart')
      .then(r => r.json())
      .then(({ items: remoteItems }) => {
        if (!Array.isArray(remoteItems)) return
        setCart(prev => {
          const merged = mergeItems(prev.items, remoteItems)
          const next: Cart = { items: merged, updatedAt: new Date().toISOString() }
          saveLocal(next)
          return next
        })
      })
      .catch(() => {})
  }, [isLoaded, user?.id]) // eslint-disable-line

  // Sincronizza localStorage ad ogni modifica; se loggato, anche il DB (debounced)
  useEffect(() => {
    saveLocal(cart)
    if (!user?.id) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      fetch('/api/shop/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items }),
      }).catch(() => {})
    }, 1500)
  }, [cart]) // eslint-disable-line

  const persist = useCallback((updater: (prev: Cart) => Cart) => {
    setCart((prev) => ({ ...updater(prev), updatedAt: new Date().toISOString() }))
  }, [])

  const addItem = useCallback(
    (item: CartItem) => {
      persist((prev) => {
        const existing = prev.items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        )
        if (existing >= 0) {
          const items = [...prev.items]
          items[existing] = { ...items[existing], quantity: items[existing].quantity + item.quantity }
          return { ...prev, items }
        }
        return { ...prev, items: [...prev.items, item] }
      })
    },
    [persist]
  )

  const removeItem = useCallback(
    (productId: string, variantId: string) => {
      persist((prev) => ({
        ...prev,
        items: prev.items.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        ),
      }))
    },
    [persist]
  )

  const updateQuantity = useCallback(
    (productId: string, variantId: string, qty: number) => {
      if (qty <= 0) { removeItem(productId, variantId); return }
      persist((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i
        ),
      }))
    },
    [persist, removeItem]
  )

  const clearCart = useCallback(() => {
    setCart(emptyCart())
    setCoupon(null)
    if (user?.id) {
      fetch('/api/shop/cart', { method: 'DELETE' }).catch(() => {})
    }
  }, [user?.id])

  const applyCoupon = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    try {
      const res = await fetch('/api/shop/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          total: subtotal,
          items: cart.items.map(i => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Codice non valido' }
      setCoupon({ code: code.trim().toUpperCase(), discount: data.discount, label: data.label })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Errore di connessione' }
    }
  }, [cart.items])

  const removeCoupon = useCallback(() => setCoupon(null), [])

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const finalTotal = Math.max(0, total - (coupon?.discount ?? 0))

  return (
    <CartContext.Provider value={{ cart, itemCount, total, finalTotal, coupon, addItem, removeItem, updateQuantity, clearCart, applyCoupon, removeCoupon }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve essere usato dentro <CartProvider>')
  return ctx
}
