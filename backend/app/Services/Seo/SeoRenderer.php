<?php

namespace App\Services\Seo;

/** Inyecta head y cuerpo SEO en la plantilla compilada del SPA. El HTML es el mismo para bots y personas. */
class SeoRenderer
{
    public function render(SeoPage $page): string
    {
        $html = $this->template();
        $head = $this->head($page);

        // Quita los valores genéricos del index.html: cada página define los suyos.
        $html = preg_replace('#<title>.*?</title>#is', '', $html, 1);
        $html = preg_replace('#<meta\s+name="description"[^>]*>#i', '', $html, 1);

        $html = str_contains($html, '<!--seo-head-->')
            ? str_replace('<!--seo-head-->', $head, $html)
            : str_replace('</head>', $head.'</head>', $html);

        return str_contains($html, '<!--seo-body-->')
            ? str_replace('<!--seo-body-->', $page->bodyHtml, $html)
            : str_replace('<div id="root"></div>', '<div id="root">'.$page->bodyHtml.'</div>', $html);
    }

    private function head(SeoPage $p): string
    {
        $e = fn (?string $v) => e((string) $v);
        $out = '<title>'.$e($p->title).'</title>';
        if ($p->description !== '') {
            $out .= '<meta name="description" content="'.$e($p->description).'">';
        }
        $out .= '<meta name="robots" content="'.$e($p->robots).'">';
        $out .= '<link rel="canonical" href="'.$e($p->canonical).'">';
        $out .= '<meta property="og:locale" content="es_PE"><meta property="og:type" content="'.$e($p->ogType).'">';
        $out .= '<meta property="og:title" content="'.$e($p->title).'"><meta property="og:description" content="'.$e($p->description).'">';
        $out .= '<meta property="og:url" content="'.$e($p->canonical).'">';
        $out .= '<meta name="twitter:card" content="'.($p->image ? 'summary_large_image' : 'summary').'">';
        if ($p->image) {
            $out .= '<meta property="og:image" content="'.$e($p->image).'"><meta name="twitter:image" content="'.$e($p->image).'">';
        }
        foreach ($p->jsonLd as $block) {
            // JSON_HEX_TAG evita que un nombre de producto con "</script>" cierre el bloque.
            $out .= '<script type="application/ld+json">'.json_encode($block, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG).'</script>';
        }

        return $out;
    }

    private function template(): string
    {
        foreach ([config('seo.index_path'), base_path('../frontend/index.html')] as $path) {
            if (is_file($path)) {
                return (string) file_get_contents($path);
            }
        }

        return '<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div></body></html>';
    }
}
