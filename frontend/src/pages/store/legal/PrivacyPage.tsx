import { Link } from 'react-router-dom';
import { ContactEmail, formatVersion, LegalLayout, OwnerLine } from './LegalLayout';

/** Política de privacidad – Ley 29733 y su Reglamento (DS 016-2024-JUS). */
export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      {(settings, owner) => (
        <>
          <p className="text-sm text-ink-muted">Versión vigente: {formatVersion(settings.legal.privacy_policy_version)}</p>

          <h2>1. ¿Quién es responsable de tus datos?</h2>
          <p>
            El titular del banco de datos personales es <OwnerLine owner={owner} />. Tratamos tus datos conforme a la Ley N.° 29733, Ley de Protección
            de Datos Personales, y su Reglamento aprobado por Decreto Supremo N.° 016-2024-JUS. Para cualquier consulta escríbenos a{' '}
            <ContactEmail owner={owner} />.
          </p>

          <h2>2. ¿Qué datos recopilamos?</h2>
          <ul>
            <li>
              <strong>Al hacer un pedido:</strong> nombre completo, número de teléfono/WhatsApp y, si lo escribes, una nota (por ejemplo, la zona de
              entrega).
            </li>
            <li>
              <strong>Al presentar un reclamo o queja:</strong> nombre, tipo y número de documento, domicilio, teléfono, correo electrónico y, si eres
              menor de edad, el nombre de tu padre, madre o apoderado.
            </li>
          </ul>
          <p>No recopilamos datos sensibles ni datos de tarjetas: el pago se coordina directamente por WhatsApp.</p>

          <h2>3. ¿Para qué usamos tus datos?</h2>
          <ul>
            <li>Registrar y gestionar tu pedido, coordinar el pago, la entrega y cualquier cambio o devolución.</li>
            <li>Atender y responder las hojas del Libro de Reclamaciones, como exige el Código de Protección y Defensa del Consumidor.</li>
            <li>Cumplir obligaciones legales, tributarias y contables.</li>
          </ul>
          <p>
            <strong>No usamos tus datos para publicidad</strong> ni los vendemos o cedemos a terceros. Si en el futuro quisiéramos usarlos para otra
            finalidad, te pediremos un consentimiento nuevo y separado.
          </p>

          <h2>4. Base legal</h2>
          <p>
            Tratamos tus datos con tu consentimiento libre, previo, expreso, informado e inequívoco, que otorgas al marcar la casilla de aceptación,
            y porque son necesarios para ejecutar la compra que solicitas. Los datos del Libro de Reclamaciones se tratan para cumplir una obligación
            legal.
          </p>

          <h2>5. ¿Cuánto tiempo los conservamos?</h2>
          <ul>
            <li>
              <strong>Pedidos:</strong> {owner.retentionMonths} meses desde su registro. Luego tus datos personales se anonimizan automáticamente y
              solo conservamos los importes con fines contables.
            </li>
            <li>
              <strong>Reclamaciones:</strong> como mínimo dos (2) años desde su registro, como lo exige la normativa del Libro de Reclamaciones.
            </li>
          </ul>

          <h2>6. ¿Con quién compartimos tus datos?</h2>
          <p>Solo con los proveedores que necesitamos para operar, que actúan por encargo nuestro:</p>
          <ul>
            <li>
              <strong>WhatsApp (Meta Platforms, Inc., Estados Unidos):</strong> al enviar tu pedido, el resumen viaja por WhatsApp. Esto implica un
              flujo transfronterizo de datos, que se rige además por las condiciones y la política de privacidad de WhatsApp.
            </li>
            <li>
              <strong>Proveedor de alojamiento web y correo electrónico:</strong> donde se guarda la base de datos y desde donde se envían las
              constancias del Libro de Reclamaciones.
            </li>
            <li>Autoridades competentes (por ejemplo, INDECOPI o SUNAT), cuando la ley lo exija.</li>
          </ul>

          <h2>7. ¿Cómo protegemos tus datos?</h2>
          <p>
            Aplicamos medidas de seguridad técnicas y organizativas: conexión cifrada (HTTPS), cifrado en la base de datos del teléfono y las notas de
            los pedidos, acceso al panel restringido a personal autorizado con contraseña, registro de accesos y límites contra intentos abusivos.
          </p>

          <h2>8. Tus derechos (ARCO)</h2>
          <p>Como titular de tus datos puedes ejercer en cualquier momento, de forma gratuita, los derechos de:</p>
          <ul>
            <li><strong>Acceso:</strong> saber qué datos tuyos tenemos y cómo los usamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Cancelación:</strong> pedir que eliminemos tus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerte a un tratamiento concreto por un motivo legítimo.</li>
            <li>También a revocar tu consentimiento y a la portabilidad de tus datos.</li>
          </ul>
          <p>
            Escríbenos a <ContactEmail owner={owner} /> indicando tu nombre, el derecho que quieres ejercer, el teléfono usado en tu pedido y una copia
            de tu documento de identidad. Responderemos dentro de los plazos legales (hasta 20 días hábiles para el derecho de acceso y 10 días
            hábiles para los demás). Si no estás conforme con nuestra respuesta, puedes acudir a la Autoridad Nacional de Protección de Datos
            Personales del Ministerio de Justicia y Derechos Humanos.
          </p>

          <h2>9. Menores de edad</h2>
          <p>
            Nuestra tienda está dirigida a mayores de edad. Si eres menor de 14 años, necesitas el consentimiento de tu padre, madre o tutor para
            enviarnos tus datos.
          </p>

          <h2>10. Cookies</h2>
          <p>
            Solo usamos cookies técnicas imprescindibles. Más detalles en nuestra <Link to="/cookies">Política de cookies</Link>.
          </p>

          <h2>11. Cambios en esta política</h2>
          <p>
            Si modificamos esta política publicaremos la nueva versión en esta página con su fecha. Registramos qué versión aceptaste en cada pedido.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
