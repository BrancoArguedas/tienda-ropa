<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente',
            self::Confirmed => 'Venta confirmada',
            self::Cancelled => 'No concretada',
        };
    }

    /** Máquina de estados: qué transiciones están permitidas desde cada estado. */
    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => in_array($next, [self::Confirmed, self::Cancelled], true),
            self::Confirmed => $next === self::Cancelled,
            self::Cancelled => false,
        };
    }
}
