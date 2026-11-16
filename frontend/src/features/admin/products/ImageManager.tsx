import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getApiError } from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { toast } from '@/shared/ui/toast';
import { adminApi } from '../adminApi';
import type { AdminImage, AdminProduct, CatalogOptions } from '../types';

interface ImageManagerProps {
  product: AdminProduct;
  colors: CatalogOptions['colors'];
}

/**
 * Subida múltiple, orden por arrastre, imagen principal y color por foto.
 * Cada mutación actualiza la caché del producto con la respuesta (sin volver a pedir el producto).
 */
export function ImageManager({ product, colors }: ImageManagerProps) {
  const client = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadColor, setUploadColor] = useState<string>('');
  const [dragId, setDragId] = useState<number | null>(null);
  const key = queryKeys.admin.products.detail(product.id);

  const setImages = (updater: (images: AdminImage[]) => AdminImage[]) => {
    client.setQueryData<AdminProduct>(key, (old) => (old ? { ...old, images: updater(old.images) } : old));
    client.invalidateQueries({ queryKey: ['store'] });
    client.invalidateQueries({ queryKey: ['admin', 'products', 'list'] });
  };
  const onError = (e: unknown) => toast.error(getApiError(e).message);

  const upload = useMutation({
    mutationFn: (files: File[]) => adminApi.uploadImages(product.id, files, uploadColor ? Number(uploadColor) : null),
    onSuccess: (created) => {
      setImages((imgs) => [...imgs, ...created]);
      toast.success(`${created.length} imagen(es) subida(s)`);
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { color_id?: number | null; is_primary?: boolean } }) => adminApi.updateImage(product.id, id, patch),
    onSuccess: (img) =>
      setImages((imgs) => imgs.map((i) => (i.id === img.id ? img : img.is_primary ? { ...i, is_primary: false } : i))),
    onError,
  });

  const reorder = useMutation({
    mutationFn: (ids: number[]) => adminApi.reorderImages(product.id, ids),
    onSuccess: (images) => setImages(() => images),
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteImage(product.id, id),
    // Igual que el backend: si se borró la principal, pasa a serlo la primera restante.
    onSuccess: (_, id) =>
      setImages((imgs) => {
        const removed = imgs.find((i) => i.id === id);
        const rest = imgs.filter((i) => i.id !== id);
        return removed?.is_primary && rest.length > 0 ? rest.map((i, idx) => ({ ...i, is_primary: idx === 0 })) : rest;
      }),
    onError,
  });

  const onDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    const ids = product.images.map((i) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    // Optimista: se reordena en pantalla y luego se confirma con la respuesta del servidor.
    setImages((imgs) => ids.map((id) => imgs.find((i) => i.id === id)!));
    reorder.mutate(ids);
    setDragId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-cream-300 bg-cream-100 p-4">
        <div>
          <label htmlFor="upload-color" className="field-label">Color de las fotos</label>
          <select id="upload-color" value={uploadColor} onChange={(e) => setUploadColor(e.target.value)} className="field-input w-48">
            <option value="">Todos los colores</option>
            {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) upload.mutate(files);
            e.target.value = '';
          }}
        />
        <Button variant="secondary" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
          <Icon name="image" className="h-4 w-4" /> Subir fotos
        </Button>
        <p className="w-full text-xs text-ink-muted">JPG, PNG o WebP · máx. 8 MB · se optimizan automáticamente. Arrastra para ordenar.</p>
      </div>

      {product.images.length === 0 ? (
        <p className="text-sm text-ink-muted">Este producto aún no tiene fotos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {product.images.map((img) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDragId(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(img.id)}
              className={cn('group relative overflow-hidden rounded-xl border bg-white', img.is_primary ? 'border-ink' : 'border-cream-300', dragId === img.id && 'opacity-40')}
            >
              <img src={img.thumb} alt="" width={400} height={533} className="aspect-[3/4] w-full object-cover" loading="lazy" />
              <span className="absolute left-2 top-2 cursor-grab rounded bg-white/90 p-1 text-ink-muted" aria-hidden="true">
                <Icon name="drag" className="h-4 w-4" />
              </span>
              {img.is_primary && <span className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-cream">Principal</span>}
              <div className="space-y-2 p-2">
                <select
                  value={img.color_id ?? ''}
                  onChange={(e) => update.mutate({ id: img.id, patch: { color_id: e.target.value ? Number(e.target.value) : null } })}
                  className="field-input py-1 text-xs"
                  aria-label="Color de la foto"
                >
                  <option value="">Todos los colores</option>
                  {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex justify-between">
                  <button type="button" disabled={img.is_primary} onClick={() => update.mutate({ id: img.id, patch: { is_primary: true } })} className="flex items-center gap-1 text-xs disabled:opacity-40" aria-label="Usar como principal">
                    <Icon name="star" className="h-3.5 w-3.5" /> Principal
                  </button>
                  <button type="button" onClick={() => remove.mutate(img.id)} className="text-xs text-red-700" aria-label="Eliminar foto">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
