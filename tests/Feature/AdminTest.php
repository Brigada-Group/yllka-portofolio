<?php

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
