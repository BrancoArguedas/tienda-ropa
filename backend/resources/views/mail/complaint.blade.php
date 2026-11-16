<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Hoja de reclamación {{ $c->number }}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;max-width:640px;margin:0 auto;padding:16px">
    <h1 style="font-size:20px;margin:0 0 4px">Libro de Reclamaciones – Hoja N.° {{ $c->number }}</h1>
    <p style="margin:0 0 16px;color:#555">Fecha: {{ $c->created_at->timezone('America/Lima')->format('d/m/Y H:i') }}</p>

    @if ($answered)
        <p>Hola {{ $c->consumer_name }}, respondemos a tu {{ mb_strtolower($c->typeLabel()) }}:</p>
        <div style="border-left:4px solid #1f1f1f;padding:8px 12px;background:#f6f4f0;white-space:pre-line">{{ $c->provider_response }}</div>
        <p style="color:#555">Fecha de respuesta: {{ $c->answered_at?->timezone('America/Lima')->format('d/m/Y') }}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
        <p style="font-weight:bold">Copia de tu hoja:</p>
    @else
        <p>Hola {{ $c->consumer_name }}, registramos tu hoja de reclamación. Te responderemos a este correo a más tardar el
            <strong>{{ $c->due_at->format('d/m/Y') }}</strong> (15 días hábiles).</p>
    @endif

    <h2 style="font-size:15px;margin:16px 0 6px">Proveedor</h2>
    <p style="margin:0">{{ $store['legal_name'] ?: $store['store_name'] }}@if ($store['ruc']) – RUC {{ $store['ruc'] }}@endif<br>
        {{ $store['legal_address'] ?: $store['address'] }}</p>

    <h2 style="font-size:15px;margin:16px 0 6px">1. Identificación del consumidor</h2>
    <p style="margin:0">{{ $c->consumer_name }} – {{ $c->document_type }} {{ $c->document_number }}<br>
        {{ $c->address }}<br>Tel.: {{ $c->phone }} · {{ $c->email }}
        @if ($c->is_minor)<br>Menor de edad. Padre, madre o apoderado: {{ $c->guardian_name }}@endif</p>

    <h2 style="font-size:15px;margin:16px 0 6px">2. Bien contratado</h2>
    <p style="margin:0">{{ $c->itemTypeLabel() }}@if ($c->amount !== null) – Monto reclamado: S/ {{ number_format((float) $c->amount, 2) }}@endif
        @if ($c->order_code)<br>Pedido: {{ $c->order_code }}@endif<br>{{ $c->item_description }}</p>

    <h2 style="font-size:15px;margin:16px 0 6px">3. Detalle de la {{ mb_strtolower($c->typeLabel()) }}</h2>
    <p style="margin:0;white-space:pre-line">{{ $c->detail }}</p>
    <p style="margin:8px 0 0"><strong>Pedido del consumidor:</strong></p>
    <p style="margin:0;white-space:pre-line">{{ $c->consumer_request }}</p>

    <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
    <p style="font-size:12px;color:#555">
        <strong>Reclamo:</strong> disconformidad relacionada a los productos o servicios.
        <strong>Queja:</strong> disconformidad no relacionada a los productos o servicios, o malestar respecto a la atención al público.<br>
        La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
        El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles improrrogables.
    </p>
</body>
</html>
