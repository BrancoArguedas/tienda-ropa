<?php

namespace App\Services\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SlugGenerator
{
    /** Genera un slug único para el modelo con UNA consulta (sufijo -2, -3...). */
    public function unique(string $modelClass, string $text, ?int $ignoreId = null): string
    {
        $base = Str::slug($text) ?: 'item';

        /** @var Model $model */
        $model = new $modelClass;
        $query = $modelClass::query();
        if (in_array(SoftDeletes::class, class_uses_recursive($modelClass), true)) {
            $query->withTrashed();
        }

        $taken = $query
            ->where(fn ($q) => $q->where('slug', $base)->orWhere('slug', 'like', $base.'-%'))
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->pluck('slug', $model->getKeyName())
            ->flip();

        if (! $taken->has($base)) {
            return $base;
        }

        for ($i = 2; ; $i++) {
            if (! $taken->has("{$base}-{$i}")) {
                return "{$base}-{$i}";
            }
        }
    }
}
