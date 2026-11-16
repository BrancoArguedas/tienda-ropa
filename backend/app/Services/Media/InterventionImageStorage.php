<?php

namespace App\Services\Media;

use App\Services\Media\Contracts\ImageStorage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

/** Convierte a WebP y genera miniaturas con Intervention Image (driver GD). */
class InterventionImageStorage implements ImageStorage
{
    private const QUALITY = 82;

    public function __construct(
        private readonly ImageManager $images,
        private readonly Filesystem $disk,
    ) {}

    public function store(UploadedFile|string $source, string $directory, array $widths): string
    {
        $base = trim($directory, '/').'/'.Str::uuid()->toString();
        $input = $source instanceof UploadedFile ? $source->getRealPath() : $source;

        foreach ($widths as $width) {
            $encoded = $this->images->read($input)
                ->scaleDown(width: $width)
                ->toWebp(self::QUALITY);

            $this->disk->put("{$base}-{$width}.webp", (string) $encoded);
        }

        return $base;
    }

    public function delete(string $basePath, array $widths): void
    {
        if (str_starts_with($basePath, 'http')) {
            return;
        }

        $this->disk->delete(array_map(fn (int $w) => "{$basePath}-{$w}.webp", $widths));
    }
}
