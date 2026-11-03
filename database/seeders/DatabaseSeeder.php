<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Remove placeholder images from previous seed runs.
        foreach (['projects', 'testimonials', 'site'] as $directory) {
            Storage::disk('public')->deleteDirectory($directory);
        }

        $this->call([
            AdminUserSeeder::class,
            SiteSettingsSeeder::class,
            PortfolioSeeder::class,
        ]);
    }
}
