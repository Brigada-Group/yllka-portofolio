<?php

use App\Models\Project;
use Database\Seeders\PortfolioContentSeeder;
use Illuminate\Support\Facades\Storage;

test('seeded projects have real case studies and published images', function () {
    Storage::fake('public');

    $this->seed(PortfolioContentSeeder::class);

    $projects = Project::query()->ordered()->get();

    expect($projects->pluck('slug')->all())->toBe(['vector-guest', 'anthem']);

    foreach ($projects as $project) {
        expect($project->problem)->not->toContain('TODO')
            ->and($project->process)->not->toContain('TODO')
            ->and($project->cover_image_alt)->not->toBeEmpty();

        Storage::disk('public')->assertExists($project->cover_image);
    }

    Storage::disk('public')->assertExists($projects->last()->gallery[0]['image']);
});

test('a seeded case study page leaves out sections with no content', function () {
    Storage::fake('public');

    $this->seed(PortfolioContentSeeder::class);

    $this->get('/projects/anthem')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('project.solution', null)
            ->where('project.outcome', null));
});
