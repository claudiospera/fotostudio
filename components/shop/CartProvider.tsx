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

// ─── merge: unisce due liste sommando le quantità per variante duplicata ──────

function mergeItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const item of remote) map.set(`${item.productId}||${item.variantId}`, item)
  for (const item of local) {
    const key = `${item.productId}||${item.variantId}`
    if (map.has(key)) {
      map.set(key, { ...map.get(key)!, quantity: map.get(key)!.quantity + item.quantity })
    } else {
      map.set(key, item)
    }
  }
  return Array.from(map.values())
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

  // Quando Clerk è pronto e l'utente esegue il login: merge localStorage + DB
  useEffect(() => {
    if (!isLoaded) return
    const userId = user?.id ?? null

    if (userId && prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId
      fetch('/api/shop/cart')
        .then(r => r.json())
        .then(({ items: remoteItems }) => {
          if (!Array.isArray(remoteItems) || remoteItems.length === 0) return
          setCart(prev => {
            const merged: Cart = {
              items: mergeItems(prev.items, remoteItems),
              updatedAt: new Date().toISOString(),
            }
            saveLocal(merged)
            return merged
          })
        })
        .catch(() => {})
    }

    if (!userId && prevUserIdRef.current !== null && prevUserIdRef.current !== undefined) {
      prevUserIdRef.current = null
    }

    if (prevUserIdRef.current === undefined) prevUserIdRef.current = userId
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
        body: JSON.stringify({ code, total: subtotal }),
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
