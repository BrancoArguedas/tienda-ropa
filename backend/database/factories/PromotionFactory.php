<?php

namespace Database\Factories;

use App\Enums\PromotionType;
use App\Models\Promotion;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Promotion> */
class PromotionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Promo '.$this->faker->word(),
            'type' => PromotionType::Percentage,
            'value' => 20,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addWeek(),
            'is_active' => true,
        ];
    }

    public function expired(): static
    {
        return $this->state(['starts_at' => now()->subMonth(), 'ends_at' => now()->subDay()]);
    }

    public function fixed(string $amount): static
    {
        return $this->state(['type' => PromotionType::Fixed, 'value' => $amount]);
    }
}
