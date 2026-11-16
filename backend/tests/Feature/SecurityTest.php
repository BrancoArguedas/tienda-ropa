<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('niega el panel a un usuario autenticado que no es administrador', function () {
    $this->actingAs(User::factory()->notAdmin()->create())
        ->getJson('/api/admin/orders')
        ->assertForbidden();
});

it('no permite iniciar sesión en el panel a quien no es administrador', function () {
    User::factory()->notAdmin()->create(['email' => 'cliente@example.com']);

    $this->postJson('/api/admin/login', ['email' => 'cliente@example.com', 'password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->assertGuest('web');
});

it('limita el login por IP aunque se roten los correos', function () {
    foreach (range(1, 20) as $i) {
        $this->postJson('/api/admin/login', ['email' => "x{$i}@example.com", 'password' => 'nope'])->assertUnprocessable();
    }

    $this->postJson('/api/admin/login', ['email' => 'x21@example.com', 'password' => 'nope'])->assertTooManyRequests();
});

it('exige el consentimiento de privacidad para registrar el pedido y lo guarda como evidencia', function () {
    $variant = makeVariant();
    $payload = orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]);

    $this->postJson('/api/orders', [...$payload, 'privacy_accepted' => false])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('privacy_accepted');

    $this->postJson('/api/orders', $payload)->assertCreated();

    $order = Order::query()->sole();
    expect($order->privacy_accepted_at)->not->toBeNull()
        ->and($order->privacy_policy_version)->toBe(config('app.privacy_policy_version'));
});

it('rechaza pedidos de bots que llenan el honeypot', function () {
    $variant = makeVariant();

    $this->postJson('/api/orders', [...orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]), 'website' => 'http://spam'])
        ->assertUnprocessable();

    expect(Order::query()->count())->toBe(0);
});

it('cifra el teléfono y las notas en la base de datos y permite buscar por teléfono', function () {
    $variant = makeVariant();
    $this->postJson('/api/orders', [...orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]), 'notes' => 'Av. Larco 123'])
        ->assertCreated();

    $raw = DB::table('orders')->sole();
    expect($raw->customer_phone)->not->toContain('987654321')
        ->and($raw->notes)->not->toContain('Larco')
        ->and($raw->whatsapp_message)->not->toContain('Larco')
        ->and(Order::query()->sole()->customer_phone)->toBe('+51987654321');

    // Con o sin código de país.
    $this->actingAs(User::factory()->create())
        ->getJson('/api/admin/orders?q=987654321')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('rechaza enlaces de redes sociales que no sean http/https', function () {
    $this->actingAs(User::factory()->create())
        ->putJson('/api/admin/settings', [
            'store_name' => 'Tienda',
            'whatsapp_number' => '51987654321',
            'currency_code' => 'PEN',
            'locale' => 'es-PE',
            'instagram_url' => 'javascript:alert(1)',
            'ruc' => '12345',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['instagram_url', 'ruc']);
});

it('expone los datos legales del titular en la tienda sin el correo interno de reclamos', function () {
    $this->actingAs(User::factory()->create())->putJson('/api/admin/settings', [
        'store_name' => 'Tienda',
        'whatsapp_number' => '51987654321',
        'currency_code' => 'PEN',
        'locale' => 'es-PE',
        'legal_name' => 'Diana Store E.I.R.L.',
        'ruc' => '20123456789',
        'privacy_email' => 'privacidad@example.com',
        'claims_email' => 'interno@example.com',
    ])->assertOk();

    $this->getJson('/api/store')
        ->assertOk()
        ->assertJsonPath('legal.ruc', '20123456789')
        ->assertJsonPath('legal.privacy_email', 'privacidad@example.com')
        ->assertJsonMissingPath('legal.claims_email');
});

it('anonimiza un pedido cerrado a pedido del titular (ARCO) y exporta sus datos', function () {
    $admin = User::factory()->create();
    $variant = makeVariant();
    $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]))->assertCreated();
    $order = Order::query()->sole();

    $this->actingAs($admin)->getJson('/api/admin/orders/export?phone=987654321')
        ->assertOk()
        ->assertJsonPath('orders.0.code', $order->code)
        ->assertJsonPath('orders.0.customer_phone', '+51987654321');

    // Un pedido pendiente aún no se puede anonimizar.
    $this->patchJson("/api/admin/orders/{$order->id}/anonymize")->assertUnprocessable();

    $this->patchJson("/api/admin/orders/{$order->id}/cancel")->assertOk();
    $this->patchJson("/api/admin/orders/{$order->id}/anonymize")
        ->assertOk()
        ->assertJsonPath('customer_name', Order::ANONYMIZED_NAME)
        ->assertJsonPath('customer_phone', null);

    expect($order->fresh()->total)->toBe('100.00');
});

it('anonimiza automáticamente solo los pedidos cerrados que superan el plazo de conservación', function () {
    $variant = makeVariant();
    foreach (range(1, 3) as $_) {
        $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]))->assertCreated();
    }
    [$oldClosed, $oldPending, $recentClosed] = Order::query()->orderBy('id')->get();

    $oldClosed->forceFill(['status' => OrderStatus::Cancelled, 'created_at' => now()->subMonths(30)])->save();
    $oldPending->forceFill(['created_at' => now()->subMonths(30)])->save();
    $recentClosed->forceFill(['status' => OrderStatus::Cancelled])->save();

    $this->artisan('orders:anonymize')->assertSuccessful();

    expect($oldClosed->fresh()->anonymized_at)->not->toBeNull()
        ->and($oldPending->fresh()->anonymized_at)->toBeNull()
        ->and($recentClosed->fresh()->anonymized_at)->toBeNull();
});
