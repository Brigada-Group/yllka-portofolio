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
        $settings->title = 'Frontend Developer · UI/UX';
        $settings->headline = 'Frontend developer *designing* calm, usable interfaces.';
        $settings->bio = 'Frontend-focused developer with 3 years of professional experience building web applications. '
            .'I bring a strong interest in UI/UX: user flows, design systems and calm, accessible interfaces.';
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

        $todo = fn (string $what) => "<p>[TODO: write {$what}]</p>";

        $projects = [
            [
                'title' => 'Vector Guest (Harold OS)',
                'slug' => 'vector-guest',
                'short_description' => "A hospitality operating system that combines a system of records with LLM agents to run a property portfolio's whole operation: revenue, demand, guest journey and the ground team's daily decisions.",
                'context' => 'Built operator-first with a design partner running a multi-million-euro aparthotel portfolio.',
                'role' => 'UI/UX Designer',
                'category' => 'Hospitality · AI',
            ],
            [
                'title' => 'Anthem',
                'slug' => 'anthem',
                'short_description' => 'A recruiting platform for casting voice actors on projects.',
                'context' => null,
                'role' => 'Frontend Developer',
                'category' => 'Recruiting · Platform',
            ],
        ];

        foreach ($projects as $index => $project) {
            Project::create([
                ...$project,
                'year' => null,
                'client' => null,
                'duration' => null,
                'tools' => [],
                'problem' => $todo('the problem'),
                'process' => $todo('the process'),
                'solution' => $todo('the solution'),
                'outcome' => $todo('the outcome'),
                // No cover yet: the site shows a gradient mesh until one is uploaded.
                'cover_image' => null,
                'gallery' => [],
                'live_url' => null,
                'repo_url' => null,
                'figma_url' => null,
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => $index + 1,
            ]);
        }
    }

    protected function skills(): void
    {
        Skill::query()->delete();

        $skills = [
            SkillCategory::Frontend->value => ['React', 'JavaScript', 'Tailwind CSS', 'Three.js'],
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
