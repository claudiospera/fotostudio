import { Topbar } from '@/components/layout/Topbar'
import { PreventiviDashboard } from '@/components/preventivi/PreventiviDashboard'

export default function PreventiviPage() {
  return (
    <>
      <Topbar title="Preventivi / Contratti" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PreventiviDashboard />
      </div>
    </>
  )
}
