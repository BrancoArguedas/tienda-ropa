import { useEffect, useState } from 'react';
import type { ProductImage } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';

export function ProductGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [images]);

  const current = images[index] ?? images[0];

  if (!current) {
    return <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-cream-200 text-sm text-ink-muted">Sin imágenes</div>;
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none md:w-20 md:flex-col">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === index}
              className={cn('shrink-0 overflow-hidden rounded-lg border-2 transition', i === index ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              <img src={img.thumb} alt="" width={80} height={106} className="h-[106px] w-20 object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-cream-200">
        <img
          key={current.id}
          src={current.large}
          srcSet={`${current.thumb} 400w, ${current.large} 1200w`}
          sizes="(min-width: 768px) 50vw, 100vw"
          alt={alt}
          width={1200}
          height={1600}
          className="aspect-[3/4] w-full animate-fade-in object-cover"
        />
      </div>
    </div>
  );
}
