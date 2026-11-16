<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Constancia de la hoja de reclamación (copia para el consumidor y la tienda). */
class ComplaintReceivedMail extends Mailable
{
    /** @param array<string,string> $store */
    public function __construct(public readonly Complaint $complaint, public readonly array $store) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Hoja de reclamación {$this->complaint->number} – {$this->store['store_name']}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.complaint', with: ['c' => $this->complaint, 'store' => $this->store, 'answered' => false]);
    }
}
