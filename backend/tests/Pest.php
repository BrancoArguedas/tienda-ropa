<?php

use App\Models\Category;
use App\Models\Color;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature');
pest()->extend(TestCase::class)->in('Unit');
pest()->extend(TestCase::class)->use(DatabaseTruncation::class)->in('FullText');

/** Crea un producto activo con una variante y devuelve la variante (con producto cargado). */
function makeVariant(string $price = '100.00', int $stock = 10, ?Category $category = null, ?string $override = null): ProductVariant
{
    $product = Product::factory()->for($category ?? Category::factory())->create(['base_price' => $price]);

    return ProductVariant::factory()->create([
        'product_id' => $product->id,
        'size_id' => Size::factory(),
        'color_id' => Color::factory(),
        'stock' => $stock,
        'price_override' => $override,
    ]);
}

function orderPayload(array $items): array
{
    return [
        'customer_name' => 'Clienta de prueba',
        'customer_phone' => '+51 987 654 321',
        'privacy_accepted' => true,
        'items' => $items,
    ];
}
