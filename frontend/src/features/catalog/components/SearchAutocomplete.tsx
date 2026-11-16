import { useCallback, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useMoney } from '@/features/store/useStoreSettings';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/lib/cn';
import { useSuggestions } from '../hooks/useCatalogQueries';

/** Buscador con autocompletado: debounce de 300 ms + caché por término + cancelación de la petición anterior. */
export function SearchAutocomplete({ onNavigate, autoFocus }: { onNavigate?: () => void; autoFocus?: boolean }) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(term, 300);
  const { data, isFetching } = useSuggestions(debounced);
  const navigate = useNavigate();
  const money = useMoney();
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(boxRef, close, open);

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const hasTerm = debounced.trim().length >= 2;
  const waiting = term.trim().length >= 2 && (term !== debounced || (isFetching && !data));

  const go = (path: string) => {
    setOpen(false);
    setTerm('');
    onNavigate?.();
    navigate(path);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && products[active]) return go(`/producto/${products[active].slug}`);
    if (term.trim()) go(`/catalogo?q=${encodeURIComponent(term.trim())}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">Buscar productos</label>
        <div className="flex items-center gap-2 rounded-full border border-cream-300 bg-white px-4 focus-within:border-ink">
          <Icon name="search" className="h-4 w-4 text-ink-muted" />
          <input
            id={`${listId}-input`}
            type="search"
            value={term}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder="Buscar vestidos, jeans, blusas…"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-ink-muted/70"
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={open && hasTerm}
            aria-controls={listId}
            aria-autocomplete="list"
          />
        </div>
      </form>

      {open && term.trim().length >= 2 && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-12 z-40 animate-pop-in overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-xl">
          {waiting ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 && categories.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">Sin resultados para “{debounced}”.</p>
          ) : (
            <>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b border-cream-200 p-3">
                  {categories.map((c) => (
                    <button key={c.slug} type="button" onClick={() => go(`/categoria/${c.slug}`)} className="rounded-full bg-cream-200 px-3 py-1 text-xs font-medium hover:bg-cream-300">
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <ul className="max-h-80 overflow-y-auto py-1">
                {products.map((p, i) => (
                  <li key={p.id} role="option" aria-selected={i === active}>
                    <Link
                      to={`/producto/${p.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(`/producto/${p.slug}`);
                      }}
                      className={cn('flex items-center gap-3 px-4 py-2 hover:bg-cream-100', i === active && 'bg-cream-100')}
                    >
                      {p.thumb ? (
                        <img src={p.thumb} alt="" width={40} height={52} className="h-[52px] w-10 rounded object-cover" loading="lazy" />
                      ) : (
                        <span className="h-[52px] w-10 rounded bg-cream-200" />
                      )}
                      <span className="flex-1 text-sm">{p.name}</span>
                      <span className="text-sm font-semibold">{money(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => go(`/catalogo?q=${encodeURIComponent(term.trim())}`)} className="w-full border-t border-cream-200 px-4 py-3 text-left text-sm font-medium hover:bg-cream-100">
                Ver todos los resultados para “{term.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
