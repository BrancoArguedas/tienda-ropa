import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { CatalogFilters, CategoryNode } from '@/shared/api/types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { ProductQueryParams } from '@/features/store/storeApi';

interface FiltersPanelProps {
  filters: CatalogFilters | undefined;
  loading: boolean;
  params: Omit<ProductQueryParams, 'page'>;
  onChange: (patch: { sizes?: number[]; colors?: number[]; min_price?: string; max_price?: string }) => void;
  onClear: () => void;
  activeCount: number;
}

const toggle = (list: number[] = [], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function FiltersPanel({ filters, loading, params, onChange, onClear, activeCount }: FiltersPanelProps) {
  if (loading || !filters) {
    return (
      <div className="space-y-6" role="status" aria-label="Cargando filtros">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-8 w-12 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">Categorías</h3>
        <CategoryTree nodes={filters.categories} />
      </section>

      <section>
        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">Talla</h3>
        <div className="flex flex-wrap gap-2">
          {filters.sizes.map((size) => {
            const selected = params.sizes?.includes(size.id);
            return (
              <button
                key={size.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ sizes: toggle(params.sizes, size.id) })}
                className={cn('min-w-[44px] rounded-full border px-3 py-1.5 text-sm transition', selected ? 'border-ink bg-ink text-cream' : 'border-cream-300 bg-white hover:border-ink/50')}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">Color</h3>
        <div className="flex flex-wrap gap-2.5">
          {filters.colors.map((color) => {
            const selected = params.colors?.includes(color.id);
            return (
              <button
                key={color.id}
                type="button"
                title={color.name}
                aria-label={color.name}
                aria-pressed={selected}
                onClick={() => onChange({ colors: toggle(params.colors, color.id) })}
                className={cn('h-8 w-8 rounded-full border border-ink/15 ring-offset-2 ring-offset-cream transition', selected ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-ink/30')}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </section>

      <PriceRange
        min={params.min_price}
        max={params.max_price}
        bounds={filters.price_range}
        onChange={(min, max) => onChange({ min_price: min, max_price: max })}
      />

      {activeCount > 0 && (
        <button type="button" onClick={onClear} className="text-sm font-medium underline underline-offset-4">
          Limpiar filtros ({activeCount})
        </button>
      )}
    </div>
  );
}

function CategoryTree({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  return (
    <ul className={cn('space-y-1.5', depth > 0 && 'ml-3 mt-1.5 border-l border-cream-300 pl-3')}>
      <li className={depth > 0 ? 'hidden' : undefined}>
        <NavLink to="/catalogo" end className={({ isActive }) => cn('text-sm', isActive ? 'font-semibold' : 'text-ink-soft hover:text-ink')}>
          Todo
        </NavLink>
      </li>
      {nodes.map((node) => (
        <li key={node.id}>
          <NavLink to={`/categoria/${node.slug}`} className={({ isActive }) => cn('text-sm', isActive ? 'font-semibold text-ink' : 'text-ink-soft hover:text-ink')}>
            {node.name}
          </NavLink>
          {node.children.length > 0 && <CategoryTree nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

/** Rango de precio con debounce: no dispara una petición por cada tecla. */
function PriceRange({ min, max, bounds, onChange }: { min?: number; max?: number; bounds: { min: number; max: number }; onChange: (min?: string, max?: string) => void }) {
  const [localMin, setLocalMin] = useState(min?.toString() ?? '');
  const [localMax, setLocalMax] = useState(max?.toString() ?? '');
  const debouncedMin = useDebounce(localMin, 500);
  const debouncedMax = useDebounce(localMax, 500);

  useEffect(() => {
    setLocalMin(min?.toString() ?? '');
    setLocalMax(max?.toString() ?? '');
  }, [min, max]);

  useEffect(() => {
    if (debouncedMin !== (min?.toString() ?? '') || debouncedMax !== (max?.toString() ?? '')) {
      onChange(debouncedMin || undefined, debouncedMax || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  return (
    <section>
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">Precio</h3>
      <div className="flex items-center gap-2">
        <input type="number" inputMode="decimal" min={0} placeholder={`${Math.floor(bounds.min)}`} value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="field-input" aria-label="Precio mínimo" />
        <span className="text-ink-muted">–</span>
        <input type="number" inputMode="decimal" min={0} placeholder={`${Math.ceil(bounds.max)}`} value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="field-input" aria-label="Precio máximo" />
      </div>
    </section>
  );
}
