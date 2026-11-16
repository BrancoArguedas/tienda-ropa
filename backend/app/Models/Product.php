<?php

namespace App\Models;

use App\Observers\CatalogCacheObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(CatalogCacheObserver::class)]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    /** Días durante los que un producto se marca como "Nuevo". */
    public const NEW_BADGE_DAYS = 30;

    protected $fillable = ['category_id', 'name', 'slug', 'description', 'base_price', 'is_active', 'is_featured'];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    /** Imagen principal (marcada como principal o, si no, la primera por posición). */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->ofMany(['is_primary' => 'max', 'position' => 'min', 'id' => 'min']);
    }

    public function promotions(): BelongsToMany
    {
        return $this->belongsToMany(Promotion::class, 'promotion_product');
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('products.is_active', true);
    }

    public function isNew(): bool
    {
        return $this->created_at !== null && $this->created_at->gt(now()->subDays(self::NEW_BADGE_DAYS));
    }
}
