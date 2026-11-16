import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCurrentAdmin, useLogout } from '@/features/admin/auth/useAuth';
import { useDashboard } from '@/features/admin/hooks/useAdminQueries';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Spinner } from '@/shared/ui/Spinner';
import { cn } from '@/shared/lib/cn';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/admin', label: 'Resumen', icon: 'grid', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: 'receipt' },
  { to: '/admin/productos', label: 'Productos', icon: 'box' },
  { to: '/admin/promociones', label: 'Promociones', icon: 'tag' },
  { to: '/admin/categorias', label: 'Categorías y atributos', icon: 'layers' },
  { to: '/admin/reclamos', label: 'Libro de Reclamaciones', icon: 'alert' },
  { to: '/admin/ajustes', label: 'Ajustes', icon: 'settings' },
];

/** Protege el panel: sin sesión → login. */
export function AdminLayout() {
  const { data: user, isLoading } = useCurrentAdmin();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-ink-muted" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return <AdminShell userName={user.name} />;
}

function AdminShell({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  // El badge de pendientes reutiliza la consulta del dashboard (cacheada), sin llamadas extra.
  const { data: dashboard } = useDashboard();
  const pending = dashboard?.orders_by_status.pending ?? 0;

  const nav = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Panel">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition', isActive ? 'bg-ink text-cream' : 'text-ink-soft hover:bg-ink/5')
          }
        >
          <Icon name={item.icon} className="h-[18px] w-[18px]" />
          <span className="flex-1">{item.label}</span>
          {item.to === '/admin/pedidos' && pending > 0 && (
            <span className="rounded-full bg-clay px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${pending} pendientes`}>{pending}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream-100 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-[250px] border-r border-cream-300 bg-white transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between border-b border-cream-300 px-5">
          <Link to="/admin" className="font-display text-xl">Panel</Link>
          <Link to="/" target="_blank" className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            Ver tienda <Icon name="external" className="h-3.5 w-3.5" />
          </Link>
        </div>
        {nav}
        <div className="absolute inset-x-0 bottom-0 border-t border-cream-300 p-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <button type="button" onClick={() => logout.mutate()} className="mt-1 flex items-center gap-2 text-xs text-ink-muted hover:text-ink">
            <Icon name="logout" className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-cream-300 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="-ml-1 rounded-full p-2" aria-label="Abrir menú">
            <Icon name="menu" />
          </button>
          <span className="font-display text-lg">Panel</span>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
