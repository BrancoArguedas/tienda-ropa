<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Settings\SettingsRepository;
use Illuminate\Console\Command;

/**
 * Ley 29733 (principio de proporcionalidad): los datos personales no se guardan más tiempo del necesario.
 * Anonimiza los pedidos cerrados más antiguos que el plazo de conservación; los importes se mantienen.
 */
class AnonymizeOldOrders extends Command
{
    protected $signature = 'orders:anonymize {--dry-run : Solo cuenta, no modifica}';

    protected $description = 'Anonimiza los datos personales de pedidos cerrados que superan el plazo de conservación';

    public function handle(SettingsRepository $settings): int
    {
        $months = max(6, (int) $settings->get('data_retention_months') ?: 24);
        $cutoff = now()->subMonths($months);

        $query = Order::query()
            ->whereIn('status', [OrderStatus::Confirmed->value, OrderStatus::Cancelled->value])
            ->whereNull('anonymized_at')
            ->where('created_at', '<', $cutoff);

        $total = (clone $query)->count();

        if ($this->option('dry-run')) {
            $this->info("{$total} pedidos anteriores al {$cutoff->toDateString()} se anonimizarían.");

            return self::SUCCESS;
        }

        $query->chunkById(200, fn ($orders) => $orders->each->anonymize());

        $this->info("{$total} pedidos anonimizados (plazo: {$months} meses).");

        return self::SUCCESS;
    }
}
