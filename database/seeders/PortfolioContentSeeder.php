<?php

namespace Database\Seeders;

use App\Enums\ExperienceType;
use App\Enums\SkillCategory;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Testimonial;
use App\Settings\SiteSettings;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Yllka Selimi's portfolio content: site settings, projects, skills and
 * experience. Everything here is editable in Filament afterwards.
 *
 * This replaces the existing content (it clears projects, skills,
 * experience and testimonials first), so run it to set up a fresh
 * database, not over content edited in Filament.
 */
class PortfolioContentSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->settings();
            $this->projects();
            $this->skills();
            $this->experience();
            Testimonial::query()->delete();
        });
    }

    protected function settings(): void
    {
        $settings = app(SiteSettings::class);

        $settings->name = 'Yllka Selimi';
        $settings->title = 'UI/UX and Frontend Specialist';
        $settings->headline = 'Frontend developer *designing* calm, usable interfaces.';
        $settings->bio = 'UI/UX and frontend specialist with 3 years of professional experience building web applications. '
            .'I work across user flows, design systems and calm, accessible interfaces, and I build what I design.';
        $settings->role = 'Frontend @ Brigada';
        $settings->education = 'BSc Computer Science & Engineering';
        $settings->location = 'Pristina, Kosovo';
        // Kosovo has no IANA zone of its own; it uses Central European Time like Belgrade.
        $settings->timezone = 'Europe/Belgrade';
        $settings->email = 'yllka@brigada.dev';
        $settings->phone = '+383 49 502 085';
        $settings->languages = [
            ['language' => 'Albanian', 'level' => 'Native'],
            ['language' => 'English', 'level' => 'Fluent'],
        ];
        $settings->avatar = null;
        $settings->resume = null;
        $settings->linkedin_url = null;
        $settings->github_url = null;
        $settings->dribbble_url = null;
        $settings->behance_url = null;

        $settings->save();
    }

    protected function projects(): void
    {
        Project::query()->delete();

        $projects = [
            [
                'title' => 'Vector Guest',
                'slug' => 'vector-guest',
                'short_description' => 'The agentic AI system for hotel operations: it connects hotel data and workflows across the existing stack, so agents complete work with approvals and autonomy the operator controls.',
                'context' => 'Yllka joined the product in October 2026. The image shows the public product site, not her redesign.',
                'role' => 'UI/UX and Frontend',
                'category' => 'Hospitality · AI',
                'year' => 2026,
                'tools' => ['Claude Design'],
                'problem' => '<p>Hotel operations software is dense: many numbers, dates and decisions on one screen. Operators still need to judge everything at a glance and stay in control of what the AI does.</p>',
                'process' => '<p>I reviewed the product page by page and proposed shared patterns for hierarchy, statuses, spacing, cards and calls to action. I design screens in Claude Design for team review before they reach the codebase.</p>',
                'cover_image' => $this->publishImage('vector-guest-cover.jpg'),
                'cover_image_alt' => 'The Vector Guest website beside a product dashboard showing arrivals, turnovers and bookings.',
                'gallery' => [
                    [
                        'image' => $this->publishImage('vector-guest-cover.jpg'),
                        'alt' => 'The Vector Guest website beside a product dashboard showing arrivals, turnovers and bookings.',
                    ],
                ],
                'live_url' => 'https://vectorguest.com',
            ],
            [
                'title' => 'Anthem',
                'slug' => 'anthem',
                'short_description' => 'A digital casting marketplace connecting brands and agencies with talent.',
                'context' => 'Frontend work from March to June 2025, as part of the Brigada team.',
                'role' => 'Frontend Developer',
                'category' => 'Recruiting · Platform',
                'year' => 2025,
                'tools' => ['React', 'Tailwind CSS', 'Laravel'],
                'problem' => '<p>Casting involves two sides with different needs: agencies seeking talent and agencies representing it. Each needs its own workspace around the same briefs.</p>',
                'process' => '<p>I built early frontend work in React: the responsive landing page, sign-in, dashboards for both agency types and the multi-step brief creation flow.</p>',
                'cover_image' => $this->publishImage('anthem-cover.jpg'),
                'cover_image_alt' => 'The Anthem landing page: a headline about casting talent beside a flowing coral and teal shape.',
                'gallery' => [
                    [
                        'image' => $this->publishImage('anthem-cover.jpg'),
                        'alt' => 'The Anthem landing page: a headline about casting talent beside a flowing coral and teal shape.',
                    ],
                    [
                        'image' => $this->publishImage('anthem-briefs.jpg'),
                        'alt' => 'The Anthem casting briefs workspace, with a sidebar and a grid of open briefs.',
                    ],
                ],
                'live_url' => 'https://anthemglobal.io',
            ],
        ];

        foreach ($projects as $index => $project) {
            Project::create([
                'client' => null,
                'duration' => null,
                'solution' => null,
                'outcome' => null,
                'gallery' => [],
                'repo_url' => null,
                'figma_url' => null,
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => $index + 1,
                ...$project,
            ]);
        }
    }

    /** Copy a project image from the seeder folder to public storage and return its path. */
    protected function publishImage(string $filename): string
    {
        $path = "projects/{$filename}";

        Storage::disk('public')->put($path, file_get_contents(database_path("seeders/images/{$filename}")));

        return $path;
    }

    protected function skills(): void
    {
        Skill::query()->delete();

        $skills = [
            SkillCategory::Frontend->value => ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Three.js', 'Git'],
            SkillCategory::Backend->value => ['Laravel', 'PHP'],
            SkillCategory::Design->value => ['Figma', 'Claude Design', 'Wireframing', 'Prototyping', 'Design systems'],
        ];

        $order = 0;

        foreach ($skills as $category => $names) {
            foreach ($names as $name) {
                Skill::create(['name' => $name, 'category' => $category, 'sort_order' => ++$order]);
            }
        }
    }

    protected function experience(): void
    {
        Experience::query()->delete();

        // Newest first. Where only years are known, show_months stays off.
        $entries = [
            [
                'type' => ExperienceType::Work,
                'company' => 'Brigada',
                'position' => 'Full-stack Developer, frontend focus',
                'location' => 'Pristina',
                'url' => null,
                'start_date' => '2024-01-01',
                'end_date' => null,
                'show_months' => false,
                'description' => implode("\n", [
                    'Build user-facing features for web applications',
                    'Turn requirements into user flows, wireframes and production UI',
                    'Create reusable component libraries to keep interfaces consistent',
                ]),
            ],
            [
                'type' => ExperienceType::Education,
                'company' => 'UBT – University for Business and Technology',
                'position' => 'BSc in Computer Science and Engineering, specialization in Web Programming',
                'location' => 'Pristina',
                'url' => 'https://www.ubt-uni.net/sq/ballina/',
                'start_date' => '2020-01-01',
                'end_date' => '2024-01-01',
                'show_months' => false,
                'description' => null,
            ],
            [
                'type' => ExperienceType::Course,
                'company' => 'PerProgramera',
                'position' => 'Full Stack Web Developer Bootcamp',
                'location' => null,
                'url' => null,
                'start_date' => '2023-04-01',
                'end_date' => '2023-12-01',
                'show_months' => true,
                'description' => null,
            ],
            [
                'type' => ExperienceType::Course,
                'company' => 'Cacttus Education',
                'position' => 'Data Engineering Training',
                'location' => null,
                'url' => null,
                'start_date' => '2022-10-01',
                'end_date' => '2022-11-01',
                'show_months' => true,
                'description' => null,
            ],
        ];

        foreach ($entries as $index => $entry) {
            Experience::create([...$entry, 'sort_order' => $index + 1]);
        }
    }
}
