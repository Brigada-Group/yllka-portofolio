<?php

namespace Database\Factories;

use App\Models\Experience;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Experience>
 */
class ExperienceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-8 years', '-1 year');

        return [
            'type' => 'work',
            'company' => fake()->company(),
            'position' => fake()->jobTitle(),
            'start_date' => $start,
            'end_date' => fake()->optional()->dateTimeBetween($start),
            'description' => fake()->paragraph(),
        ];
    }
}
