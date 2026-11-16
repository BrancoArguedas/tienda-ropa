<?php

use App\Models\Category;
use App\Models\Product;

beforeEach(fn () => config(['app.url' => 'https://tienda.test', 'seo.index_path' => base_path('../frontend/index.html')]));

it('sirve la ficha de producto con title, canonical y JSON-LD reales', function () {
    $variant = makeVariant('120.00', 5, Category::factory()->create(['is_active' => true]));
    $product = $variant->product;
    $product->update(['name' => 'Vestido <Rosa>', 'description' => 'Vestido de lino.']);

    $html = $this->get("/producto/{$product->slug}")->assertOk()->getContent();

    expect($html)
        ->toContain('<title>Vestido &lt;Rosa&gt; | ')
        ->toContain('<link rel="canonical" href="https://tienda.test/producto/'.$product->slug.'">')
        ->toContain('"@type":"Product"')
        ->toContain('"priceCurrency":"PEN"')
        ->toContain('https://schema.org/InStock')
        ->toContain('<h1>Vestido &lt;Rosa&gt;</h1>')
        ->not->toContain('<title>Diana Store</title>');
});

it('marca OutOfStock cuando no hay stock', function () {
    $variant = makeVariant('50.00', 0, Category::factory()->create(['is_active' => true]));

    $this->get("/producto/{$variant->product->slug}")->assertOk()->assertSee('https://schema.org/OutOfStock', false);
});

it('devuelve 404 real y noindex para un producto inexistente o una ruta desconocida', function () {
    $this->get('/producto/no-existe')->assertNotFound()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    $this->get('/ruta-inventada')->assertNotFound()->assertSee('noindex,nofollow', false);
});

it('no indexa productos inactivos', function () {
    $variant = makeVariant('50.00', 5, Category::factory()->create(['is_active' => true]));
    $variant->product->update(['is_active' => false]);

    $this->get("/producto/{$variant->product->slug}")->assertNotFound();
});

it('canonicaliza el catálogo con filtros y los marca noindex', function () {
    $category = Category::factory()->create(['is_active' => true]);
    makeVariant('80.00', 3, $category);

    $this->get("/categoria/{$category->slug}")->assertOk()
        ->assertSee('<meta name="robots" content="index,follow">', false);
    $this->get("/categoria/{$category->slug}?sort=price_asc")->assertOk()
        ->assertSee('<meta name="robots" content="noindex,follow">', false)
        ->assertSee('<link rel="canonical" href="https://tienda.test/categoria/'.$category->slug.'">', false);
});

it('el panel de administración es noindex', function () {
    $this->get('/admin/pedidos')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});

it('robots.txt bloquea el panel y apunta al sitemap', function () {
    $this->get('/robots.txt')->assertOk()
        ->assertSee('Disallow: /admin')
        ->assertSee('Disallow: /api/')
        ->assertSee('GPTBot')
        ->assertSee('Sitemap: https://tienda.test/sitemap.xml');
});

it('el sitemap lista solo productos activos', function () {
    $category = Category::factory()->create(['is_active' => true]);
    $active = makeVariant('80.00', 3, $category)->product;
    $inactive = makeVariant('80.00', 3, $category)->product;
    $inactive->update(['is_active' => false]);
    cache()->forget('seo.sitemap');

    $this->get('/sitemap.xml')->assertOk()
        ->assertSee("https://tienda.test/producto/{$active->slug}", false)
        ->assertDontSee("/producto/{$inactive->slug}", false);
});
