<?php

namespace App\Models;

use App\Observers\CatalogCacheObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(CatalogCacheObserver::class)]
class Color extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'hex'];

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }
}
