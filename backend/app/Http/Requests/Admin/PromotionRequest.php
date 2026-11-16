<?php

namespace App\Http\Requests\Admin;

use App\Enums\PromotionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PromotionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::enum(PromotionType::class)],
            'value' => [
                'required', 'numeric', 'gt:0',
                Rule::when($this->input('type') === PromotionType::Percentage->value, ['max:100']),
            ],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],
            'banner' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'remove_banner' => ['boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (empty($this->input('product_ids')) && empty($this->input('category_ids'))) {
                    $validator->errors()->add('product_ids', 'Selecciona al menos un producto o una categoría.');
                }
            },
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'nombre', 'value' => 'valor', 'starts_at' => 'inicio', 'ends_at' => 'fin'];
    }
}
