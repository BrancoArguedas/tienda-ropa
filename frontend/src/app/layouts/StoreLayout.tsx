import { useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { useCatalogFilters } from '@/features/catalog/hooks/useCatalogQueries';
import { SearchAutocomplete } from '@/features/catalog/components/SearchAutocomplete';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { cartSelectors, useCartStore, useCartUi } from '@/features/cart/cartStore';
import { Drawer } from '@/shared/ui/Drawer';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/lib/cn';

/** Solo enlaces http(s): un "javascript:" guardado en Ajustes nunca llega a un href. */
const safeUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
      <path d="M9 8h7M9 11.5h5" />
    </svg>
  );
}

export function StoreLayout() {
  const { data: settings } = useStoreSettings();
  const { data: filters, isLoading } = useCatalogFilters();
  const count = useCartStore(cartSelectors.count);
  const openCart = useCartUi((s) => s.setOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn('text-sm transition hover:text-ink', isActive ? 'font-semibold text-ink' : 'text-ink-soft');

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-ink py-2 text-center text-xs tracking-wide text-cream">
        Compra fácil: arma tu carrito y envíanos tu pedido por WhatsApp
      </div>
      <header className="sticky top-0 z-30 border-b border-cream-300 bg-cream/90 backdrop-blur print:hidden">
        <div className="container-page flex h-16 items-center gap-4">
          <button type="button" className="-ml-2 rounded-full p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Icon name="menu" />
          </button>
          <Link to="/" className="font-display text-2xl leading-none">
            {settings?.store_name ?? <Skeleton className="h-6 w-32" />}
          </Link>
          <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Categorías">
            <NavLink to="/catalogo" end className={navLink}>Todo</NavLink>
            {isLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-16" />)
              : filters?.categories.map((c) => (
                  <NavLink key={c.id} to={`/categoria/${c.slug}`} className={navLink}>
                    {c.name}
                  </NavLink>
                ))}
            <NavLink to="/ofertas" className={({ isActive }) => cn('text-sm font-semibold text-clay', isActive && 'underline underline-offset-4')}>
              Ofertas
            </NavLink>
          </nav>
          <div className="ml-auto hidden w-full max-w-xs md:block">
            <SearchAutocomplete />
          </div>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button type="button" className="rounded-full p-2 md:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar">
              <Icon name="search" />
            </button>
            <button type="button" onClick={() => openCart(true)} className="relative rounded-full p-2 hover:bg-ink/5" aria-label={`Carrito (${count} productos)`}>
              <Icon name="bag" className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-clay px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="container-page pb-3 md:hidden">
            <SearchAutocomplete autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        )}
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menú" side="left">
        <nav className="flex flex-col gap-1 p-5" aria-label="Categorías">
          <NavLink to="/catalogo" end onClick={() => setMenuOpen(false)} className="py-2 font-display text-xl">Todo</NavLink>
          {filters?.categories.map((c) => (
            <div key={c.id}>
              <NavLink to={`/categoria/${c.slug}`} onClick={() => setMenuOpen(false)} className="block py-2 font-display text-xl">
                {c.name}
              </NavLink>
              {c.children.map((child) => (
                <NavLink key={child.id} to={`/categoria/${child.slug}`} onClick={() => setMenuOpen(false)} className="block py-1.5 pl-4 text-sm text-ink-soft">
                  {child.name}
                </NavLink>
              ))}
            </div>
          ))}
          <NavLink to="/ofertas" onClick={() => setMenuOpen(false)} className="py-2 font-display text-xl text-clay">Ofertas</NavLink>
        </nav>
      </Drawer>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-cream-300 bg-cream-200/60 print:hidden">
        <div className="container-page grid gap-8 py-12 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl">{settings?.store_name}</p>
            <p className="mt-2 text-sm text-ink-muted">{settings?.store_tagline}</p>
          </div>
          <div className="text-sm text-ink-soft">
            <p className="mb-2 font-semibold text-ink">¿Cómo comprar?</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Elige tus prendas, talla y color.</li>
              <li>Pulsa “Comprar por WhatsApp”.</li>
              <li>Coordina pago y entrega por chat.</li>
            </ol>
          </div>
          <div className="text-sm text-ink-soft">
            {settings?.address && <p className="mb-3">{settings.address}</p>}
            <div className="flex gap-3">
              {safeUrl(settings?.instagram_url) && (
                <a href={settings!.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-cream-300 p-2 hover:bg-white">
                  <Icon name="instagram" />
                </a>
              )}
              {safeUrl(settings?.facebook_url) && (
                <a href={settings!.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full border border-cream-300 p-2 hover:bg-white">
                  <Icon name="facebook" />
                </a>
              )}
            </div>
            <Link
              to="/libro-de-reclamaciones"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-ink/20 bg-white px-3 py-2 text-ink hover:border-ink"
            >
              <BookIcon />
              <span className="font-medium">Libro de Reclamaciones</span>
            </Link>
          </div>
        </div>
        <div className="border-t border-cream-300">
          <div className="container-page flex flex-col items-center gap-3 py-4 text-xs text-ink-muted md:flex-row md:justify-between">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} {settings?.legal.legal_name || settings?.store_name}
              {settings?.legal.ruc && <> · RUC {settings.legal.ruc}</>}
            </p>
            <nav aria-label="Información legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <Link to="/terminos" className="hover:text-ink">Términos y condiciones</Link>
              <Link to="/privacidad" className="hover:text-ink">Política de privacidad</Link>
              <Link to="/cookies" className="hover:text-ink">Cookies</Link>
              <Link to="/libro-de-reclamaciones" className="hover:text-ink">Libro de Reclamaciones</Link>
            </nav>
          </div>
        </div>
      </footer>

      <CartDrawer />
      <ScrollRestoration />
    </div>
  );
}
