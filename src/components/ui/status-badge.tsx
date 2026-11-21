import { BadgeCheck, Ban, CalendarClock, Check, CircleAlert, Clock, Scissors, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  scheduled: { icon: CalendarClock, label: 'Programada', className: 'border-border bg-secondary text-secondary-foreground' },
  going: { icon: Check, label: 'Va', className: 'border-primary/20 bg-primary/10 text-primary' },
  unconfirmed: { icon: CircleAlert, label: 'Sin confirmar', className: 'border-border bg-accent text-accent-foreground' },
  completed: { icon: Check, label: 'Completada', className: 'border-primary/20 bg-primary/10 text-primary' },
  cancelled: { icon: X, label: 'Cancelada', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  no_show: { icon: Ban, label: 'Inasistencia', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  deposit_pending: { icon: CircleAlert, label: 'Abono pendiente', className: 'border-border bg-accent text-accent-foreground' },
  deposit_paid: { icon: BadgeCheck, label: 'Abono pagado', className: 'border-primary/20 bg-primary/10 text-primary' },
  deposit_waived: { icon: BadgeCheck, label: 'Sin abono', className: 'border-border bg-muted text-muted-foreground' },
  extra: { icon: Sparkles, label: 'Extra', className: 'border-border bg-accent text-accent-foreground' },
  service: { icon: Scissors, label: 'Servicio', className: 'border-border bg-secondary text-secondary-foreground' },
  open: { icon: Clock, label: 'Libre', className: 'border-primary/20 bg-primary/10 text-primary' },
  positive: { icon: Check, label: 'Positivo', className: 'border-primary/20 bg-primary/10 text-primary' },
  negative: { icon: X, label: 'Negativo', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  neutral: { icon: CircleAlert, label: 'Neutral', className: 'border-border bg-muted text-muted-foreground' },
} as const;

export type StatusTone = keyof typeof tones;

export function StatusBadge({ tone, label, className }: { tone: StatusTone; label?: string; className?: string }) {
  const item = tones[tone];
  const Icon = item.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', item.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label ?? item.label}
    </span>
  );
}
