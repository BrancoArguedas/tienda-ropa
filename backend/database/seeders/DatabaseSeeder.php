<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('app.admin_email');
        $password = config('app.admin_password');

        if (app()->isProduction()) {
            // En producción nunca se crea un admin con credenciales conocidas.
            if (! $email || ! $password || strlen($password) < 12 || $password === 'password') {
                throw new RuntimeException('Define ADMIN_EMAIL y ADMIN_PASSWORD (12+ caracteres) en .env, o usa "php artisan admin:create".');
            }
        } else {
            $email ??= 'admin@tienda.test';
            $password ??= 'password';
        }

        $admin = User::query()->firstOrNew(['email' => $email]);
        $admin->forceFill(['name' => $admin->name ?? 'Administradora', 'password' => $password, 'is_admin' => true])->save();
    }
}
