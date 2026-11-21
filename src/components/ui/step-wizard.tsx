"use client";

import { Check, ChevronRight, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type WizardStep = {
  id: string;
  title: string;
  icon: LucideIcon;
};

type StepWizardProps = {
  steps: WizardStep[];
  current: number;
  heading: string;
  description?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  hideBack?: boolean;
};

export function StepWizard({
  steps,
  current,
  heading,
  description,
  children,
  onBack,
  onNext,
  backLabel = 'Anterior',
  nextLabel = 'Siguiente',
  nextDisabled,
  busy,
  hideBack,
}: StepWizardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto rounded-full border bg-card p-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const done = index < current;
          const active = index === current;
          return (
            <div key={step.id} className="flex min-w-0 items-center">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary bg-card text-primary',
                !done && !active && 'border-border bg-secondary text-muted-foreground',
              )}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn('ml-2 hidden truncate text-sm sm:block', (done || active) && 'font-semibold text-foreground', !done && !active && 'text-muted-foreground')}>{step.title}</span>
              {index < steps.length - 1 && <ChevronRight className="mx-1 hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />}
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-headline text-xl font-semibold">Paso {current + 1}: {heading}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        {hideBack || current === 0 ? <span /> : (
          <Button type="button" variant="outline" className="h-11" onClick={onBack} disabled={busy}>{backLabel}</Button>
        )}
        <Button type="button" className="h-11" onClick={onNext} disabled={nextDisabled || busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
