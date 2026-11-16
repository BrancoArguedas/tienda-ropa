import { Link } from 'react-router-dom';
import { ContactEmail, formatVersion, LegalLayout, OwnerLine } from './LegalLayout';

/** Términos y condiciones – Código de Protección y Defensa del Consumidor (Ley 29571). */
export default function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones">
      {(settings, owner) => (
        <>
          <p className="text-sm text-ink-muted">Versión vigente: {formatVersion(settings.legal.privacy_policy_version)}</p>

          <h2>1. Proveedor</h2>
          <p>
            Este sitio web pertenece a <OwnerLine owner={owner} />, que comercializa prendas de vestir bajo el nombre comercial{' '}
            <strong>{settings.store_name}</strong>. Al usar este sitio y realizar un pedido aceptas estos términos.
          </p>

          <h2>2. Cómo comprar</h2>
          <ol>
            <li>Eliges tus productos, talla y color, y los agregas al carrito.</li>
            <li>Completas tu nombre y teléfono. Registramos tu pedido con un código y se abre WhatsApp con el resumen.</li>
            <li>
              Por WhatsApp coordinamos contigo el pago y la entrega. <strong>La compra se perfecciona cuando confirmamos la disponibilidad y
              recibimos tu pago</strong>; hasta entonces el pedido figura como pendiente y no reserva stock.
            </li>
          </ol>

          <h2>3. Precios y pagos</h2>
          <ul>
            <li>Los precios están expresados en soles (S/) e incluyen el IGV.</li>
            <li>
              Los precios y promociones son los vigentes al registrar el pedido; cada promoción indica su plazo. El costo de envío, si lo hubiera,
              se informa por WhatsApp antes de que pagues.
            </li>
            <li>Los medios de pago disponibles se indican por WhatsApp. Nunca te pediremos claves ni datos completos de tarjetas.</li>
            <li>Emitimos el comprobante de pago correspondiente (boleta o factura).</li>
          </ul>

          <h2>4. Disponibilidad</h2>
          <p>
            Todos los productos están sujetos a stock. Si un producto deja de estar disponible después de registrar tu pedido, te lo informaremos y
            podrás elegir otro producto o, si ya pagaste, recibir la devolución completa de tu dinero.
          </p>

          <h2>5. Entregas</h2>
          <p>
            La zona, el costo y el plazo de entrega se coordinan por WhatsApp antes del pago. Revisa tu pedido al recibirlo y avísanos de inmediato
            si encuentras algún problema.
          </p>

          <h2>6. Cambios y devoluciones</h2>
          <ul>
            <li>
              Puedes solicitar un cambio de talla o color dentro de los 7 días calendario de recibido el producto, siempre que la prenda esté sin
              uso, con etiquetas y en su empaque. El costo del envío del cambio se coordina por WhatsApp.
            </li>
            <li>
              Si el producto tiene un defecto o no corresponde a lo que pediste, tienes derecho, a tu elección, a la reparación, la reposición o la
              devolución de lo pagado, según el artículo 97 del Código de Protección y Defensa del Consumidor. En ese caso nosotros asumimos los
              costos de envío.
            </li>
            <li>Por razones de higiene no se aceptan cambios de ropa interior ni trajes de baño, salvo defecto de fábrica.</li>
          </ul>

          <h2>7. Información de los productos</h2>
          <p>
            Procuramos que las fotos y descripciones sean fieles. Puede haber ligeras diferencias de color por la pantalla de cada dispositivo. Usa
            la guía de tallas o consúltanos antes de comprar.
          </p>

          <h2>8. Datos personales</h2>
          <p>
            Tratamos tus datos según nuestra <Link to="/privacidad">Política de privacidad</Link>.
          </p>

          <h2>9. Reclamos y quejas</h2>
          <p>
            Puedes escribirnos a <ContactEmail owner={owner} /> o por WhatsApp. También tienes a tu disposición nuestro{' '}
            <Link to="/libro-de-reclamaciones">Libro de Reclamaciones virtual</Link>, conforme al Código de Protección y Defensa del Consumidor.
            Responderemos en un plazo no mayor a 15 días hábiles.
          </p>

          <h2>10. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se someterá a las autoridades competentes, sin
            perjuicio de tu derecho a acudir al INDECOPI.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
