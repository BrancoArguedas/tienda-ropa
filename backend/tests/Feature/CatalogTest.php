<?php

use App\Models\Category;
use App\Models\Color;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Size;
use Illuminate\Support\Facades\DB;

function seedProducts(int $count, Category $category): void
{
    $size = Size::factory()->create();
    $colors = Color::factory()->count(2)->create();

    Product::factory()->count($count)->for($category)->create()->each(function (Product $product) use ($size, $colors) {
        foreach ($colors as $color) {
            ProductVariant::factory()->create(['product_id' => $product->id, 'size_id' => $size->id, 'color_id' => $color->id]);
        }
        ProductImage::query()->create(['product_id' => $product->id, 'path' => 'products/x/y', 'position' => 1, 'is_primary' => true]);
    });
}

function countQueries(callable $callback): int
{
    DB::flushQueryLog();
    DB::enableQueryLog();
    $callback();
    $count = count(DB::getQueryLog());
    DB::disableQueryLog();

    return $count;
}

it('el listado del catálogo hace un número constante de consultas (sin N+1)', function () {
    $category = Category::factory()->create();
    seedProducts(3, $category);

    $this->getJson('/api/products')->assertOk(); // calienta cachés
    $few = countQueries(fn () => $this->getJson('/api/products')->assertOk()->assertJsonCount(3, 'data'));

    seedProducts(20, $category);
    $this->getJson('/api/products')->assertOk();
    $many = countQueries(fn () => $this->getJson('/api/products')->assertOk()->assertJsonCount(23, 'data'));

    expect($many)->toBe($few);
});

it('filtra por categoría incluyendo subcategorías y por talla con stock', function () {
    $parent = Category::factory()->create(['slug' => 'mujer']);
    $child = Category::factory()->create(['parent_id' => $parent->id]);
    $other = Category::factory()->create();

    $inChild = makeVariant(category: $child);
    makeVariant(category: $other);
    $noStock = makeVariant(stock: 0, category: $child);

    $this->getJson('/api/products?category=mujer')->assertOk()->assertJsonCount(2, 'data');

    $this->getJson('/api/products?category=mujer&sizes[]='.$inChild->size_id.'&sizes[]='.$noStock->size_id)
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $inChild->product_id);
});

it('oculta productos de categorías desactivadas', function () {
    $category = Category::factory()->create(['is_active' => false]);
    $variant = makeVariant(category: $category);

    $this->getJson('/api/products')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson("/api/products/{$variant->product->slug}")->assertNotFound();
});

it('devuelve la ficha completa en una sola respuesta', function () {
    $variant = makeVariant('99.90');

    $this->getJson("/api/products/{$variant->product->slug}")
        ->assertOk()
        ->assertJsonPath('price.final', '99.90')
        ->assertJsonCount(1, 'variants')
        ->assertJsonStructure(['images', 'colors', 'sizes', 'related', 'category']);
});
