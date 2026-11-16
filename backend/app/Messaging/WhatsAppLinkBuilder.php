<?php

namespace App\Messaging;

use App\Messaging\Contracts\OrderChannelLinkBuilder;
use App\Services\Settings\SettingsRepository;

class WhatsAppLinkBuilder implements OrderChannelLinkBuilder
{
    public function __construct(private readonly SettingsRepository $settings) {}

    public function build(string $message): string
    {
        $phone = preg_replace('/\D+/', '', $this->settings->get('whatsapp_number'));

        return "https://wa.me/{$phone}?text=".rawurlencode($message);
    }
}
