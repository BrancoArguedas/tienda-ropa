import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

/** Solo hay almacenamiento técnico: no se requiere banner de consentimiento (no hay analítica ni publicidad). */
export default function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies">
      {() => (
        <>
          <p>
            Este sitio <strong>no usa cookies de analítica, publicidad ni de redes sociales</strong>, y no carga contenido de terceros que te
            rastree. Por eso no te mostramos un aviso de cookies.
          </p>

          <h2>Lo que sí guardamos en tu navegador</h2>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Para qué sirve</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>tienda-cart</td>
                  <td>Almacenamiento local</td>
                  <td>Recordar los productos de tu carrito. No contiene datos personales.</td>
                  <td>Hasta que vacíes el carrito</td>
                </tr>
                <tr>
                  <td>XSRF-TOKEN</td>
                  <td>Cookie técnica</td>
                  <td>Seguridad: evita que otros sitios envíen formularios en tu nombre.</td>
                  <td>Sesión</td>
                </tr>
                <tr>
                  <td>Cookie de sesión</td>
                  <td>Cookie técnica</td>
                  <td>Solo para el personal de la tienda que inicia sesión en el panel.</td>
                  <td>Sesión</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>¿Puedo borrarlas?</h2>
          <p>
            Sí, desde la configuración de tu navegador. Si borras el almacenamiento local se vaciará tu carrito. Más información en nuestra{' '}
            <Link to="/privacidad">Política de privacidad</Link>.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
