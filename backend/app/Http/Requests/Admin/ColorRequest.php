<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ColorRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:40', Rule::unique('colors', 'name')->ignore($this->route('color'))],
            'hex' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
