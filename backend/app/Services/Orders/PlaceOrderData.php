<?php

namespace App\Services\Orders;

/** DTO con los datos del pedido ya validados por el FormRequest. */
final readonly class PlaceOrderData
{
    /** @param array<int, int> $quantities variant_id => cantidad (duplicados ya sumados) */
    public function __construct(
        public string $customerName,
        public string $customerPhone,
        public ?string $notes,
        public array $quantities,
    ) {}

    /** @param array{customer_name:string,customer_phone:string,notes?:?string,items:list<array{variant_id:int,quantity:int}>} $data */
    public static function fromArray(array $data): self
    {
        $quantities = [];
        foreach ($data['items'] as $item) {
            $id = (int) $item['variant_id'];
            $quantities[$id] = ($quantities[$id] ?? 0) + (int) $item['quantity'];
        }

        return new self(
            customerName: trim($data['customer_name']),
            customerPhone: preg_replace('/[^\d+]/', '', $data['customer_phone']),
            notes: isset($data['notes']) && trim((string) $data['notes']) !== '' ? trim($data['notes']) : null,
            quantities: $quantities,
        );
    }
}
