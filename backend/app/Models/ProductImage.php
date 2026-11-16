<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    use HasFactory;

    public const THUMB_WIDTH = 400;
    public const LARGE_WIDTH = 1200;

    protected $fillable = ['product_id', 'color_id', 'path', 'position', 'is_primary'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean', 'position' => 'integer'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class);
    }

    /**
     * `path` es la ruta base sin sufijo; en disco existen "{path}-400.webp" y "{path}-1200.webp".
     * Si la ruta ya es una URL absoluta (imagen externa), se devuelve tal cual.
     */
    public function urlFor(int $width): string
    {
        if (str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        return Storage::disk('public')->url("{$this->path}-{$width}.webp");
    }
}
