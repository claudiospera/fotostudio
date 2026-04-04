import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide border transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-[var(--s3)] text-[var(--t2)] border-[var(--b1)]',
        active:    'bg-[var(--acd)] text-[var(--ac)] border-[rgba(142,201,176,.2)]',
        draft:     'bg-[rgba(201,160,90,.12)] text-[var(--amber)] border-[rgba(201,160,90,.2)]',
        archived:  'bg-[var(--s2)] text-[var(--t3)] border-[var(--b1)]',
        accettato: 'bg-[var(--acd)] text-[var(--ac)] border-[rgba(142,201,176,.2)]',
        inviato:   'bg-[rgba(201,160,90,.12)] text-[var(--amber)] border-[rgba(201,160,90,.2)]',
        rifiutato: 'bg-[rgba(217,112,112,.12)] text-[var(--red)] border-[rgba(217,112,112,.2)]',
        bozza:     'bg-[var(--s3)] text-[var(--t2)] border-[var(--b1)]',
        danger:    'bg-[rgba(217,112,112,.12)] text-[var(--red)] border-[rgba(217,112,112,.2)]',
        warning:   'bg-[rgba(201,160,90,.12)] text-[var(--amber)] border-[rgba(201,160,90,.2)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
)
