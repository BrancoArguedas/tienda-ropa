import { createBrowserRouter, isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { StoreLayout } from './layouts/StoreLayout';
import { HomePage } from '@/pages/store/HomePage';
import { CatalogPage } from '@/pages/store/CatalogPage';
import { ProductPage } from '@/pages/store/ProductPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/** Carga diferida: el código del panel nunca se descarga en la tienda. */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default });

function RouteError() {
  const error = useRouteError();
  // Tras un deploy, un chunk viejo puede no existir: recargar resuelve el caso.
  const chunkFailed = error instanceof Error && /dynamically imported module|Loading chunk/i.test(error.message);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl">{isRouteErrorResponse(error) && error.status === 404 ? 'Página no encontrada' : 'Algo salió mal'}</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        {chunkFailed ? 'Hay una versión nueva de la página.' : 'Ocurrió un error inesperado. Inténtalo de nuevo.'}
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-ink px-5 py-2.5 text-sm text-cream">
          Recargar
        </button>
        <Link to="/" className="rounded-full border border-ink/15 px-5 py-2.5 text-sm">Ir al inicio</Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'categoria/:slug', element: <CatalogPage /> },
      { path: 'ofertas', element: <CatalogPage onSale /> },
      { path: 'producto/:slug', element: <ProductPage /> },
      // Páginas legales (Ley 29733, Código del Consumidor, Libro de Reclamaciones)
      { path: 'privacidad', lazy: page(() => import('@/pages/store/legal/PrivacyPage')) },
      { path: 'terminos', lazy: page(() => import('@/pages/store/legal/TermsPage')) },
      { path: 'cookies', lazy: page(() => import('@/pages/store/legal/CookiesPage')) },
      { path: 'libro-de-reclamaciones', lazy: page(() => import('@/pages/store/legal/ComplaintBookPage')) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin/login',
    errorElement: <RouteError />,
    lazy: page(() => import('@/pages/admin/LoginPage')),
  },
  {
    path: 'admin',
    errorElement: <RouteError />,
    lazy: async () => ({ Component: (await import('./layouts/AdminLayout')).AdminLayout }),
    children: [
      { index: true, lazy: page(() => import('@/pages/admin/DashboardPage')) },
      { path: 'pedidos', lazy: page(() => import('@/pages/admin/OrdersPage')) },
      { path: 'pedidos/:id', lazy: page(() => import('@/pages/admin/OrderDetailPage')) },
      { path: 'productos', lazy: page(() => import('@/pages/admin/ProductsPage')) },
      { path: 'productos/nuevo', lazy: page(() => import('@/pages/admin/ProductFormPage')) },
      { path: 'productos/:id', lazy: page(() => import('@/pages/admin/ProductFormPage')) },
      { path: 'promociones', lazy: page(() => import('@/pages/admin/PromotionsPage')) },
      { path: 'promociones/nueva', lazy: page(() => import('@/pages/admin/PromotionFormPage')) },
      { path: 'promociones/:id', lazy: page(() => import('@/pages/admin/PromotionFormPage')) },
      { path: 'categorias', lazy: page(() => import('@/pages/admin/CatalogSetupPage')) },
      { path: 'ajustes', lazy: page(() => import('@/pages/admin/SettingsPage')) },
      { path: 'reclamos', lazy: page(() => import('@/pages/admin/ComplaintsPage')) },
      { path: 'reclamos/:id', lazy: page(() => import('@/pages/admin/ComplaintDetailPage')) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
