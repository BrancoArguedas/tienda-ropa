# Diana Store — tienda de ropa con pedidos por WhatsApp

E-commerce sin pasarela de pago: el cliente arma su carrito, deja su nombre y teléfono, acepta la política de privacidad y se abre WhatsApp con el resumen.
Cada envío queda como pedido **pendiente** en el panel, donde se confirma (descuenta stock) o se marca como no concretado.

- `backend/` — Laravel 12 (API REST, Sanctum SPA)
- `frontend/` — React 18 + TypeScript + Vite + Tailwind + TanStack Query
- `docker/` — PHP-FPM 8.3, nginx y MySQL 8.4

## Puesta en marcha (desarrollo)

```bash
cp .env.example .env                                  # opcional: contraseñas de MySQL (por defecto secret/rootsecret)
docker compose up -d --build
docker compose exec app php artisan migrate --seed   # solo la primera vez
```

| Servicio | URL |
|---|---|
| Tienda | http://localhost:5173 |
| Panel | http://localhost:5173/admin (`admin@tienda.test` / `password`, **solo en local**) |
| API (nginx) | http://localhost:8000/api |
| MySQL | `127.0.0.1:3307` (solo accesible desde esta máquina) |

Los puertos se publican solo en `127.0.0.1`: nadie de la red local puede entrar a la base de datos ni al panel de desarrollo.

## Pruebas

```bash
docker compose exec app php artisan test     # Pest: pedidos, stock, promociones, seguridad, ARCO, Libro de Reclamaciones
docker compose exec frontend npm test        # Vitest: carrito, checkout (consentimiento), useDebounce
docker compose exec frontend npm run build   # typecheck + build de producción
docker compose exec app composer audit       # vulnerabilidades en dependencias PHP
docker compose exec frontend npm audit --omit=dev
```

## Rutas

Tienda: `/`, `/catalogo`, `/categoria/:slug`, `/ofertas`, `/producto/:slug`.
Legales: `/privacidad`, `/terminos`, `/cookies`, `/libro-de-reclamaciones`.
Panel (carga diferida): `/admin`, `/admin/pedidos`, `/admin/productos`, `/admin/promociones`, `/admin/categorias`, `/admin/reclamos`, `/admin/ajustes`.

## Seguridad implementada

- **Panel solo para administradores** (`users.is_admin` + middleware `admin`); un usuario sin rol recibe 403 y no puede iniciar sesión.
- **Rate limiting**: login (5/min por cuenta y 20/min por IP), pedidos (10/min y 40/día por IP), reclamos (5/hora), API pública (90/min), panel (180/min).
- **Honeypot** anti-bots en el checkout y en el Libro de Reclamaciones.
- **Datos personales cifrados en reposo** (teléfono, notas y mensaje de WhatsApp del pedido) con `APP_KEY`; la búsqueda por teléfono usa un hash HMAC.
- **Cabeceras** CSP, X-Frame-Options, nosniff, Referrer-Policy y Permissions-Policy (`docker/nginx/security-headers.conf`); nginx solo ejecuta `index.php`.
- **Fuentes autoalojadas** (sin Google Fonts): ningún tercero recibe la IP del visitante.
- Precios recalculados en el servidor, imágenes re-codificadas a WebP con nombre aleatorio y sesión por cookie HttpOnly + CSRF.

## Despliegue a producción (checklist)

1. `cp .env.example .env` en la raíz y define `DB_PASSWORD` / `DB_ROOT_PASSWORD` largas y aleatorias.
2. `cp backend/.env.production.example backend/.env` y completa los valores `<...>`: dominio, SMTP y `APP_DEBUG=false`.
3. Compila el frontend: `cd frontend && npm ci && npm run build`.
4. `docker compose -f docker-compose.prod.yml up -d --build`.
5. `docker compose -f docker-compose.prod.yml exec app php artisan key:generate` (**solo la primera vez**; si cambias `APP_KEY` se pierden los datos cifrados).
6. `... exec app php artisan migrate --force` y luego `... exec app php artisan admin:create tu@correo.com` (contraseña de 12+ caracteres).
7. `... exec app php artisan storage:link` y `... exec app php artisan config:cache route:cache`.
8. Pon delante un proxy con **HTTPS** (Caddy, Cloudflare...) que apunte a `127.0.0.1:8080` y envíe `Strict-Transport-Security`.
9. En **Panel → Ajustes**: número de WhatsApp, **razón social, RUC, domicilio legal, correo ARCO y correo de reclamos**.
10. Haz una prueba: un pedido y una hoja de reclamación. Verifica que llegue el correo.

El servicio `scheduler` anonimiza cada mes los pedidos cerrados que superan el plazo de conservación (`php artisan orders:anonymize --dry-run` para ver cuántos serían).

## Cumplimiento legal (Perú)

Implementado en el código:

- **Ley 29733 y Reglamento DS 016-2024-JUS**: política de privacidad, consentimiento expreso no premarcado (se guarda la fecha y la versión aceptada), plazo de conservación con anonimización automática, y derechos ARCO desde el detalle del pedido (exportar = acceso, anonimizar = cancelación).
- **Código de Protección y Defensa del Consumidor (Ley 29571)**: términos y condiciones, identificación del proveedor (razón social y RUC en el pie de página).
- **Libro de Reclamaciones virtual (DS 011-2011-PCM, mod. DS 101-2022-PCM)**: hoja con número correlativo, constancia por correo al consumidor y a la tienda, plazo de 15 días hábiles visible en el panel, y respuesta por correo.

Pendiente fuera del código (responsabilidad del negocio):

- [ ] Inscribir los bancos de datos **"Clientes"** y **"Reclamaciones"** en el Registro Nacional de Protección de Datos Personales (ANPD – MINJUSDH).
- [ ] Elaborar el documento de seguridad y designar a la persona responsable del tratamiento de datos.
- [ ] Responder cada reclamo dentro de los **15 días hábiles** y conservar las hojas al menos **2 años**.
- [ ] Exhibir en el local físico (si existe) el aviso del Libro de Reclamaciones.
- [ ] **Revisar los textos legales con un abogado**: son una plantilla adaptada a esta tienda, no asesoría legal. Si cambias la política de privacidad, actualiza `PRIVACY_POLICY_VERSION`.
