// lib/shop/shipping.ts
// Costanti e calcolo del costo di spedizione per lo shop pubblico

export type DeliveryMethod = 'pickup' | 'shipping'

export const SHIPPING_FEE = 850                // 8,50 € in centesimi
export const ISLAND_SHIPPING_SURCHARGE = 600   // 6,00 € in centesimi, aggiuntivi per Sicilia e Sardegna
export const FREE_SHIPPING_THRESHOLD = 7900    // 79,00 € in centesimi — non si applica alle isole

// Sigle provincia di Sicilia e Sardegna: i corrieri applicano quasi sempre un
// supplemento su queste zone, indipendentemente dal valore dell'ordine.
// Include anche le vecchie sigle sarde (OG, OT, VS) pre-accorpamento in SU,
// nel caso un cliente le usi ancora per abitudine.
export const ISLAND_PROVINCES = new Set([
  // Sicilia
  'AG', 'CL', 'CT', 'EN', 'ME', 'PA', 'RG', 'SR', 'TP',
  // Sardegna
  'CA', 'SS', 'NU', 'OR', 'SU', 'OG', 'OT', 'VS',
])

export function isIslandProvince(province?: string | null): boolean {
  if (!province) return false
  return ISLAND_PROVINCES.has(province.trim().toUpperCase())
}

/**
 * Costo di spedizione in centesimi. La soglia di spedizione gratuita si applica
 * sul subtotale DOPO lo sconto coupon (subtotalAfterDiscount), ma NON per le
 * isole (Sicilia/Sardegna): il costo del corriere non scende con l'importo.
 */
export function getShippingCost(subtotalAfterDiscount: number, deliveryMethod: DeliveryMethod, province?: string | null): number {
  if (deliveryMethod === 'pickup') return 0
  const island = isIslandProvince(province)
  const fee = island ? SHIPPING_FEE + ISLAND_SHIPPING_SURCHARGE : SHIPPING_FEE
  if (island) return fee // nessuna soglia di spedizione gratuita per le isole
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : fee
}
