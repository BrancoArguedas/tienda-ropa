import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, side = 'right', children, footer }: DrawerProps) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className={cn(
          'absolute top-0 flex h-full w-full max-w-md flex-col bg-cream-100 shadow-2xl',
          side === 'right' ? 'right-0 animate-slide-in' : 'left-0 animate-fade-in',
        )}
      >
        <header className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
          <h2 className="text-xl">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ink/5" aria-label="Cerrar">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-cream-300 p-5">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
