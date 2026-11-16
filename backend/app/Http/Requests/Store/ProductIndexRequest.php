<?php

namespace App\Http\Requests\Store;

use App\Filters\ProductFilter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductIndexRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'category' => ['nullable', 'string', 'max:100'],
            'sizes' => ['nullable', 'array', 'max:20'],
            'sizes.*' => ['integer'],
            'colors' => ['nullable', 'array', 'max:20'],
            'colors.*' => ['integer'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'q' => ['nullable', 'string', 'max:100'],
            'on_sale' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(ProductFilter::sorts())],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ];
    }
}
