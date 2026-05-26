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
  const text = [
    `🛒 *Nuovo ordine #${order.orderId}*`,
    ``,
    `👤 ${order.customerName}`,
    `📧 ${order.customerEmail}`,
    `📱 ${order.customerPhone}`,
    ``,
    formatItems(order.items),
    ``,
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
      from: 'Fotostudio Shop <onboarding@resend.dev>',
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

          <p style="font-size: 18px; margin-top: 20px; font-weight: bold;">
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
