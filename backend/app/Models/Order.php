<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Support\PhoneHash;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    public const ANONYMIZED_NAME = 'Cliente anonimizado';

    protected $fillable = [
        'code', 'customer_name', 'customer_phone', 'notes', 'status',
        'subtotal', 'discount_total', 'total', 'whatsapp_message',
        'privacy_accepted_at', 'privacy_policy_version',
        'confirmed_at', 'cancelled_at', 'anonymized_at', 'handled_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'total' => 'decimal:2',
            // Datos personales cifrados en reposo (AES-256 con APP_KEY).
            'customer_phone' => 'encrypted',
            'notes' => 'encrypted',
            'whatsapp_message' => 'encrypted',
            'privacy_accepted_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'anonymized_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // El hash de búsqueda siempre acompaña al teléfono.
        static::saving(function (Order $order) {
            if ($order->isDirty('customer_phone')) {
                $order->customer_phone_hash = $order->customer_phone ? PhoneHash::make($order->customer_phone) : null;
            }
        });
    }

    public function scopePhone(Builder $query, string $phone): void
    {
        $query->where('customer_phone_hash', PhoneHash::make($phone));
    }

    /** Elimina los datos personales y conserva los importes (contabilidad). Derecho de cancelación ARCO. */
    public function anonymize(): void
    {
        $this->forceFill([
            'customer_name' => self::ANONYMIZED_NAME,
            'customer_phone' => null,
            'notes' => null,
            'whatsapp_message' => null,
            'anonymized_at' => now(),
        ])->save();
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->latest('created_at')->latest('id');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function scopeStatus(Builder $query, OrderStatus $status): void
    {
        $query->where('status', $status->value);
    }
}
