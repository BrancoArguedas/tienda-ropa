<?php

namespace App\Pricing\Contracts;

/** Estrategia de descuento (OCP: un nuevo tipo de promoción = una nueva clase). */
interface DiscountStrategy
{
    /** Descuento por unidad en céntimos; nunca mayor al precio. */
    public function discountCents(int $priceCents, string $value): int;
}
