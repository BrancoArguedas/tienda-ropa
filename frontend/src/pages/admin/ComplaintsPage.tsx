import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminComplaints } from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import type { ComplaintStatus } from '@/features/admin/types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/lib/cn';
import { formatShortDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Pagination } from '@/shared/ui/Pagination';
import { Skeleton } from '@/shared/ui/Skeleton';

const TABS: { value: ComplaintStatus | ''; label: string }[] = [
  { value: 'pending', label: 'Por responder' },
  { value: 'answered', label: 'Respondidas' },
  { value: '', label: 'Todas' },
];

/** Días hábiles restantes hasta el vencimiento (aprox., sin feriados). */
function businessDaysLeft(due: string) {
  const end = new Date(`${due}T12:00:00`);
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  let n = 0;
  while (d < end) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return n;
}

export default function ComplaintsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('status') ?? 'pending';
  const status = (raw === 'all' ? '' : raw) as ComplaintStatus | '';
  const page = Number(params.get('page') ?? 1);
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);

  const { data, isLoading, isError, refetch } = useAdminComplaints({ status: status || undefined, q: q || undefined, page });

  const setParam = (key: string, value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });

  return (
    <>
      <PageHeader
        title="Libro de Reclamaciones"
        description="Hojas presentadas por los consumidores. El plazo legal de respuesta es de 15 días hábiles."
      />

      {data && data.counts.overdue > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <Icon name="alert" className="h-4 w-4" />
          {data.counts.overdue} hoja{data.counts.overdue === 1 ? '' : 's'} con el plazo vencido. Respóndelas cuanto antes.
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full bg-white p-1" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setParam('status', tab.value || 'all')}
              className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm transition', status === tab.value ? 'bg-ink text-cream' : 'hover:bg-ink/5')}
            >
              {tab.label}
              {tab.value === 'pending' && data && <span className="rounded-full bg-cream-200 px-2 text-xs text-ink">{data.counts.pending}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-cream-300 bg-white px-3 sm:w-72">
          <Icon name="search" className="h-4 w-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setParam('page', '');
            }}
            placeholder="N.° de hoja, nombre o documento…"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
            aria-label="Buscar hojas"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState icon="receipt" title="No hay hojas" description={status === 'pending' ? 'No tienes reclamos ni quejas por responder.' : 'Sin resultados.'} />
      ) : (
        <>
          <ul className="card divide-y divide-cream-200">
            {data.data.map((c) => {
              const left = c.status === 'pending' ? businessDaysLeft(c.due_at) : null;
              return (
                <li key={c.id}>
                  <Link to={`/admin/reclamos/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-cream-100">
                    <span className="font-mono text-sm font-semibold">{c.number}</span>
                    <Badge tone={c.type === 'claim' ? 'amber' : 'sage'}>{c.type_label}</Badge>
                    <span className="min-w-0 flex-1 truncate text-sm">{c.consumer_name}</span>
                    <span className="text-xs text-ink-muted">{formatShortDate(c.created_at)}</span>
                    {c.status === 'answered' ? (
                      <Badge tone="sage">Respondida</Badge>
                    ) : c.overdue ? (
                      <Badge tone="red">Vencida</Badge>
                    ) : (
                      <span className={cn('text-xs font-medium', (left ?? 99) <= 3 ? 'text-red-700' : 'text-ink-soft')}>
                        {left} día{left === 1 ? '' : 's'} hábil{left === 1 ? '' : 'es'}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onChange={(p) => setParam('page', String(p))} />
        </>
      )}
    </>
  );
}
