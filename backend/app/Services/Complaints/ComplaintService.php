<?php

namespace App\Services\Complaints;

use App\Mail\ComplaintAnsweredMail;
use App\Mail\ComplaintReceivedMail;
use App\Models\Complaint;
use App\Models\User;
use App\Services\Settings\SettingsRepository;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ComplaintService
{
    public function __construct(private readonly SettingsRepository $settings) {}

    /** Registra la hoja con número correlativo y envía la constancia al consumidor y a la tienda. */
    public function register(array $data): Complaint
    {
        $data = Arr::except($data, ['accepted', 'website']);

        $complaint = DB::transaction(function () use ($data) {
            $year = (int) now()->year;

            // Bloqueo de la fila del año: dos reclamos simultáneos nunca reciben el mismo número.
            DB::table('complaint_counters')->insertOrIgnore(['year' => $year, 'last_number' => 0]);
            $next = (int) DB::table('complaint_counters')->where('year', $year)->lockForUpdate()->value('last_number') + 1;
            DB::table('complaint_counters')->where('year', $year)->update(['last_number' => $next]);

            $complaint = new Complaint([
                ...$data,
                'is_minor' => (bool) ($data['is_minor'] ?? false),
                'guardian_name' => ($data['is_minor'] ?? false) ? ($data['guardian_name'] ?? null) : null,
                'order_code' => isset($data['order_code']) ? strtoupper($data['order_code']) : null,
            ]);
            $complaint->number = sprintf('LR-%d-%06d', $year, $next);
            $complaint->status = 'pending';
            $complaint->due_at = self::addBusinessDays(now(), Complaint::RESPONSE_BUSINESS_DAYS);
            $complaint->save();

            return $complaint;
        });

        $this->safeSend(function () use ($complaint) {
            $mail = Mail::to($complaint->email);
            if ($copy = $this->settings->get('claims_email')) {
                $mail->bcc($copy);
            }
            $mail->send(new ComplaintReceivedMail($complaint, $this->settings->all()));
        });

        return $complaint;
    }

    public function answer(Complaint $complaint, User $user, string $response): Complaint
    {
        $complaint->forceFill([
            'provider_response' => $response,
            'status' => 'answered',
            'answered_at' => now(),
            'answered_by' => $user->id,
        ])->save();

        $this->safeSend(fn () => Mail::to($complaint->email)->send(new ComplaintAnsweredMail($complaint, $this->settings->all())));

        return $complaint;
    }

    /**
     * La hoja ya quedó registrada: si el correo falla (SMTP caído) no se pierde, se reporta en el log
     * y el consumidor conserva la constancia en pantalla (número + impresión).
     */
    private function safeSend(callable $send): void
    {
        try {
            $send();
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** Suma días hábiles (lunes a viernes). Los feriados nacionales no se descuentan: el plazo queda del lado seguro. */
    public static function addBusinessDays(CarbonInterface $from, int $days): CarbonInterface
    {
        $date = $from->copy()->startOfDay();
        while ($days > 0) {
            $date = $date->addDay();
            if (! $date->isWeekend()) {
                $days--;
            }
        }

        return $date;
    }
}
