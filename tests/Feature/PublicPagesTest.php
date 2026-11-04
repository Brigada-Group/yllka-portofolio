<?php

use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Testimonial;
use Inertia\Testing\AssertableInertia as Assert;

test('home page shows featured published projects, skills and experience', function () {
    Project::factory()->featured()->count(2)->create();
    Project::factory()->create();
    Project::factory()->featured()->draft()->create();
    Skill::factory()->count(3)->create();
    Experience::factory()->count(2)->create();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('featuredProjects', 2)
            ->has('skills', 3)
            ->has('experiences', 2)
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
            ->has('project.gallery_images'));
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
                ->hasAll(['name', 'title', 'headline', 'role', 'education', 'bio', 'avatar_url', 'resume_url', 'email', 'phone', 'languages', 'location', 'timezone', 'social'])));
})->with(['/', '/projects', '/about', '/contact']);

test('case study sections cleared in the editor are stored as empty', function () {
    $project = Project::factory()->create([
        'problem' => '<p></p>',
        'process' => '<p><br></p>',
        'solution' => '<p>&nbsp;</p>',
        'outcome' => '<p>Shipped it.</p>',
    ]);

    expect($project->refresh())
        ->problem->toBeNull()
        ->process->toBeNull()
        ->solution->toBeNull()
        ->outcome->toBe('<p>Shipped it.</p>');
});

test('accessibility statement page renders', function () {
    $this->get('/accessibility')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('accessibility'));
});

test('gallery images keep their alt text', function () {
    $project = Project::factory()->create([
        'gallery' => [['image' => 'projects/gallery/a.png', 'alt' => 'The booking calendar']],
    ]);

    $this->get("/projects/{$project->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('project.gallery_images.0.alt', 'The booking calendar'));
});
