<?php

namespace App\Settings;

use Illuminate\Support\Facades\Storage;
use Spatie\LaravelSettings\Settings;

class SiteSettings extends Settings
{
    public string $name;

    public string $headline;

    public string $bio;

    public ?string $avatar;

    public ?string $resume;

    public string $email;

    public ?string $location;

    public ?string $linkedin_url;

    public ?string $github_url;

    public ?string $dribbble_url;

    public ?string $behance_url;

    public static function group(): string
    {
        return 'site';
    }

    /**
     * The settings as they are shared with the frontend, with file paths resolved to URLs.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'name' => $this->name,
            'headline' => $this->headline,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar ? Storage::disk('public')->url($this->avatar) : null,
            'resume_url' => $this->resume ? Storage::disk('public')->url($this->resume) : null,
            'email' => $this->email,
            'location' => $this->location,
            'social' => [
                'linkedin' => $this->linkedin_url,
                'github' => $this->github_url,
                'dribbble' => $this->dribbble_url,
                'behance' => $this->behance_url,
            ],
        ];
    }
}
