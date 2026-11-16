<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'min:2', 'max:120'],
            'customer_phone' => ['required', 'string', 'regex:/^\+?[\d\s\-()]{7,20}$/'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.variant_id' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            // Ley 29733: consentimiento informado, expreso y previo.
            'privacy_accepted' => ['accepted'],
            // Honeypot: campo invisible para personas; si llega con texto es un bot.
            'website' => ['prohibited'],
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_name' => 'nombre',
            'customer_phone' => 'teléfono',
            'notes' => 'nota',
            'items' => 'carrito',
        ];
    }

    public function messages(): array
    {
        return [
            'customer_phone.regex' => 'Ingresa un número de teléfono válido.',
            'privacy_accepted.accepted' => 'Debes aceptar la Política de privacidad y los Términos para continuar.',
            'website.prohibited' => 'No se pudo registrar el pedido.',
        ];
    }
}
