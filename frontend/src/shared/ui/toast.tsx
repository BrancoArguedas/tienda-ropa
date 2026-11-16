import { create } from 'zustand';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { id, kind, message }] });
    window.setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm animate-pop-in items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg',
            t.kind === 'error' ? 'bg-red-700 text-white' : 'bg-ink text-cream',
          )}
        >
          <Icon name={t.kind === 'error' ? 'alert' : 'check'} className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
            <Icon name="close" className="h-4 w-4 opacity-70" />
          </button>
        </div>
      ))}
    </div>
  );
}
