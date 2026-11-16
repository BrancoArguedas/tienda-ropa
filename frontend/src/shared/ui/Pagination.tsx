import { Icon } from './Icon';

interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, lastPage, total, onChange }: PaginationProps) {
  if (lastPage <= 1) {
    return <p className="mt-4 text-sm text-ink-muted">{total} resultado{total === 1 ? '' : 's'}</p>;
  }
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginación">
      <p className="text-ink-muted">
        Página {page} de {lastPage} · {total} resultados
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-full border border-cream-300 bg-white p-2 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full border border-cream-300 bg-white p-2 disabled:opacity-40"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
          aria-label="Página siguiente"
        >
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
