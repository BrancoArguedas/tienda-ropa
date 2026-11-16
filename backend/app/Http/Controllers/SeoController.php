<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Catalog\CategoryTree;
use App\Services\Seo\SeoPage;
use App\Services\Seo\SeoPageBuilder;
use App\Services\Seo\SeoRenderer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * Sirve el SPA con head y contenido reales por página (title, canonical, JSON-LD, enlaces),
 * robots.txt y sitemap.xml. El HTML es idéntico para bots y personas (sin cloaking).
 */
class SeoController extends Controller
{
    public function __construct(
        private readonly SeoPageBuilder $builder,
        private readonly SeoRenderer $renderer,
    ) {}

    public function home(Request $request): Response
    {
        return $this->respond($this->builder->home());
    }

    public function catalog(Request $request): Response
    {
        return $this->respond($this->builder->catalog($request->query()));
    }

    public function sale(Request $request): Response
    {
        return $this->respond($this->builder->catalog($request->query(), onSale: true));
    }

    public function category(Request $request, string $slug): Response
    {
        return $this->respond($this->builder->category($slug, $request->query()) ?? $this->notFound());
    }

    public function product(string $slug): Response
    {
        return $this->respond($this->builder->product($slug) ?? $this->notFound());
    }

    public function legal(string $page): Response
    {
        return $this->respond($this->builder->legal($page) ?? $this->notFound());
    }

    public function admin(): Response
    {
        return $this->respond($this->builder->noIndex('Panel'));
    }

    public function notFound(): SeoPage
    {
        return $this->builder->noIndex('Página no encontrada', 404);
    }

    public function fallback(): Response
    {
        return $this->respond($this->notFound());
    }

    public function robots(): Response
    {
        $lines = ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /sanctum/', 'Disallow: /*?sort=', 'Disallow: /*?page=', 'Allow: /', ''];

        if (config('seo.allow_ai_bots')) {
            foreach (config('seo.ai_bots') as $bot) {
                array_push($lines, "User-agent: {$bot}", 'Disallow: /admin', 'Disallow: /api/', 'Allow: /', '');
            }
        }
        $lines[] = 'Sitemap: '.$this->builder->baseUrl().'/sitemap.xml';

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap(CategoryTree $tree): Response
    {
        $xml = Cache::remember('seo.sitemap', 600, function () use ($tree) {
            $base = $this->builder->baseUrl();
            $urls = [];
            foreach (['/', '/catalogo', '/ofertas'] as $path) {
                $urls[] = ['loc' => $base.$path, 'lastmod' => null, 'image' => null];
            }
            foreach ($tree->nodes() as $node) {
                if (in_array($node['id'], $tree->visibleIds(), true)) {
                    $urls[] = ['loc' => "{$base}/categoria/{$node['slug']}", 'lastmod' => null, 'image' => null];
                }
            }
            Product::query()->active()
                ->whereIn('category_id', $tree->visibleIds() ?: [0])
                ->with('primaryImage')
                ->select(['id', 'slug', 'updated_at'])
                ->orderBy('id')
                ->each(function (Product $p) use (&$urls, $base) {
                    $urls[] = [
                        'loc' => "{$base}/producto/{$p->slug}",
                        'lastmod' => $p->updated_at?->toAtomString(),
                        'image' => $p->primaryImage?->urlFor(ProductImage::LARGE_WIDTH),
                    ];
                });

            $body = '';
            foreach ($urls as $u) {
                $body .= '<url><loc>'.e($u['loc']).'</loc>';
                $body .= $u['lastmod'] ? '<lastmod>'.$u['lastmod'].'</lastmod>' : '';
                $body .= $u['image'] ? '<image:image><image:loc>'.e($u['image']).'</image:loc></image:image>' : '';
                $body .= '</url>';
            }

            return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'.$body.'</urlset>';
        });

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function respond(SeoPage $page): Response
    {
        $response = response($this->renderer->render($page), $page->status, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache',
        ]);
        if (str_starts_with($page->robots, 'noindex')) {
            $response->header('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }
}
