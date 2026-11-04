<?php

use App\Models\Project;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;

test('admin login page loads', function () {
    $this->get('/admin/login')->assertOk();
});

test('guests are redirected from the admin panel', function () {
    $this->get('/admin')->assertRedirect('/admin/login');
});

test('the admin can open every admin page', function (string $url) {
    $this->actingAs(User::factory()->create())
        ->get($url)
        ->assertOk();
})->with([
    '/admin',
    '/admin/projects',
    '/admin/projects/create',
    '/admin/skills',
    '/admin/experiences',
    '/admin/testimonials',
    '/admin/contact-messages',
    '/admin/settings',
]);

test('public registration is disabled', function () {
    $this->get('/register')->assertNotFound();
});

test('admin seeder creates the user from env config', function () {
    config(['app.admin' => ['name' => 'Admin', 'email' => 'me@example.com', 'password' => 'secret-password']]);

    $this->seed(AdminUserSeeder::class);

    expect(User::sole()->email)->toBe('me@example.com');
});

test('the project edit page loads with gallery alt text', function () {
    $project = Project::factory()->create([
        'cover_image_alt' => 'A phone showing the booking flow',
        'gallery' => [['image' => 'projects/gallery/a.png', 'alt' => 'The booking calendar']],
    ]);

    $this->actingAs(User::factory()->create())
        ->get("/admin/projects/{$project->id}/edit")
        ->assertOk()
        ->assertSee('Cover alt text')
        ->assertSee('The booking calendar');
});
