import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'search', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-cream-200 p-4 text-ink-muted">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <h3 className="text-lg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert"
      title="No pudimos cargar la información"
      description={message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
      action={
        onRetry && (
          <button type="button" onClick={onRetry} className="text-sm font-medium underline underline-offset-4">
            Reintentar
          </button>
        )
      }
    />
  );
}
