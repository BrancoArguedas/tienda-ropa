<?php

namespace App\Services\Seo;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Pricing\Contracts\PriceCalculator;
use App\Services\Catalog\CategoryTree;
use App\Services\Catalog\ProductQueryService;
use App\Services\Settings\SettingsRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Str;

/**
 * Construye título, descripción, canonical y JSON-LD de cada página pública.
 * Todo sale de los mismos datos que usa la API: precio y stock siempre coinciden con la web.
 */
class SeoPageBuilder
{
    private const LEGAL = [
        'privacidad' => ['Política de privacidad', 'Cómo tratamos y protegemos tus datos personales (Ley 29733).'],
        'terminos' => ['Términos y condiciones', 'Condiciones de compra, envíos, cambios y devoluciones.'],
        'cookies' => ['Política de cookies', 'Información sobre el uso de cookies y almacenamiento local.'],
        'libro-de-reclamaciones' => ['Libro de Reclamaciones', 'Registra un reclamo o queja sobre nuestros productos o servicio.'],
    ];

    public function __construct(
        private readonly ProductQueryService $products,
        private readonly CategoryTree $tree,
        private readonly SettingsRepository $settings,
        private readonly PriceCalculator $prices,
    ) {}

    public function baseUrl(): string
    {
        return rtrim((string) config('app.url'), '/');
    }

    public function home(): SeoPage
    {
        $name = $this->settings->get('store_name');
        $tagline = $this->settings->get('store_tagline');
        $desc = "{$name}: {$tagline}. Vestidos, blusas, pantalones y accesorios. Compra fácil y rápida por WhatsApp.";
        $home = $this->products->home();

        return new SeoPage(
            title: Str::limit("{$name} | Tienda de ropa online", 60, ''),
            description: Str::limit($desc, 155, ''),
            canonical: $this->url('/'),
            jsonLd: [$this->organization(), $this->website()],
            bodyHtml: $this->shell($name, $desc, $this->cardList($home['featured']->concat($home['newest'])->unique('id')->take(12))),
        );
    }

    public function catalog(array $query, bool $onSale = false): SeoPage
    {
        $name = $this->settings->get('store_name');
        $path = $onSale ? '/ofertas' : '/catalogo';
        $title = $onSale ? 'Ofertas en ropa' : 'Catálogo de ropa';
        $desc = $onSale
            ? "Ofertas y promociones vigentes en {$name}. Prendas con descuento, pedido por WhatsApp."
            : "Todo el catálogo de {$name}: vestidos, blusas, pantalones y accesorios. Pedido por WhatsApp.";
        $items = $this->products->paginate($onSale ? ['on_sale' => 1] : [], 24)->getCollection();

        return new SeoPage(
            title: "{$title} | {$name}",
            description: Str::limit($desc, 155, ''),
            canonical: $this->url($path),
            robots: $query === [] ? 'index,follow' : 'noindex,follow',
            jsonLd: [$this->breadcrumbs([[$title, $path]]), $this->itemList($title, $path, $items)],
            bodyHtml: $this->shell($title, $desc, $this->cardList($items)),
        );
    }

    public function category(string $slug, array $query): ?SeoPage
    {
        $node = $this->tree->findBySlug($slug);
        if ($node === null || ! in_array($node['id'], $this->tree->visibleIds(), true)) {
            return null;
        }
        $name = $this->settings->get('store_name');
        $path = "/categoria/{$node['slug']}";
        $desc = "Compra {$node['name']} en {$name}. Modelos, tallas y colores disponibles. Pedido fácil por WhatsApp.";
        $items = $this->products->paginate(['category' => $slug], 24)->getCollection();

        return new SeoPage(
            title: Str::limit("{$node['name']} | {$name}", 60, ''),
            description: Str::limit($desc, 155, ''),
            canonical: $this->url($path),
            robots: $query === [] ? 'index,follow' : 'noindex,follow',
            jsonLd: [$this->breadcrumbs([[$node['name'], $path]]), $this->itemList($node['name'], $path, $items)],
            bodyHtml: $this->shell($node['name'], $desc, $this->cardList($items)),
        );
    }

    public function product(string $slug): ?SeoPage
    {
        try {
            $product = $this->products->findBySlug($slug);
        } catch (ModelNotFoundException) {
            return null;
        }
        $name = $this->settings->get('store_name');
        $path = "/producto/{$product->slug}";
        $plain = trim(preg_replace('/\s+/', ' ', strip_tags((string) $product->description)));
        $desc = Str::limit($plain !== '' ? $plain : "{$product->name} en {$name}. Pedido por WhatsApp.", 155, '');
        $images = $product->images->map(fn (ProductImage $i) => $i->urlFor(ProductImage::LARGE_WIDTH))->all();
        $category = $product->category;

        $crumbs = [];
        if ($category) {
            $crumbs[] = [$category->name, "/categoria/{$category->slug}"];
        }
        $crumbs[] = [$product->name, $path];

        return new SeoPage(
            title: Str::limit("{$product->name} | {$name}", 60, ''),
            description: $desc,
            canonical: $this->url($path),
            image: $images[0] ?? null,
            ogType: 'product',
            jsonLd: [$this->breadcrumbs($crumbs), $this->productLd($product, $path, $desc, $images)],
            bodyHtml: $this->shell($product->name, $desc, $this->priceLine($product)),
        );
    }

