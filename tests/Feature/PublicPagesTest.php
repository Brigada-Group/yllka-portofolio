<?php

use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Testimonial;
use Inertia\Testing\AssertableInertia as Assert;

test('home page shows featured published projects and skills', function () {
    Project::factory()->featured()->count(2)->create();
    Project::factory()->create();
    Project::factory()->featured()->draft()->create();
    Skill::factory()->count(3)->create();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('featuredProjects', 2)
            ->has('skills', 3)
            ->has('site.name'));
});

test('projects page lists only published projects in sort order', function () {
    $second = Project::factory()->create(['sort_order' => 2]);
    $first = Project::factory()->create(['sort_order' => 1]);
    Project::factory()->draft()->create();

    $this->get('/projects')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/index')
            ->has('projects', 2)
            ->where('projects.0.slug', $first->slug)
            ->where('projects.1.slug', $second->slug));
});

test('project page shows a published case study', function () {
    $project = Project::factory()->create(['title' => 'Booking Flow Redesign']);

    expect($project->slug)->toBe('booking-flow-redesign');

    $this->get('/projects/booking-flow-redesign')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.title', 'Booking Flow Redesign')
            ->has('project.problem')
            ->has('project.gallery_urls'));
});

test('unpublished and missing projects return 404', function () {
    $draft = Project::factory()->draft()->create();

    $this->get("/projects/{$draft->slug}")->assertNotFound();
    $this->get('/projects/does-not-exist')->assertNotFound();
});

test('about page shows experience, skills and published testimonials', function () {
    Experience::factory()->count(2)->create();
    Skill::factory()->count(4)->create();
    Testimonial::factory()->count(2)->create();
    Testimonial::factory()->draft()->create();

    $this->get('/about')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('about')
            ->has('experiences', 2)
            ->has('skills', 4)
            ->has('testimonials', 2));
});

test('contact page renders', function () {
    $this->get('/contact')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('contact'));
});

test('site settings are shared with every page', function (string $url) {
    $this->get($url)
        ->assertInertia(fn (Assert $page) => $page
            ->has('site', fn (Assert $site) => $site
                ->hasAll(['name', 'headline', 'bio', 'avatar_url', 'resume_url', 'email', 'location', 'social'])));
})->with(['/', '/projects', '/about', '/contact']);
