import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAdminComplaint, useAnswerComplaint } from '@/features/admin/hooks/useAdminQueries';
import { useMoney } from '@/features/store/useStoreSettings';
import { getApiError } from '@/shared/api/httpClient';
import { formatDateTime, formatShortDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Field, Textarea } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';

export default function ComplaintDetailPage() {
  const id = Number(useParams().id);
  const { data: c, isLoading, isError, refetch } = useAdminComplaint(id);
  const answer = useAnswerComplaint(id);
  const [response, setResponse] = useState('');
  const money = useMoney();

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (isError || !c) return <ErrorState onRetry={() => refetch()} />;

  const answerError = answer.error ? getApiError(answer.error) : null;

  return (
    <>
      <Link to="/admin/reclamos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <Icon name="chevronLeft" className="h-4 w-4" /> Libro de Reclamaciones
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">{c.number}</h1>
          <Badge tone={c.type === 'claim' ? 'amber' : 'sage'}>{c.type_label}</Badge>
          {c.status === 'answered' ? <Badge tone="sage">Respondida</Badge> : c.overdue ? <Badge tone="red">Plazo vencido</Badge> : <Badge tone="amber">Por responder</Badge>}
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Presentada el {formatDateTime(c.created_at)} · Vence el {formatShortDate(`${c.due_at}T12:00:00`)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-sans text-sm font-semibold">Detalle</h2>
            <p className="whitespace-pre-line text-sm">{c.detail}</p>
            <h3 className="mb-1 mt-4 font-sans text-sm font-semibold">Pedido del consumidor</h3>
            <p className="whitespace-pre-line text-sm">{c.consumer_request}</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-sans text-sm font-semibold">Respuesta del proveedor</h2>
            {c.status === 'answered' ? (
              <>
                <p className="whitespace-pre-line text-sm">{c.provider_response}</p>
                <p className="mt-3 text-xs text-ink-muted">
                  Enviada a {c.email} el {c.answered_at && formatDateTime(c.answered_at)}
                  {c.answered_by && ` por ${c.answered_by}`}.
                </p>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  answer.mutate(response.trim());
                }}
                className="space-y-3"
              >
                <Field
                  label="Respuesta"
                  htmlFor="response"
                  error={answerError?.errors?.response?.[0]}
                  hint={`Se enviará por correo a ${c.email}. Una vez enviada no se puede modificar.`}
                >
                  <Textarea id="response" rows={6} value={response} onChange={(e) => setResponse(e.target.value)} maxLength={5000} />
                </Field>
                {answerError && !answerError.errors?.response && <p className="text-sm text-red-700">{answerError.message}</p>}
                <Button type="submit" loading={answer.isPending} disabled={response.trim().length < 10}>
                  Enviar respuesta
                </Button>
              </form>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="mb-3 font-sans text-sm font-semibold">Consumidor</h2>
            <dl className="space-y-1.5">
              <div><dt className="inline text-ink-muted">Nombre: </dt><dd className="inline">{c.consumer_name}</dd></div>
              <div><dt className="inline text-ink-muted">{c.document_type}: </dt><dd className="inline">{c.document_number}</dd></div>
              <div><dt className="inline text-ink-muted">Domicilio: </dt><dd className="inline">{c.address}</dd></div>
              <div><dt className="inline text-ink-muted">Teléfono: </dt><dd className="inline">{c.phone}</dd></div>
              <div><dt className="inline text-ink-muted">Correo: </dt><dd className="inline break-all">{c.email}</dd></div>
              {c.is_minor && <div><dt className="inline text-ink-muted">Apoderado: </dt><dd className="inline">{c.guardian_name}</dd></div>}
            </dl>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="mb-3 font-sans text-sm font-semibold">Bien contratado</h2>
            <dl className="space-y-1.5">
              <div><dt className="inline text-ink-muted">Tipo: </dt><dd className="inline">{c.item_type_label}</dd></div>
              {c.amount && <div><dt className="inline text-ink-muted">Monto: </dt><dd className="inline">{money(c.amount)}</dd></div>}
              {c.order_code && <div><dt className="inline text-ink-muted">Pedido: </dt><dd className="inline font-mono">{c.order_code}</dd></div>}
              <div><dt className="inline text-ink-muted">Descripción: </dt><dd className="inline">{c.item_description}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
