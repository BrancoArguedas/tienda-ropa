<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Promotion;

it('registra el pedido pendiente recalculando precios en el servidor', function () {
    $variant = makeVariant('100.00', stock: 5);

    $response = $this->postJson('/api/orders', orderPayload([
        // El cliente intenta mandar un precio manipulado: se ignora.
        ['variant_id' => $variant->id, 'quantity' => 2, 'price' => '0.01'],
    ]));

    $response->assertCreated()->assertJsonPath('total', '200.00');
    expect($response->json('whatsapp_url'))->toStartWith('https://wa.me/')
        ->and(urldecode($response->json('whatsapp_url')))->toContain($response->json('code'));

    $order = Order::query()->with('items')->sole();
    expect($order->status)->toBe(OrderStatus::Pending)
        ->and($order->customer_phone)->toBe('+51987654321')
        ->and($order->items)->toHaveCount(1)
        ->and($order->items[0]->product_name)->toBe($variant->product->name)
        ->and($variant->fresh()->stock)->toBe(5); // el stock no se toca hasta confirmar
});

it('suma líneas repetidas de la misma variante', function () {
    $variant = makeVariant('50.00', stock: 5);

    $this->postJson('/api/orders', orderPayload([
        ['variant_id' => $variant->id, 'quantity' => 1],
        ['variant_id' => $variant->id, 'quantity' => 2],
    ]))->assertCreated()->assertJsonPath('total', '150.00');

    expect(Order::query()->with('items')->sole()->items->sole()->quantity)->toBe(3);
});

it('rechaza el pedido si no hay stock suficiente', function () {
    $variant = makeVariant(stock: 1);

    $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 3]]))
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ["items.{$variant->id}"]]);

    expect(Order::query()->count())->toBe(0);
});

it('rechaza productos inactivos o inexistentes', function () {
    $variant = makeVariant();
    $variant->product->update(['is_active' => false]);

    $this->postJson('/api/orders', orderPayload([
        ['variant_id' => $variant->id, 'quantity' => 1],
        ['variant_id' => 999999, 'quantity' => 1],
    ]))->assertUnprocessable();
});

it('aplica la promoción vigente con mayor descuento (por categoría o producto)', function () {
    $variant = makeVariant('200.00');
    $product = $variant->product;

    Promotion::factory()->create(['value' => 10])->categories()->sync([$product->category_id]);
    Promotion::factory()->fixed('50.00')->create()->products()->sync([$product->id]);
    app(\App\Pricing\Contracts\ActivePromotionProvider::class)->flush();

    $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]))
        ->assertCreated()
        ->assertJsonPath('total', '150.00');

    $order = Order::query()->sole();
    expect($order->subtotal)->toBe('200.00')->and($order->discount_total)->toBe('50.00');
});

it('ignora promociones vencidas', function () {
    $variant = makeVariant('80.00');
    Promotion::factory()->expired()->create(['value' => 50])->products()->sync([$variant->product_id]);
    app(\App\Pricing\Contracts\ActivePromotionProvider::class)->flush();

    $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]))
        ->assertCreated()
        ->assertJsonPath('total', '80.00');
});

it('usa el precio específico de la variante cuando existe', function () {
    $variant = makeVariant('100.00', override: '120.00');

    $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]))
        ->assertCreated()
        ->assertJsonPath('total', '120.00');
});

it('valida los datos del cliente', function () {
    $this->postJson('/api/orders', ['customer_name' => '', 'customer_phone' => 'abc', 'items' => []])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['customer_name', 'customer_phone', 'items']);
});
