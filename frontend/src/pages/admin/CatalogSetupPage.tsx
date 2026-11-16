import { useState, type FormEvent } from 'react';
import {
  useAdminCategories, useCatalogOptions, useDeleteCategory, useDeleteColor, useDeleteSize,
  useSaveCategory, useSaveColor, useSaveSize,
} from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import type { AdminCategory } from '@/features/admin/types';
import { getApiError } from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Field, Input, Select, Toggle } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { Modal } from '@/shared/ui/Modal';
import { Skeleton, TableSkeleton } from '@/shared/ui/Skeleton';

type Errors = Record<string, string | undefined>;

/** Convierte los errores 422 de Laravel en mensajes por campo. */
function fieldErrors(error: unknown): Errors {
  const { message, errors = {} } = getApiError(error);
  const out: Errors = Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]));
  if (Object.keys(out).length === 0) out._ = message;
  return out;
}

function IconButton({ label, icon, onClick, danger }: { label: string; icon: 'trash' | 'settings'; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('rounded-full p-2 text-ink-muted', danger ? 'hover:bg-red-50 hover:text-red-700' : 'hover:bg-ink/5 hover:text-ink')}
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

export default function CatalogSetupPage() {
  return (
    <>
      <PageHeader title="Categorías y atributos" description="Organiza el catálogo y define las tallas y colores disponibles para las variantes." />
      <div className="space-y-8">
        <CategoriesSection />
        <div className="grid gap-8 lg:grid-cols-2">
          <SizesSection />
          <ColorsSection />
        </div>
      </div>
    </>
  );
}

/* ---------------- Categorías ---------------- */

function CategoriesSection() {
  const { data, isLoading, isError, refetch } = useAdminCategories();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);

  const roots = data?.filter((c) => !c.parent_id) ?? [];
  const childrenOf = (id: number) => data?.filter((c) => c.parent_id === id) ?? [];

  const row = (c: AdminCategory, child = false) => (
    <li key={c.id} className={cn('flex items-center gap-3 px-4 py-3', child && 'pl-10')}>
      {child && <span className="text-ink-muted" aria-hidden="true">↳</span>}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', !c.is_active && 'text-ink-muted line-through')}>{c.name}</p>
        <p className="text-xs text-ink-muted">/{c.slug} · {c.products_count ?? 0} productos · orden {c.position}</p>
      </div>
      {!c.is_active && <Badge>Oculta</Badge>}
      <IconButton label={`Editar ${c.name}`} icon="settings" onClick={() => setEditing(c)} />
      <IconButton label={`Eliminar ${c.name}`} icon="trash" danger onClick={() => setToDelete(c)} />
    </li>
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold">Categorías</h2>
        <Button size="sm" onClick={() => setEditing({ is_active: true, position: 0, parent_id: null })}>
          <Icon name="plus" className="h-4 w-4" /> Nueva
        </Button>
      </div>
      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <div className="card"><EmptyState icon="layers" title="Sin categorías" description="Crea categorías como Vestidos, Blusas o Pantalones." /></div>
      ) : (
        <ul className="card divide-y divide-cream-200">
          {roots.map((c) => [row(c), ...childrenOf(c.id).map((child) => row(child, true))])}
        </ul>
      )}

      {editing && <CategoryModal category={editing} roots={roots} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar categoría"
        message={`¿Eliminar “${toDelete?.name}”? Solo es posible si no tiene productos ni subcategorías; si no, desactívala.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      />
    </section>
  );
}

function CategoryModal({ category, roots, onClose }: { category: Partial<AdminCategory>; roots: AdminCategory[]; onClose: () => void }) {
  const save = useSaveCategory();
  const [name, setName] = useState(category.name ?? '');
  const [parentId, setParentId] = useState(category.parent_id ? String(category.parent_id) : '');
  const [position, setPosition] = useState(String(category.position ?? 0));
  const [active, setActive] = useState(category.is_active ?? true);
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErrors({ name: 'Nombre requerido' });
    save.mutate(
      { payload: { name: name.trim(), parent_id: parentId ? Number(parentId) : null, position: Number(position) || 0, is_active: active }, id: category.id },
      { onSuccess: onClose, onError: (err) => setErrors(fieldErrors(err)) },
    );
  };

  return (
    <Modal open onClose={onClose} title={category.id ? 'Editar categoría' : 'Nueva categoría'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre" htmlFor="cat-name" error={errors.name}>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus invalid={!!errors.name} />
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field label="Categoría padre" htmlFor="cat-parent" error={errors.parent_id}>
            <Select id="cat-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">Ninguna (principal)</option>
              {roots.filter((r) => r.id !== category.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Orden" htmlFor="cat-position" error={errors.position}>
            <Input id="cat-position" type="number" min={0} value={position} onChange={(e) => setPosition(e.target.value)} />
          </Field>
        </div>
        <Toggle checked={active} onChange={setActive} label="Visible en la tienda" />
        {errors._ && <p className="field-error">{errors._}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={save.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Tallas ---------------- */

type SizeItem = { id?: number; name: string; position: number };

function SizesSection() {
  const { data, isLoading, isError, refetch } = useCatalogOptions();
  const remove = useDeleteSize();
  const [editing, setEditing] = useState<SizeItem | null>(null);
  const [toDelete, setToDelete] = useState<SizeItem | null>(null);
  const sizes = data?.sizes ?? [];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold">Tallas</h2>
        <Button size="sm" onClick={() => setEditing({ name: '', position: (sizes.at(-1)?.position ?? 0) + 1 })}>
          <Icon name="plus" className="h-4 w-4" /> Nueva
        </Button>
      </div>
      <div className="card p-4">
        {isLoading ? (
          <div className="flex flex-wrap gap-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-16 rounded-full" />)}</div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : sizes.length === 0 ? (
          <p className="text-sm text-ink-muted">Aún no hay tallas.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <li key={s.id} className="inline-flex items-center rounded-full border border-cream-300 bg-cream-100 pl-4 text-sm">
                <button type="button" onClick={() => setEditing(s)} className="py-1.5 pr-1 font-medium hover:underline">{s.name}</button>
                <IconButton label={`Eliminar talla ${s.name}`} icon="trash" danger onClick={() => setToDelete(s)} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-muted">El orden define cómo aparecen en la ficha (XS, S, M…). Toca una talla para editarla.</p>
      </div>

      {editing && <SizeModal size={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar talla"
        message={`¿Eliminar la talla “${toDelete?.name}”? No se puede si algún producto la usa.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete?.id && remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      />
    </section>
  );
}

