<?php

namespace App\Messaging;

use App\Services\Settings\SettingsRepository;
use NumberFormatter;

class MoneyFormatter
{
    public function __construct(private readonly SettingsRepository $settings) {}

    public function format(string|float $amount): string
    {
        $formatter = new NumberFormatter(str_replace('-', '_', $this->settings->get('locale')), NumberFormatter::CURRENCY);
        $formatted = $formatter->formatCurrency((float) $amount, $this->settings->get('currency_code'));

        return $formatted === false ? number_format((float) $amount, 2) : $formatted;
    }
}
