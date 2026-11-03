<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->company().' Redesign',
            'slug' => fn (array $attributes) => Str::slug($attributes['title']),
            'short_description' => fake()->sentence(16),
            'role' => fake()->randomElement(['UI/UX Designer & Developer', 'Product Designer', 'Frontend Developer']),
            'category' => fake()->randomElement(['Product design', 'Web app', 'Design system']),
            'client' => fake()->optional()->company(),
            'year' => fake()->numberBetween(2019, (int) date('Y')),
            'duration' => fake()->optional()->randomElement(['6 weeks', '3 months', '6 months']),
            'tools' => fake()->randomElements(['Figma', 'React', 'TypeScript', 'Laravel', 'Tailwind CSS', 'Maze', 'FigJam'], 3),
            'problem' => '<p>'.fake()->paragraph().'</p>',
            'process' => '<p>'.fake()->paragraph().'</p>',
            'solution' => '<p>'.fake()->paragraph().'</p>',
            'outcome' => '<p>'.fake()->paragraph().'</p>',
            'cover_image' => null,
            'gallery' => [],
            'live_url' => fake()->optional()->url(),
            'repo_url' => null,
            'figma_url' => null,
            'is_featured' => false,
            'is_published' => true,
        ];
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => ['is_featured' => true]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['is_published' => false]);
    }
}
