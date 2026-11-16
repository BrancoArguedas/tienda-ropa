<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/** Datos de demostración (opcional): php artisan db:seed --class=DemoSeeder */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('DemoSeeder no se ejecuta en producción (crea pedidos con datos ficticios).');

            return;
        }

        $this->call([
            CatalogSeeder::class,
            DemoOrdersSeeder::class,
        ]);
    }
}
