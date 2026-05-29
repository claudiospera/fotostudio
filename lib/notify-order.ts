// lib/notify-order.ts
// Invia notifica Telegram + email a Claudio quando arriva un nuovo ordine shop

interface OrderNotification {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: { productName: string; variantLabel: string; quantity: number; price: number }[]
  total: number
  paymentMethod: string
  couponCode?: string
  discount?: number
}

function formatItems(items: OrderNotification['items']): string {
  return items.map(i =>
    `• ${i.productName} — ${i.variantLabel} x${i.quantity} (${(i.price * i.quantity / 100).toFixed(2)}€)`
  ).join('\n')
}

function formatItemsHtml(items: OrderNotification['items']): string {
  return items.map(i =>
    `<li>${i.productName} — ${i.variantLabel} x${i.quantity} &nbsp;<strong>${(i.price * i.quantity / 100).toFixed(2)}€</strong></li>`
  ).join('')
}

export async function notifyNewOrder(order: OrderNotification) {
  await Promise.allSettled([
    sendTelegram(order),
    sendEmail(order),
  ])
}

// ── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(order: OrderNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const payLabel = order.paymentMethod === 'studio' ? '🏠 Pagamento in studio' : '💳 Pagamento online (Stripe)'
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountLine = order.couponCode && order.discount
    ? `\n🏷️ Sconto (${order.couponCode}): -${(order.discount / 100).toFixed(2)}€`
    : ''
  const subtotalLine = order.couponCode && order.discount
    ? `\n🧾 Subtotale: ${(subtotal / 100).toFixed(2)}€`
    : ''

  const text = [
    `🛒 *Nuovo ordine #${order.orderId}*`,
    ``,
    `👤 ${order.customerName}`,
    `📧 ${order.customerEmail}`,
    `📱 ${order.customerPhone}`,
    ``,
    formatItems(order.items),
    `${subtotalLine}${discountLine}`,
    `💰 *Totale: ${(order.total / 100).toFixed(2)}€*`,
    `${payLabel}`,
  ].join('\n')

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

// ── Email (Resend) ────────────────────────────────────────────────────────────

async function sendEmail(order: OrderNotification) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL || 'claudiospera@icloud.com'
  if (!apiKey) return

  const payLabel = order.paymentMethod === 'studio' ? 'Pagamento in studio' : 'Pagamento online (Stripe)'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Fotostudio Shop <noreply@storiedaraccontare.it>',
      to,
      subject: `🛒 Nuovo ordine #${order.orderId} — ${order.customerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1612;">
          <h2 style="font-size: 20px; margin-bottom: 4px;">Nuovo ordine #${order.orderId}</h2>
          <p style="color: #666; margin-top: 0;">${new Date().toLocaleString('it-IT')}</p>

          <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 6px 0; color:#888; font-size:13px;">Cliente</td><td style="font-size:14px;">${order.customerName}</td></tr>
            <tr><td style="padding: 6px 0; color:#888; font-size:13px;">Email</td><td style="font-size:14px;">${order.customerEmail}</td></tr>
            <tr><td style="padding: 6px 0; color:#888; font-size:13px;">Telefono</td><td style="font-size:14px;">${order.customerPhone}</td></tr>
            <tr><td style="padding: 6px 0; color:#888; font-size:13px;">Pagamento</td><td style="font-size:14px;">${payLabel}</td></tr>
          </table>

          <h3 style="font-size: 15px; margin-bottom: 8px;">Prodotti</h3>
          <ul style="padding-left: 18px; font-size: 14px; line-height: 1.8;">
            ${formatItemsHtml(order.items)}
          </ul>

          ${order.couponCode && order.discount ? `
          <table style="width:100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color:#888;">Subtotale</td>
              <td style="text-align:right;">${(order.items.reduce((s, i) => s + i.price * i.quantity, 0) / 100).toFixed(2)}€</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color:#16a34a; font-weight:600;">Sconto (${order.couponCode})</td>
              <td style="text-align:right; color:#16a34a; font-weight:600;">−${(order.discount / 100).toFixed(2)}€</td>
            </tr>
          </table>
          ` : ''}
          <p style="font-size: 18px; margin-top: 12px; font-weight: bold;">
            Totale: ${(order.total / 100).toFixed(2)}€
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop/admin/ordini" style="font-size: 13px; color: #888;">
            Vai agli ordini →
          </a>
        </div>
      `,
    }),
  })
}
