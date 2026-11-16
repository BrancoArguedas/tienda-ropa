<?php

namespace App\Services\Media\Contracts;

use Illuminate\Http\UploadedFile;

interface ImageStorage
{
    /**
     * Guarda la imagen en varios anchos ("{base}-{ancho}.webp") y devuelve la ruta base.
     *
     * @param UploadedFile|string $source archivo subido o contenido binario
     * @param list<int> $widths
     */
    public function store(UploadedFile|string $source, string $directory, array $widths): string;

    /** @param list<int> $widths */
    public function delete(string $basePath, array $widths): void;
}
