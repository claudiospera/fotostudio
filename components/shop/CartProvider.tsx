'use client'

// components/shop/CartProvider.tsx
// Context carrello con persistenza localStorage

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { Cart, CartItem } from '@/lib/shop/types'

const STORAGE_KEY = 'fotostudio_cart'

const emptyCart = (): Cart => ({ items: [], updatedAt: new Date().toISOString() })

interface CartContextValue {
  cart: Cart
  itemCount: number
  total: number       // in centesimi
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: string) => void
  updateQuantity: (productId: string, variantId: string, qty: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart)

  // Carica dal localStorage solo lato client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCart(JSON.parse(raw) as Cart)
    } catch {
      // localStorage non disponibile o dati corrotti — ignora
    }
  }, [])

  // Sincronizza localStorage ad ogni modifica
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // quota superata — ignora silenziosamente
    }
  }, [cart])

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
          items[existing] = {
            ...items[existing],
            quantity: items[existing].quantity + item.quantity,
          }
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
      if (qty <= 0) {
        removeItem(productId, variantId)
        return
      }
      persist((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: qty }
            : i
        ),
      }))
    },
    [persist, removeItem]
  )

  const clearCart = useCallback(() => {
    setCart(emptyCart())
  }, [])

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ cart, itemCount, total, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve essere usato dentro <CartProvider>')
  return ctx
}
