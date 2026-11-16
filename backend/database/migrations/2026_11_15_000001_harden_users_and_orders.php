<?php

use App\Support\PhoneHash;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Seguridad y Ley 29733:
 *  - users.is_admin: solo los administradores entran al panel.
 *  - orders: evidencia del consentimiento, datos personales cifrados en reposo
 *    y hash del teléfono para poder buscarlo sin descifrar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
        });
        // Los usuarios existentes eran todos administradores del panel.
        DB::table('users')->update(['is_admin' => true]);

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['customer_phone']);
        });

        Schema::table('orders', function (Blueprint $table) {
            // El texto cifrado es mucho más largo que el original.
            $table->text('customer_phone')->nullable()->change();
            $table->text('notes')->nullable()->change();
            $table->text('whatsapp_message')->nullable()->change();
            $table->char('customer_phone_hash', 64)->nullable()->after('customer_phone')->index();
            $table->timestamp('privacy_accepted_at')->nullable()->after('whatsapp_message');
            $table->string('privacy_policy_version', 20)->nullable()->after('privacy_accepted_at');
            $table->timestamp('anonymized_at')->nullable()->after('cancelled_at');
        });

        DB::table('orders')->orderBy('id')->lazyById()->each(function (object $row) {
            DB::table('orders')->where('id', $row->id)->update([
                'customer_phone_hash' => $row->customer_phone ? PhoneHash::make($row->customer_phone) : null,
                'customer_phone' => $row->customer_phone ? Crypt::encryptString($row->customer_phone) : null,
                'notes' => $row->notes ? Crypt::encryptString($row->notes) : null,
                'whatsapp_message' => $row->whatsapp_message ? Crypt::encryptString($row->whatsapp_message) : null,
            ]);
        });
    }

    public function down(): void
    {
        DB::table('orders')->orderBy('id')->lazyById()->each(function (object $row) {
            $dec = fn (?string $v) => $v ? Crypt::decryptString($v) : null;
            DB::table('orders')->where('id', $row->id)->update([
                'customer_phone' => $dec($row->customer_phone) ?? '',
                'notes' => $dec($row->notes),
                'whatsapp_message' => $dec($row->whatsapp_message) ?? '',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['customer_phone_hash', 'privacy_accepted_at', 'privacy_policy_version', 'anonymized_at']);
            $table->string('customer_phone', 20)->change();
            $table->string('notes', 500)->nullable()->change();
            $table->text('whatsapp_message')->change();
            $table->index('customer_phone');
        });

        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('is_admin'));
    }
};
