// app/shop/admin/ordini/page.tsx
// Lista ordini — protetta da Clerk (middleware)

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Order } from '@/lib/shop/types'

// Dati placeholder — da sostituire con query Supabase
const MOCK_ORDERS: Order[] = []

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
    cents / 100
  )
}

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'In attesa',
  confirmed: 'Confermato',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

const STATUS_STYLE: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function AdminOrdersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Ordini</h1>
        <a
          href="/shop/admin"
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Dashboard
        </a>
      </div>

      {MOCK_ORDERS.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-gray-400">Nessun ordine ricevuto.</p>
          <p className="mt-1 text-xs text-gray-400">
            Gli ordini appariranno qui dopo l&apos;integrazione con Supabase.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Cliente', 'Totale', 'Stato', 'Data'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {MOCK_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {order.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{order.customer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status]}`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
