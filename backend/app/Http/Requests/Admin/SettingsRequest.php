<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'store_name' => ['required', 'string', 'max:80'],
            'store_tagline' => ['nullable', 'string', 'max:150'],
            'whatsapp_number' => ['required', 'string', 'regex:/^\+?\d{8,15}$/'],
            'currency_code' => ['required', 'string', 'size:3', 'alpha'],
            'locale' => ['required', 'string', 'regex:/^[a-z]{2}-[A-Z]{2}$/'],
            // Solo http/https: evita enlaces "javascript:" en el footer de la tienda.
            'instagram_url' => ['nullable', 'url:http,https', 'max:255'],
            'facebook_url' => ['nullable', 'url:http,https', 'max:255'],
            'tiktok_url' => ['nullable', 'url:http,https', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'size_guide' => ['nullable', 'string', 'max:3000'],
            'legal_name' => ['nullable', 'string', 'max:150'],
            'ruc' => ['nullable', 'regex:/^(10|15|17|20)\d{9}$/'],
            'legal_address' => ['nullable', 'string', 'max:255'],
            'privacy_email' => ['nullable', 'email:rfc', 'max:150'],
            'claims_email' => ['nullable', 'email:rfc', 'max:150'],
            'data_retention_months' => ['nullable', 'integer', 'min:6', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'whatsapp_number.regex' => 'Usa el formato internacional sin espacios, ej: 51987654321.',
            'ruc.regex' => 'El RUC tiene 11 dígitos y empieza con 10, 15, 17 o 20.',
            'url' => 'Ingresa una dirección que empiece con http:// o https://.',
        ];
    }
}
