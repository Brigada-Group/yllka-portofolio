<?php

namespace App\Settings;

use Illuminate\Support\Facades\Storage;
use Spatie\LaravelSettings\Settings;

class SiteSettings extends Settings
{
    public string $name;

    public string $headline;

    /** Short role, shown in a corner of the hero, e.g. "Full-stack @ Brigada". */
    public string $role;

    /** Degree, shown in a corner of the hero. */
    public ?string $education;

    public string $bio;

    public ?string $avatar;

    public ?string $resume;

    public string $email;

    public ?string $location;

    /** IANA timezone for the live local time in the hero, e.g. Europe/Zurich. */
    public string $timezone;

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
            'role' => $this->role,
            'education' => $this->education,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar ? Storage::disk('public')->url($this->avatar) : null,
            'resume_url' => $this->resume ? Storage::disk('public')->url($this->resume) : null,
            'email' => $this->email,
            'location' => $this->location,
            'timezone' => $this->timezone,
            'social' => [
                'linkedin' => $this->linkedin_url,
                'github' => $this->github_url,
                'dribbble' => $this->dribbble_url,
                'behance' => $this->behance_url,
            ],
        ];
    }
}
