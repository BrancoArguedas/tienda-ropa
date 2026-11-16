<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Respuesta del proveedor a la hoja de reclamación. */
class ComplaintAnsweredMail extends Mailable
{
    /** @param array<string,string> $store */
    public function __construct(public readonly Complaint $complaint, public readonly array $store) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Respuesta a tu hoja de reclamación {$this->complaint->number}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.complaint', with: ['c' => $this->complaint, 'store' => $this->store, 'answered' => true]);
    }
}
