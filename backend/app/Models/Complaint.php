<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Hoja del Libro de Reclamaciones virtual. */
class Complaint extends Model
{
    public const DOCUMENT_TYPES = ['DNI', 'CE', 'PAS', 'RUC'];

    public const TYPES = ['claim' => 'Reclamo', 'complaint' => 'Queja'];

    public const ITEM_TYPES = ['product' => 'Producto', 'service' => 'Servicio'];

    /** Plazo legal de respuesta (DS 101-2022-PCM): 15 días hábiles improrrogables. */
    public const RESPONSE_BUSINESS_DAYS = 15;

    protected $fillable = [
        'consumer_name', 'document_type', 'document_number', 'address', 'phone', 'email',
        'is_minor', 'guardian_name', 'item_type', 'amount', 'item_description', 'order_code',
        'type', 'detail', 'consumer_request',
    ];

    protected function casts(): array
    {
        return [
            'is_minor' => 'boolean',
            'amount' => 'decimal:2',
            'answered_at' => 'datetime',
            'due_at' => 'date',
        ];
    }

    public function answeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'answered_by');
    }

    public function typeLabel(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function itemTypeLabel(): string
    {
        return self::ITEM_TYPES[$this->item_type] ?? $this->item_type;
    }
}
