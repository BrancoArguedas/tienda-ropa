<?php

namespace Database\Factories;

use App\Models\Color;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Color> */
class ColorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => ucfirst($this->faker->unique()->word()).' '.$this->faker->unique()->numberBetween(1, 99999),
            'hex' => strtoupper($this->faker->hexColor()),
        ];
    }
}
