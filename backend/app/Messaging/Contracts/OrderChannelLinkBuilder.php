<?php

namespace App\Messaging\Contracts;

interface OrderChannelLinkBuilder
{
    /** Enlace que abre el canal (WhatsApp) con el mensaje precargado. */
    public function build(string $message): string;
}
