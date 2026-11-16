<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Plazo de conservación de datos personales (Ley 29733). Requiere el cron de "schedule:run" en producción.
Schedule::command('orders:anonymize')->monthlyOn(1, '03:00')->timezone('America/Lima');
