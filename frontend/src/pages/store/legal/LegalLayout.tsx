import { useEffect, type ReactNode } from 'react';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import type { StoreSettings } from '@/shared/api/types';
import { Skeleton } from '@/shared/ui/Skeleton';

interface LegalLayoutProps {
  title: string;
  updated?: string;
  children: (settings: StoreSettings, owner: OwnerInfo) => ReactNode;
}

export interface OwnerInfo {
  /** Razón social o, si aún no se configuró, el nombre comercial. */
  name: string;
  ruc: string;
  address: string;
  email: string;
  retentionMonths: number;
}

/** Estructura común de las páginas legales: datos del titular desde Ajustes del admin. */
export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  const { data: settings, isLoading } = useStoreSettings();

  useEffect(() => {
    document.title = settings ? `${title} · ${settings.store_name}` : title;
  }, [title, settings]);

  const owner: OwnerInfo | null = settings
    ? {
        name: settings.legal.legal_name || settings.store_name,
        ruc: settings.legal.ruc,
        address: settings.legal.legal_address || settings.address,
        email: settings.legal.privacy_email,
        retentionMonths: settings.legal.data_retention_months || 24,
      }
    : null;

  return (
    <article className="container-page max-w-3xl py-10 md:py-14">
      <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-ink-muted">Última actualización: {updated}</p>}
      <div className="legal-prose mt-8">
        {isLoading || !settings || !owner ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          children(settings, owner)
        )}
      </div>
    </article>
  );
}

/** "Diana Store E.I.R.L. (RUC 20…), con domicilio en …" */
export function OwnerLine({ owner }: { owner: OwnerInfo }) {
  return (
    <>
      <strong>{owner.name}</strong>
      {owner.ruc && <> (RUC {owner.ruc})</>}
      {owner.address && <>, con domicilio en {owner.address}</>}
    </>
  );
}

export function ContactEmail({ owner }: { owner: OwnerInfo }) {
  return owner.email ? (
    <a href={`mailto:${owner.email}`}>{owner.email}</a>
  ) : (
    <>el WhatsApp de la tienda</>
  );
}

export function formatVersion(version: string) {
  const d = new Date(`${version}T12:00:00`);
  return Number.isNaN(d.getTime()) ? version : d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}
