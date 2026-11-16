<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SizeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:20', Rule::unique('sizes', 'name')->ignore($this->route('size'))],
            'position' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
