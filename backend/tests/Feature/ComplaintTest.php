<?php

use App\Mail\ComplaintAnsweredMail;
use App\Mail\ComplaintReceivedMail;
use App\Models\Complaint;
use App\Models\User;
use App\Services\Complaints\ComplaintService;
use App\Services\Settings\SettingsRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

function complaintPayload(array $overrides = []): array
{
    return [
        'consumer_name' => 'María López',
        'document_type' => 'DNI',
        'document_number' => '12345678',
        'address' => 'Av. Arequipa 123, Lima',
        'phone' => '987654321',
        'email' => 'maria@example.com',
        'item_type' => 'product',
        'amount' => 89.9,
        'item_description' => 'Blusa talla M',
        'order_code' => 'PD-ABC123',
        'type' => 'claim',
        'detail' => 'La prenda llegó con una costura abierta.',
        'consumer_request' => 'Cambio por otra prenda.',
        'accepted' => true,
        ...$overrides,
    ];
}

it('registra hojas con número correlativo y envía la constancia al consumidor y a la tienda', function () {
    Mail::fake();
    app(SettingsRepository::class)->update(['claims_email' => 'reclamos@example.com']);

    $first = $this->postJson('/api/complaints', complaintPayload())->assertCreated();
    $second = $this->postJson('/api/complaints', complaintPayload())->assertCreated();

    $year = now()->year;
    expect($first->json('number'))->toBe("LR-{$year}-000001")
        ->and($second->json('number'))->toBe("LR-{$year}-000002");

    Mail::assertSent(ComplaintReceivedMail::class, fn ($mail) => $mail->hasTo('maria@example.com') && $mail->hasBcc('reclamos@example.com'));
});

it('valida el documento según su tipo y exige aceptar el tratamiento de datos', function () {
    $this->postJson('/api/complaints', complaintPayload(['document_number' => '123', 'accepted' => false]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['document_number', 'accepted']);

    $this->postJson('/api/complaints', complaintPayload(['is_minor' => true]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('guardian_name');
});

it('calcula el vencimiento en 15 días hábiles', function () {
    // Lunes 2 nov 2026 + 15 días hábiles = lunes 23 nov 2026.
    expect(ComplaintService::addBusinessDays(Carbon::parse('2026-11-02 10:00'), 15)->toDateString())->toBe('2026-11-23');
});

it('el admin responde la hoja y el consumidor recibe la respuesta por correo', function () {
    Mail::fake();
    $this->postJson('/api/complaints', complaintPayload())->assertCreated();
    $complaint = Complaint::query()->sole();

    $this->actingAs(User::factory()->create());
    $this->getJson('/api/admin/complaints')->assertOk()->assertJsonPath('counts.pending', 1);

    $this->patchJson("/api/admin/complaints/{$complaint->id}/answer", ['response' => 'Coordinamos el cambio sin costo.'])
        ->assertOk()
        ->assertJsonPath('status', 'answered');

    $this->patchJson("/api/admin/complaints/{$complaint->id}/answer", ['response' => 'Otra respuesta distinta.'])
        ->assertUnprocessable();

    Mail::assertSent(ComplaintAnsweredMail::class, fn ($mail) => $mail->hasTo('maria@example.com'));
});

it('protege el listado de reclamos', function () {
    $this->getJson('/api/admin/complaints')->assertUnauthorized();
    $this->actingAs(User::factory()->notAdmin()->create())->getJson('/api/admin/complaints')->assertForbidden();
});
