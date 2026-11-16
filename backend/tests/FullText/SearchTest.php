<?php

use App\Models\Category;
use App\Models\Product;

/*
 * InnoDB solo indexa en FULLTEXT las filas confirmadas (COMMIT), por eso esta suite
 * usa DatabaseTruncation en lugar de transacciones (ver tests/Pest.php).
 */

it('busca con FULLTEXT por prefijo y autocompleta', function () {
    $category = Category::factory()->create(['name' => 'Vestidos']);
    Product::factory()->for($category)->create(['name' => 'Vestido de lino', 'description' => 'Fresco']);
    Product::factory()->for($category)->create(['name' => 'Camisa oxford', 'description' => 'Clásica']);

    $this->getJson('/api/products?q=vest')->assertOk()->assertJsonCount(1, 'data');

    $this->getJson('/api/products/suggest?q=lin')
        ->assertOk()
        ->assertJsonCount(1, 'products')
        ->assertJsonPath('products.0.name', 'Vestido de lino');

    $this->getJson('/api/products/suggest?q=vesti')
        ->assertOk()
        ->assertJsonPath('categories.0.name', 'Vestidos');

    $this->getJson('/api/products/suggest?q=v')->assertOk()->assertJsonCount(0, 'products');
});
