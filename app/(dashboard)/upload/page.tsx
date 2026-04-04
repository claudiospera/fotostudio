import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'

export default function UploadPage() {
  return (
    <>
      <Topbar
        title="Upload clienti"
        actions={
          <Button variant="primary" size="sm">
            + Nuovo link
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
        <div className="flex items-center justify-center h-64 bg-[var(--s1)] border border-[var(--b1)] rounded-[var(--r)]">
          <p className="text-[var(--t3)] text-sm">
            I link upload appariranno qui una volta collegato Supabase.
          </p>
        </div>
      </div>
    </>
  )
}
