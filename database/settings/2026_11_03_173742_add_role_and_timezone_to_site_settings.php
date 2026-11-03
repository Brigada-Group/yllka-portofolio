<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('site.role', 'UI/UX *Designer*');
        $this->migrator->add('site.timezone', 'Europe/Zurich');
    }
};
