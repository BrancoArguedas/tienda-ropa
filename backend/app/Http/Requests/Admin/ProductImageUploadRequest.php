<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProductImageUploadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192', 'dimensions:min_width=300,min_height=300'],
            'color_id' => ['nullable', 'integer', 'exists:colors,id'],
        ];
    }
}