function SizeModal({ size, onClose }: { size: SizeItem; onClose: () => void }) {
  const save = useSaveSize();
  const [name, setName] = useState(size.name);
  const [position, setPosition] = useState(String(size.position));
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrors({ name: 'Nombre requerido' });
    save.mutate(
      { payload: { name: name.trim(), position: Number(position) || 0 }, id: size.id },
      { onSuccess: onClose, onError: (err) => setErrors(fieldErrors(err)) },
    );
  };

  return (
    <Modal open onClose={onClose} title={size.id ? 'Editar talla' : 'Nueva talla'} size="sm">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <Field label="Nombre" htmlFor="size-name" error={errors.name}>
            <Input id="size-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="M, 38, Única…" autoFocus invalid={!!errors.name} />
          </Field>
          <Field label="Orden" htmlFor="size-position" error={errors.position}>
            <Input id="size-position" type="number" min={0} value={position} onChange={(e) => setPosition(e.target.value)} />
          </Field>
        </div>
        {errors._ && <p className="field-error">{errors._}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={save.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Colores ---------------- */

type ColorItem = { id?: number; name: string; hex: string };

function ColorsSection() {
  const { data, isLoading, isError, refetch } = useCatalogOptions();
  const remove = useDeleteColor();
  const [editing, setEditing] = useState<ColorItem | null>(null);
  const [toDelete, setToDelete] = useState<ColorItem | null>(null);
  const colors = data?.colors ?? [];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold">Colores</h2>
        <Button size="sm" onClick={() => setEditing({ name: '', hex: '#000000' })}>
          <Icon name="plus" className="h-4 w-4" /> Nuevo
        </Button>
      </div>
      <div className="card p-4">
        {isLoading ? (
          <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}</div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : colors.length === 0 ? (
          <p className="text-sm text-ink-muted">Aún no hay colores.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <li key={c.id} className="inline-flex items-center rounded-full border border-cream-300 bg-cream-100 pl-2 text-sm">
                <button type="button" onClick={() => setEditing(c)} className="inline-flex items-center gap-2 py-1.5 pr-1 hover:underline">
                  <span className="h-5 w-5 rounded-full border border-ink/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  {c.name}
                </button>
                <IconButton label={`Eliminar color ${c.name}`} icon="trash" danger onClick={() => setToDelete(c)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <ColorModal color={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar color"
        message={`¿Eliminar el color “${toDelete?.name}”? No se puede si algún producto lo usa.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete?.id && remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      />
    </section>
  );
}

function ColorModal({ color, onClose }: { color: ColorItem; onClose: () => void }) {
  const save = useSaveColor();
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex.toUpperCase());
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = 'Nombre requerido';
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) next.hex = 'Usa el formato #RRGGBB';
    if (Object.keys(next).length) return setErrors(next);
    save.mutate(
      { payload: { name: name.trim(), hex: hex.toUpperCase() }, id: color.id },
      { onSuccess: onClose, onError: (err) => setErrors(fieldErrors(err)) },
    );
  };

  return (
    <Modal open onClose={onClose} title={color.id ? 'Editar color' : 'Nuevo color'} size="sm">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre" htmlFor="color-name" error={errors.name}>
          <Input id="color-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Negro, Beige…" autoFocus invalid={!!errors.name} />
        </Field>
        <Field label="Color" htmlFor="color-hex" error={errors.hex}>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#000000'}
              onChange={(e) => setHex(e.target.value.toUpperCase())}
              className="h-11 w-14 cursor-pointer rounded-lg border border-cream-300 bg-white p-1"
              aria-label="Elegir color"
            />
            <Input id="color-hex" value={hex} onChange={(e) => setHex(e.target.value)} maxLength={7} className="font-mono" invalid={!!errors.hex} />
          </div>
        </Field>
        {errors._ && <p className="field-error">{errors._}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={save.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}
