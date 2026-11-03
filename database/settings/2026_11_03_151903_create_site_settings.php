<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('site.name', config('app.name'));
        $this->migrator->add('site.headline', '');
        $this->migrator->add('site.bio', '');
        $this->migrator->add('site.avatar', null);
        $this->migrator->add('site.resume', null);
        $this->migrator->add('site.email', '');
        $this->migrator->add('site.location', null);
        $this->migrator->add('site.linkedin_url', null);
        $this->migrator->add('site.github_url', null);
        $this->migrator->add('site.dribbble_url', null);
        $this->migrator->add('site.behance_url', null);
    }
};
