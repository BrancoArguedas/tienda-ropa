<?php

namespace App\Filters\Product;

use App\Filters\Contracts\QueryFilter;
use Illuminate\Database\Eloquent\Builder;

/** Búsqueda FULLTEXT en modo booleano con prefijos: "vest roj" → +vest* +roj* */
class SearchFilter implements QueryFilter
{
    public function apply(Builder $query, mixed $value): void
    {
        $terms = self::toBooleanQuery((string) $value);

        if ($terms === '') {
            return;
        }

        $query->whereFullText(['products.name', 'products.description'], $terms, ['mode' => 'boolean']);
    }

    public static function toBooleanQuery(string $input): string
    {
        // Elimina los operadores del modo booleano para que el usuario no pueda alterar la consulta.
        $clean = preg_replace('/[+\-<>()~*"@]+/u', ' ', mb_strtolower($input));

        return collect(preg_split('/\s+/u', trim((string) $clean)) ?: [])
            ->filter(fn (string $word) => mb_strlen($word) >= 2)
            ->take(6)
            ->map(fn (string $word) => "+{$word}*")
            ->implode(' ');
    }
}
