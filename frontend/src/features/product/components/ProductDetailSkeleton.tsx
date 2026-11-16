import { Skeleton } from '@/shared/ui/Skeleton';

export function ProductDetailSkeleton() {
  return (
    <div className="container-page grid gap-10 py-8 md:grid-cols-2" role="status" aria-label="Cargando producto">
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        <div className="flex gap-2 md:w-20 md:flex-col">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[106px] w-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="aspect-[3/4] flex-1 rounded-2xl" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-3 pt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
