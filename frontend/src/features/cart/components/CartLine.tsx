import { Link } from 'react-router-dom';
import { useMoney } from '@/features/store/useStoreSettings';
import { Icon } from '@/shared/ui/Icon';
import type { CartItem } from '../cartStore';
import { QuantityStepper } from './QuantityStepper';

interface CartLineProps {
  item: CartItem;
  error?: string;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onNavigate: () => void;
}

export function CartLine({ item, error, onQuantity, onRemove, onNavigate }: CartLineProps) {
  const money = useMoney();
  const discounted = Number(item.originalPrice) > Number(item.unitPrice);

  return (
    <li className="flex gap-4 py-4">
      <Link to={`/producto/${item.slug}`} onClick={onNavigate} className="shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.name} width={80} height={106} className="h-[106px] w-20 rounded-lg object-cover" loading="lazy" />
        ) : (
          <span className="block h-[106px] w-20 rounded-lg bg-cream-200" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/producto/${item.slug}`} onClick={onNavigate} className="text-sm font-medium hover:underline">
            {item.name}
          </Link>
          <button type="button" onClick={onRemove} className="-mr-1 rounded-full p-1 text-ink-muted hover:text-ink" aria-label={`Quitar ${item.name}`}>
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-0.5 text-xs text-ink-muted">
          {item.colorName} · Talla {item.sizeName}
        </p>
        <div className="mt-auto flex items-end justify-between pt-2">
          <QuantityStepper value={item.quantity} max={Math.min(item.stock, 99)} onChange={onQuantity} />
          <div className="text-right text-sm">
            <p className="font-semibold">{money(Number(item.unitPrice) * item.quantity)}</p>
            {discounted && <p className="text-xs text-ink-muted line-through">{money(Number(item.originalPrice) * item.quantity)}</p>}
          </div>
        </div>
        {error && <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700" role="alert">{error}</p>}
      </div>
    </li>
  );
}
