// lib/shop/calendar-pricing.ts
// Prezzi calendari 2027: 1ª copia a prezzo pieno, successive scontate — non è un
// prezzo per unità moltiplicato per la quantità, quindi calcolato a parte da
// getPriceForQuantity usato dagli altri prodotti.

export const CALENDAR_PRICES: Record<string, { first: number; extra: number }> = {
  foglio_30x45: { first: 1000, extra: 800 }, // centesimi: 10€ prima copia, 8€ le successive
}

export function getCalendarLineTotal(format: string, qty: number): number {
  const p = CALENDAR_PRICES[format]
  if (!p || qty < 1) return 0
  return p.first + p.extra * (qty - 1)
}

export function formatCalendarPriceBreakdown(format: string, qty: number): string {
  const p = CALENDAR_PRICES[format]
  if (!p) return ''
  const euros = (cents: number) => (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
  if (qty <= 1) return `1 × ${euros(p.first)}`
  return `1 × ${euros(p.first)} + ${qty - 1} × ${euros(p.extra)}`
}

/**
 * Totale di una riga carrello/ordine: usa lineTotal se presente (calendari),
 * altrimenti il classico price × quantity (tutti gli altri prodotti shop).
 */
export function getLineTotal(item: { lineTotal?: number | null; price: number; quantity: number }): number {
  return item.lineTotal ?? item.price * item.quantity
}
