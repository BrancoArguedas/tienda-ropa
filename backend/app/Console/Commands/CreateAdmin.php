<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/** Crea o actualiza un administrador pidiendo la contraseña de forma oculta. */
class CreateAdmin extends Command
{
    protected $signature = 'admin:create {email : Correo del administrador} {--name=Administradora}';

    protected $description = 'Crea un administrador del panel (o le cambia la contraseña)';

    public function handle(): int
    {
        $email = mb_strtolower((string) $this->argument('email'));
        $password = (string) $this->secret('Contraseña (mínimo 12 caracteres, con letras, números y símbolos)');

        $validator = Validator::make(compact('email', 'password'), [
            'email' => ['required', 'email:rfc'],
            'password' => ['required', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        if ($password !== $this->secret('Repite la contraseña')) {
            $this->error('Las contraseñas no coinciden.');

            return self::FAILURE;
        }

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->forceFill(['name' => $user->name ?? $this->option('name'), 'password' => $password, 'is_admin' => true])->save();

        $this->info("Administrador {$email} listo.");

        return self::SUCCESS;
    }
}
