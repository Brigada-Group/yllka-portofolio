<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    /**
     * Create or update the admin user from ADMIN_EMAIL and ADMIN_PASSWORD in .env.
     */
    public function run(): void
    {
        ['name' => $name, 'email' => $email, 'password' => $password] = config('app.admin');

        if (blank($email) || blank($password)) {
            throw new RuntimeException('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before seeding.');
        }

        User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password, 'email_verified_at' => now()],
        );
    }
}
