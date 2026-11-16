<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Libro de Reclamaciones virtual (DS 011-2011-PCM, mod. DS 101-2022-PCM). */
return new class extends Migration
{
    public function up(): void
    {
        // Contador por año: correlativo sin huecos ni duplicados (se bloquea la fila al numerar).
        Schema::create('complaint_counters', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedInteger('last_number')->default(0);
        });

        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->unique(); // LR-2026-000001

            // 1. Consumidor
            $table->string('consumer_name', 150);
            $table->string('document_type', 10); // DNI, CE, PAS, RUC
            $table->string('document_number', 20);
            $table->string('address', 255);
            $table->string('phone', 20);
            $table->string('email', 150);
            $table->boolean('is_minor')->default(false);
            $table->string('guardian_name', 150)->nullable();

            // 2. Bien contratado
            $table->string('item_type', 10); // product | service
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('item_description', 500);
            $table->string('order_code', 20)->nullable();

            // 3. Detalle
            $table->string('type', 10); // claim (reclamo) | complaint (queja)
            $table->text('detail');
            $table->text('consumer_request');

            // 4. Respuesta del proveedor
            $table->string('status', 10)->default('pending');
            $table->text('provider_response')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->foreignId('answered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_at');

            $table->timestamps();

            $table->index(['status', 'due_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('complaint_counters');
    }
};
