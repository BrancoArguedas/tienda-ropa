<?php

namespace App\Messaging\Contracts;

use App\Models\Order;

interface OrderMessageFormatter
{
    /** Texto plano con el resumen del pedido (requiere `items` cargados). */
    public function format(Order $order): string;
}
