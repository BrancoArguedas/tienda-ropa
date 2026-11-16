<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProductRequest extends FormRequest
{
    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');

        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', 'alpha_dash'],
            'description' => ['nullable', 'string', 'max:5000'],
            'base_price' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'variants' => [$product ? 'sometimes' : 'nullable', 'array', 'max:300'],
            'variants.*.size_id' => ['required', 'integer', 'exists:sizes,id'],
            'variants.*.color_id' => ['required', 'integer', 'exists:colors,id'],
            'variants.*.stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'variants.*.price_override' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'variants.*.sku' => [
                'nullable', 'string', 'max:60', 'distinct',
                Rule::unique('product_variants', 'sku')->where(fn ($q) => $product ? $q->where('product_id', '!=', $product->id) : $q),
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                // Cada combinación talla/color debe ser única dentro del producto.
                $keys = collect($this->input('variants', []))->map(fn ($v) => ($v['size_id'] ?? '').'-'.($v['color_id'] ?? ''));
                if ($keys->count() !== $keys->unique()->count()) {
                    $validator->errors()->add('variants', 'Hay combinaciones de talla y color repetidas.');
                }
            },
        ];
    }

    public function attributes(): array
    {
        return [
            'category_id' => 'categoría',
            'name' => 'nombre',
            'base_price' => 'precio',
            'variants.*.stock' => 'stock',
            'variants.*.sku' => 'SKU',
        ];
    }
}
