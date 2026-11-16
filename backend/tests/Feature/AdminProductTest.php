<?php

use App\Models\Category;
use App\Models\Color;
use App\Models\Product;
use App\Models\Size;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

it('crea un producto con su matriz de variantes y genera SKU y slug', function () {
    $category = Category::factory()->create();
    [$s, $m] = Size::factory()->count(2)->create();
    $color = Color::factory()->create();

    $response = $this->postJson('/api/admin/products', [
        'category_id' => $category->id,
        'name' => 'Blusa de seda',
        'base_price' => '89.90',
        'is_active' => true,
        'variants' => [
            ['size_id' => $s->id, 'color_id' => $color->id, 'stock' => 3],
            ['size_id' => $m->id, 'color_id' => $color->id, 'stock' => 0, 'price_override' => '99.90'],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('slug', 'blusa-de-seda')
        ->assertJsonCount(2, 'variants');
    expect($response->json('variants.0.sku'))->not->toBeEmpty();

    // Segundo producto con el mismo nombre → slug único.
    $this->postJson('/api/admin/products', [
        'category_id' => $category->id, 'name' => 'Blusa de seda', 'base_price' => 10,
    ])->assertCreated()->assertJsonPath('slug', 'blusa-de-seda-2');
});

it('rechaza combinaciones de talla y color repetidas', function () {
    $category = Category::factory()->create();
    $size = Size::factory()->create();
    $color = Color::factory()->create();

    $this->postJson('/api/admin/products', [
        'category_id' => $category->id,
        'name' => 'Polo',
        'base_price' => 50,
        'variants' => [
            ['size_id' => $size->id, 'color_id' => $color->id, 'stock' => 1],
            ['size_id' => $size->id, 'color_id' => $color->id, 'stock' => 2],
        ],
    ])->assertUnprocessable()->assertJsonValidationErrors('variants');
});

it('no permite quitar variantes que ya tienen pedidos', function () {
    $variant = makeVariant(stock: 5);
    $this->postJson('/api/orders', orderPayload([['variant_id' => $variant->id, 'quantity' => 1]]))->assertCreated();

    $this->putJson("/api/admin/products/{$variant->product_id}", [
        'category_id' => $variant->product->category_id,
        'name' => $variant->product->name,
        'base_price' => 100,
        'variants' => [],
    ])->assertUnprocessable();

    expect($variant->fresh())->not->toBeNull();
});

it('elimina productos de forma lógica', function () {
    $variant = makeVariant();

    $this->deleteJson("/api/admin/products/{$variant->product_id}")->assertNoContent();

    expect(Product::query()->find($variant->product_id))->toBeNull()
        ->and(Product::withTrashed()->find($variant->product_id))->not->toBeNull();
});

it('no permite eliminar tallas en uso', function () {
    $variant = makeVariant();

    $this->deleteJson("/api/admin/sizes/{$variant->size_id}")->assertUnprocessable();
});
