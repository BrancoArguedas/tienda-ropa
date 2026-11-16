import type { Price } from '@/shared/api/types';
import { useMoney } from '@/features/store/useStoreSettings';
import { cn } from '@/shared/lib/cn';

export function PriceTag({ price, size = 'md' }: { price: Price; size?: 'md' | 'lg' }) {
  const money = useMoney();
  const discounted = Number(price.discount) > 0;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2', size === 'lg' ? 'text-2xl' : 'text-sm')}>
      <span className={cn('font-semibold', discounted && 'text-clay')}>{money(price.final)}</span>
      {discounted && (
        <span className={cn('text-ink-muted line-through', size === 'lg' ? 'text-base' : 'text-xs')}>{money(price.original)}</span>
      )}
    </div>
  );
}
