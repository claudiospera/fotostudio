// lib/shop/shipping.ts
// Costanti e calcolo del costo di spedizione per lo shop pubblico

export type DeliveryMethod = 'pickup' | 'shipping'

export const SHIPPING_FEE = 850            // 8,50 € in centesimi
export const FREE_SHIPPING_THRESHOLD = 7900 // 79,00 € in centesimi

/**
 * Costo di spedizione in centesimi. La soglia si applica sul subtotale
 * DOPO lo sconto coupon (subtotalAfterDiscount).
 */
export function getShippingCost(subtotalAfterDiscount: number, deliveryMethod: DeliveryMethod): number {
  if (deliveryMethod === 'pickup') return 0
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}
