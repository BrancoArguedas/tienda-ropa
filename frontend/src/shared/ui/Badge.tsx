import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Tone = 'neutral' | 'clay' | 'sage' | 'amber' | 'red' | 'dark';

const tones: Record<Tone, string> = {
  neutral: 'bg-cream-200 text-ink-soft',
  clay: 'bg-clay text-white',
  sage: 'bg-sage-light text-sage',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  dark: 'bg-ink text-cream',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}
