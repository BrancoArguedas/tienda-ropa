import type { CatalogOptions } from '../types';
import { cn } from '@/shared/lib/cn';

export interface VariantCell {
  stock: string;
  price_override: string;
  sku: string;
}

export interface MatrixState {
  sizeIds: number[];
  colorIds: number[];
  cells: Record<string, VariantCell>;
}

export const cellKey = (sizeId: number, colorId: number) => `${sizeId}-${colorId}`;
export const emptyCell = (): VariantCell => ({ stock: '0', price_override: '', sku: '' });

interface VariantMatrixProps {
  options: CatalogOptions;
  value: MatrixState;
  onChange: (value: MatrixState) => void;
  error?: string;
}

const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Matriz talla × color: el admin elige tallas y colores y carga stock (y precio opcional) por combinación. */
export function VariantMatrix({ options, value, onChange, error }: VariantMatrixProps) {
  const sizes = options.sizes.filter((s) => value.sizeIds.includes(s.id));
  const colors = options.colors.filter((c) => value.colorIds.includes(c.id));

  const setCell = (key: string, patch: Partial<VariantCell>) =>
    onChange({ ...value, cells: { ...value.cells, [key]: { ...(value.cells[key] ?? emptyCell()), ...patch } } });

  const fillStock = (stock: string) => {
    const cells = { ...value.cells };
    for (const s of sizes) for (const c of colors) cells[cellKey(s.id, c.id)] = { ...(cells[cellKey(s.id, c.id)] ?? emptyCell()), stock };
    onChange({ ...value, cells });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="field-label">Tallas disponibles</p>
        <div className="flex flex-wrap gap-2">
          {options.sizes.map((s) => (
            <button key={s.id} type="button" aria-pressed={value.sizeIds.includes(s.id)} onClick={() => onChange({ ...value, sizeIds: toggle(value.sizeIds, s.id) })}
              className={cn('min-w-[44px] rounded-full border px-3 py-1.5 text-sm', value.sizeIds.includes(s.id) ? 'border-ink bg-ink text-cream' : 'border-cream-300 bg-white')}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="field-label">Colores disponibles</p>
        <div className="flex flex-wrap gap-2">
          {options.colors.map((c) => (
            <button key={c.id} type="button" aria-pressed={value.colorIds.includes(c.id)} onClick={() => onChange({ ...value, colorIds: toggle(value.colorIds, c.id) })}
              className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm', value.colorIds.includes(c.id) ? 'border-ink bg-ink text-cream' : 'border-cream-300 bg-white')}>
              <span className="h-3.5 w-3.5 rounded-full border border-white/40" style={{ backgroundColor: c.hex }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {sizes.length > 0 && colors.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="field-label mb-0">Stock por combinación</p>
            <button type="button" className="text-xs font-medium underline underline-offset-4" onClick={() => {
              const v = window.prompt('Stock para todas las combinaciones:', '10');
              if (v !== null && /^\d+$/.test(v)) fillStock(v);
            }}>
              Rellenar todo
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-cream-300">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-xs text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Color \ Talla</th>
                  {sizes.map((s) => <th key={s.id} className="px-2 py-2 font-medium">{s.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 bg-white">
                {colors.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-normal">
                      <span className="mr-2 inline-block h-3 w-3 rounded-full border border-ink/15 align-middle" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </th>
                    {sizes.map((s) => {
                      const key = cellKey(s.id, c.id);
                      const cell = value.cells[key] ?? emptyCell();
                      return (
                        <td key={s.id} className="px-1.5 py-1.5">
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={cell.stock}
                            onChange={(e) => setCell(key, { stock: e.target.value })}
                            className={cn('w-16 rounded-md border px-2 py-1.5 text-center', Number(cell.stock) === 0 ? 'border-dashed border-cream-300 text-ink-muted' : 'border-cream-300')}
                            aria-label={`Stock ${c.name} talla ${s.name}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-ink-muted">Precio o SKU específico por variante (opcional)</summary>
            <div className="mt-3 grid gap-2">
              {colors.flatMap((c) => sizes.map((s) => {
                const key = cellKey(s.id, c.id);
                const cell = value.cells[key] ?? emptyCell();
                return (
                  <div key={key} className="grid grid-cols-[1fr_120px_160px] items-center gap-2">
                    <span className="text-xs">{c.name} / {s.name}</span>
                    <input type="number" min={0} step="0.01" placeholder="Precio" value={cell.price_override} onChange={(e) => setCell(key, { price_override: e.target.value })} className="field-input py-1.5" aria-label={`Precio ${c.name} ${s.name}`} />
                    <input placeholder="SKU (auto)" value={cell.sku} onChange={(e) => setCell(key, { sku: e.target.value })} className="field-input py-1.5" aria-label={`SKU ${c.name} ${s.name}`} />
                  </div>
                );
              }))}
            </div>
          </details>
        </div>
      ) : (
        <p className="rounded-lg bg-cream-100 p-3 text-sm text-ink-muted">Elige al menos una talla y un color para cargar el stock.</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