    public function legal(string $slug): ?SeoPage
    {
        if (! isset(self::LEGAL[$slug])) {
            return null;
        }
        [$title, $desc] = self::LEGAL[$slug];
        $name = $this->settings->get('store_name');

        return new SeoPage(
            title: "{$title} | {$name}",
            description: $desc,
            canonical: $this->url("/{$slug}"),
            jsonLd: [$this->breadcrumbs([[$title, "/{$slug}"]])],
            bodyHtml: $this->shell($title, $desc),
        );
    }

    /** Panel y rutas privadas o inexistentes: nunca se indexan. */
    public function noIndex(string $title, int $status = 200): SeoPage
    {
        return new SeoPage(
            title: $title.' | '.$this->settings->get('store_name'),
            description: '',
            canonical: $this->baseUrl().'/',
            robots: 'noindex,nofollow',
            status: $status,
        );
    }

    // ---------------------------------------------------------------- JSON-LD

    private function organization(): array
    {
        $s = $this->settings;
        $sameAs = array_values(array_filter([$s->get('instagram_url'), $s->get('facebook_url'), $s->get('tiktok_url')]));
        $digits = preg_replace('/\D/', '', $s->get('whatsapp_number'));

        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $s->get('store_name'),
            'legalName' => $s->get('legal_name') ?: null,
            'url' => $this->url('/'),
            'logo' => $this->url('/favicon.svg'),
            'sameAs' => $sameAs ?: null,
            'contactPoint' => $digits ? [['@type' => 'ContactPoint', 'contactType' => 'customer service', 'url' => "https://wa.me/{$digits}", 'availableLanguage' => 'es']] : null,
        ]);
    }

    private function website(): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $this->settings->get('store_name'),
            'url' => $this->url('/'),
            'inLanguage' => 'es-PE',
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => ['@type' => 'EntryPoint', 'urlTemplate' => $this->url('/catalogo').'?q={search_term_string}'],
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    /** @param list<array{0:string,1:string}> $crumbs [nombre, ruta] sin incluir el inicio */
    private function breadcrumbs(array $crumbs): array
    {
        $all = array_merge([['Inicio', '/']], $crumbs);

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(fn ($c, $i) => [
                '@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => $this->url($c[1]),
            ], $all, array_keys($all)),
        ];
    }

    private function itemList(string $name, string $path, $products): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'CollectionPage',
            'name' => $name,
            'url' => $this->url($path),
            'mainEntity' => [
                '@type' => 'ItemList',
                'itemListElement' => $products->values()->map(fn (Product $p, $i) => [
                    '@type' => 'ListItem', 'position' => $i + 1, 'url' => $this->url("/producto/{$p->slug}"), 'name' => $p->name,
                ])->all(),
            ],
        ];
    }

    private function productLd(Product $product, string $path, string $desc, array $images): array
    {
        $currency = $this->settings->get('currency_code') ?: 'PEN';
        $variants = $product->variants;
        $inStock = $variants->sum('stock') > 0;
        $finals = $variants->isEmpty()
            ? [(float) $this->prices->quote($product)->toArray()['final']]
            : $variants->map(fn (ProductVariant $v) => (float) $this->prices->quote($product, $v)->toArray()['final'])->all();
        $availability = 'https://schema.org/'.($inStock ? 'InStock' : 'OutOfStock');
        $url = $this->url($path);

        $offer = min($finals) === max($finals)
            ? ['@type' => 'Offer', 'price' => number_format(min($finals), 2, '.', ''), 'priceCurrency' => $currency, 'availability' => $availability, 'itemCondition' => 'https://schema.org/NewCondition', 'url' => $url]
            : ['@type' => 'AggregateOffer', 'lowPrice' => number_format(min($finals), 2, '.', ''), 'highPrice' => number_format(max($finals), 2, '.', ''), 'priceCurrency' => $currency, 'offerCount' => count($finals), 'availability' => $availability, 'url' => $url];

        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'description' => $desc,
            'image' => $images ?: null,
            'sku' => $variants->first()?->sku,
            'brand' => ['@type' => 'Brand', 'name' => $this->settings->get('store_name')],
            'category' => $product->category?->name,
            'color' => $variants->map(fn ($v) => $v->color?->name)->filter()->unique()->implode(', ') ?: null,
            'offers' => $offer,
        ]);
    }

    // ------------------------------------------------------------ HTML cuerpo

    private function shell(string $h1, string $intro, string $extra = ''): string
    {
        $cats = collect($this->tree->activeTree())->map(
            fn (array $c) => '<li><a href="/categoria/'.e($c['slug']).'">'.e($c['name']).'</a></li>',
        )->implode('');

        return '<header><a href="/">'.e($this->settings->get('store_name')).'</a><nav><ul>'
            .'<li><a href="/catalogo">Catálogo</a></li><li><a href="/ofertas">Ofertas</a></li>'.$cats
            .'</ul></nav></header><main><h1>'.e($h1).'</h1><p>'.e($intro).'</p>'.$extra.'</main>';
    }

    private function cardList($products): string
    {
        $items = $products->map(function (Product $p) {
            $price = $this->prices->quote($p)->toArray()['final'];

            return '<li><a href="/producto/'.e($p->slug).'">'.e($p->name).'</a> — S/ '.e($price).'</li>';
        })->implode('');

        return $items === '' ? '' : "<ul>{$items}</ul>";
    }

    private function priceLine(Product $product): string
    {
        $price = $this->prices->quote($product)->toArray()['final'];

        return '<p>Precio: S/ '.e($price).'</p>';
    }

    private function url(string $path): string
    {
        return $this->baseUrl().$path;
    }
}
