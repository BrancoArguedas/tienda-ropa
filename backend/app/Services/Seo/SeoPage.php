<?php

namespace App\Services\Seo;

/** Datos de cabecera y cuerpo que se inyectan en el HTML de una página pública. */
final class SeoPage
{
    /**
     * @param  list<array<string,mixed>>  $jsonLd
     */
    public function __construct(
        public readonly string $title,
        public readonly string $description,
        public readonly string $canonical,
        public readonly string $robots = 'index,follow',
        public readonly ?string $image = null,
        public readonly string $ogType = 'website',
        public readonly array $jsonLd = [],
        public readonly string $bodyHtml = '',
        public readonly int $status = 200,
    ) {}
}
