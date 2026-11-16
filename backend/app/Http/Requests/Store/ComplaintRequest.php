<?php

namespace App\Http\Requests\Store;

use App\Models\Complaint;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComplaintRequest extends FormRequest
{
    public function rules(): array
    {
        $docRegex = match ($this->input('document_type')) {
            'DNI' => '/^\d{8}$/',
            'RUC' => '/^(10|15|17|20)\d{9}$/',
            'CE' => '/^[A-Za-z0-9]{6,12}$/',
            default => '/^[A-Za-z0-9]{5,15}$/',
        };

        return [
            'consumer_name' => ['required', 'string', 'min:3', 'max:150'],
            'document_type' => ['required', Rule::in(Complaint::DOCUMENT_TYPES)],
            'document_number' => ['required', 'string', "regex:{$docRegex}"],
            'address' => ['required', 'string', 'min:5', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^\+?[\d\s\-()]{7,20}$/'],
            'email' => ['required', 'email:rfc', 'max:150'],
            'is_minor' => ['boolean'],
            'guardian_name' => ['nullable', 'required_if:is_minor,true', 'string', 'max:150'],
            'item_type' => ['required', Rule::in(array_keys(Complaint::ITEM_TYPES))],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'item_description' => ['required', 'string', 'min:3', 'max:500'],
            'order_code' => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z0-9\-]+$/'],
            'type' => ['required', Rule::in(array_keys(Complaint::TYPES))],
            'detail' => ['required', 'string', 'min:10', 'max:3000'],
            'consumer_request' => ['required', 'string', 'min:5', 'max:2000'],
            'accepted' => ['accepted'],
            'website' => ['prohibited'], // honeypot
        ];
    }

    public function attributes(): array
    {
        return [
            'consumer_name' => 'nombre',
            'document_type' => 'tipo de documento',
            'document_number' => 'número de documento',
            'address' => 'domicilio',
            'phone' => 'teléfono',
            'email' => 'correo',
            'guardian_name' => 'nombre del padre, madre o apoderado',
            'item_type' => 'tipo de bien',
            'amount' => 'monto',
            'item_description' => 'descripción',
            'order_code' => 'código de pedido',
            'type' => 'tipo',
            'detail' => 'detalle',
            'consumer_request' => 'pedido',
        ];
    }

    public function messages(): array
    {
        return [
            'document_number.regex' => 'El número de documento no es válido para el tipo elegido.',
            'phone.regex' => 'Ingresa un número de teléfono válido.',
            'accepted.accepted' => 'Debes aceptar el tratamiento de tus datos para registrar la hoja.',
            'website.prohibited' => 'No se pudo registrar la hoja.',
        ];
    }
}
