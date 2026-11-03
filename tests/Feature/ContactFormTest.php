<?php

use App\Models\ContactMessage;

test('a visitor can send a contact message', function () {
    $this->from('/contact')
        ->post('/contact', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'message' => 'Hi, I would like to talk about a project.',
        ])
        ->assertRedirect('/contact')
        ->assertSessionHasNoErrors();

    $message = ContactMessage::sole();

    expect($message)
        ->name->toBe('Jane Doe')
        ->email->toBe('jane@example.com')
        ->read_at->toBeNull();
});

test('contact form validates input', function (array $data, array $errors) {
    $this->from('/contact')
        ->post('/contact', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'message' => 'Hi, I would like to talk about a project.',
            ...$data,
        ])
        ->assertRedirect('/contact')
        ->assertSessionHasErrors($errors);

    expect(ContactMessage::count())->toBe(0);
})->with([
    'missing name' => [['name' => ''], ['name']],
    'invalid email' => [['email' => 'not-an-email'], ['email']],
    'message too short' => [['message' => 'Hi'], ['message']],
    'everything missing' => [['name' => '', 'email' => '', 'message' => ''], ['name', 'email', 'message']],
]);

test('contact form is rate limited', function () {
    $data = [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'message' => 'Hi, I would like to talk about a project.',
    ];

    foreach (range(1, 5) as $i) {
        $this->from('/contact')->post('/contact', $data)->assertSessionHasNoErrors();
    }

    $this->from('/contact')
        ->post('/contact', $data)
        ->assertRedirect('/contact')
        ->assertSessionHasErrors('message');

    expect(ContactMessage::count())->toBe(5);
});
