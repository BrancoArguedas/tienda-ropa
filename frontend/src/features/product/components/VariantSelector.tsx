import type { ColorOption, SizeOption } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';

interface VariantSelectorProps {
  colors: ColorOption[];
  sizes: SizeOption[];
  colorId: number | null;
  sizeId: number | null;
  stockBySize: Map<number, number>;
  onColor: (id: number) => void;
  onSize: (id: number) => void;
  onSizeGuide?: () => void;
}

export function VariantSelector({ colors, sizes, colorId, sizeId, stockBySize, onColor, onSize, onSizeGuide }: VariantSelectorProps) {
  const selectedColor = colors.find((c) => c.id === colorId);
  const selectedStock = sizeId ? stockBySize.get(sizeId) ?? 0 : null;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm">
          Color: <span className="font-semibold">{selectedColor?.name ?? '—'}</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onColor(color.id)}
              aria-pressed={color.id === colorId}
              aria-label={color.name}
              title={color.name}
              className={cn('h-9 w-9 rounded-full border border-ink/15 ring-offset-2 ring-offset-cream transition', color.id === colorId ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-ink/30')}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <div className="mb-2 flex items-center justify-between">
          <legend className="text-sm">Talla</legend>
          {onSizeGuide && (
            <button type="button" onClick={onSizeGuide} className="text-xs font-medium underline underline-offset-4">
              Guía de tallas
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {sizes.map((size) => {
            const stock = stockBySize.get(size.id) ?? 0;
            const disabled = stock <= 0;
            return (
              <button
                key={size.id}
                type="button"
                disabled={disabled}
                onClick={() => onSize(size.id)}
                aria-pressed={size.id === sizeId}
                aria-label={`Talla ${size.name}${disabled ? ' (agotada)' : ''}`}
                className={cn(
                  'relative h-11 rounded-lg border text-sm font-medium transition',
                  size.id === sizeId ? 'border-ink bg-ink text-cream' : 'border-cream-300 bg-white hover:border-ink/60',
                  disabled && 'cursor-not-allowed border-dashed bg-cream-100 text-ink-muted line-through hover:border-cream-300',
                )}
              >
                {size.name}
              </button>
            );
          })}
        </div>
        {selectedStock !== null && selectedStock > 0 && selectedStock <= 3 && (
          <p className="mt-2 text-xs font-medium text-clay">¡Últimas {selectedStock} unidades!</p>
        )}
      </fieldset>
    </div>
  );
}
