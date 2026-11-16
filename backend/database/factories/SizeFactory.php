<?php

namespace Database\Factories;

use App\Models\Size;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Size> */
class SizeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => strtoupper($this->faker->unique()->bothify('?#')),
            'position' => $this->faker->numberBetween(0, 20),
        ];
    }
}
