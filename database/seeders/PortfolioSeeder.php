<?php

namespace Database\Seeders;

use App\Enums\SkillCategory;
use App\Models\ContactMessage;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class PortfolioSeeder extends Seeder
{
    public function run(): void
    {
        $this->projects();
        $this->skills();
        $this->experiences();
        $this->testimonials();

        ContactMessage::factory()->count(3)->create();
        ContactMessage::factory()->count(2)->read()->create();
    }

    protected function projects(): void
    {
        $projects = [
            [
                'title' => 'Clinic Booking Redesign',
                'short_description' => 'Reworking the appointment booking flow for a network of physiotherapy clinics, cutting drop-off on mobile by more than a third.',
                'role' => 'UI/UX Designer & Developer',
                'client' => 'Physio Plus',
                'year' => 2026,
                'duration' => '4 months',
                'tools' => ['Figma', 'Maze', 'React', 'TypeScript', 'Laravel'],
                'problem' => '<p>Patients booked appointments through a seven-step form built for desktop. On mobile, where 70% of visits came from, almost half of users abandoned the flow before choosing a time slot.</p><p>Reception staff were spending hours a week rebooking people by phone.</p>',
                'process' => '<p>I started with session recordings and five interviews with patients and two receptionists. The biggest friction points were choosing a therapist before knowing availability, and creating an account before booking.</p><ul><li>Mapped the existing flow and its drop-off per step</li><li>Sketched three alternative flows and tested them as clickable prototypes in Maze</li><li>Ran a second round of tests with the strongest direction</li></ul>',
                'solution' => '<p>The new flow leads with availability: patients choose a time first and the system suggests a therapist. Account creation moved to the confirmation step and became optional. I built the new flow in React on top of the existing Laravel API.</p>',
                'outcome' => '<p>Mobile completion went from 52% to 81% in the first month. Phone rebookings dropped noticeably, and the clinic rolled the same pattern out to its group classes.</p>',
                'live_url' => 'https://example.com/booking',
                'figma_url' => 'https://www.figma.com/file/example',
                'is_featured' => true,
            ],
            [
                'title' => 'Revenue Dashboard for Hotels',
                'short_description' => 'Designing a dashboard that lets small hotel owners understand pricing and occupancy without a revenue manager.',
                'role' => 'Product Designer & Frontend Developer',
                'client' => 'StayWell',
                'year' => 2025,
                'duration' => '6 months',
                'tools' => ['Figma', 'FigJam', 'React', 'Recharts', 'Tailwind CSS'],
                'problem' => '<p>Owners of independent hotels had access to the same data as large chains but no one to interpret it. The existing reports were tables of numbers that most users exported to Excel and never opened again.</p>',
                'process' => '<p>Together with the product manager I ran a card-sorting exercise to find which metrics owners actually cared about. We found three: how full am I next month, am I priced like my competitors, and what changed since last week.</p><p>I designed around those three questions and validated the layout with eight owners over two iterations.</p>',
                'solution' => '<p>A single overview page answers the three questions at a glance, with plain-language summaries above each chart. Details are one click away rather than all on the screen at once.</p>',
                'outcome' => '<p>Weekly active usage of the reporting area tripled, and the support team saw fewer "what does this number mean" tickets.</p>',
                'is_featured' => true,
            ],
            [
                'title' => 'Volunteer Onboarding App',
                'short_description' => 'A mobile-first onboarding flow for a food bank that relies on hundreds of new volunteers every season.',
                'role' => 'UI/UX Designer',
                'client' => 'City Food Bank',
                'year' => 2025,
                'duration' => '8 weeks',
                'tools' => ['Figma', 'Google Forms', 'Notion'],
                'problem' => '<p>New volunteers received a 12-page PDF and a phone call. Many showed up on their first shift unsure of where to go or what to bring, and coordinators lost time repeating the same instructions.</p>',
                'process' => '<p>I shadowed two volunteer shifts and interviewed coordinators to understand what new volunteers really needed to know before day one. Most of the PDF turned out to be irrelevant until the second or third shift.</p>',
                'solution' => '<p>A short, step-by-step onboarding flow that covers only what matters for the first shift: location, what to wear, who to ask for. Everything else is delivered gradually after each shift.</p>',
                'outcome' => '<p>Coordinators reported far fewer first-day questions, and the food bank now uses the same structure for its donor onboarding.</p>',
                'figma_url' => 'https://www.figma.com/file/example',
                'is_featured' => true,
            ],
            [
                'title' => 'Design System for an Internal Tool Suite',
                'short_description' => 'Consolidating five internal tools into one shared component library and documentation site.',
                'role' => 'Frontend Developer',
                'client' => null,
                'year' => 2024,
                'duration' => '5 months',
                'tools' => ['Figma', 'React', 'Storybook', 'TypeScript'],
                'problem' => '<p>Five internal tools had been built by different teams, each with its own buttons, forms and table patterns. Users switching between tools had to relearn basic interactions.</p>',
                'process' => '<p>I audited every screen across the tools and grouped components into patterns. With two designers I agreed on a shared set of primitives and documented the decisions behind them.</p>',
                'solution' => '<p>A React component library with Storybook documentation, adopted tool by tool. Each component ships with usage guidance written for developers, not only designers.</p>',
                'outcome' => '<p>Three of the five tools migrated within the project timeline. New features are now built noticeably faster because teams start from existing components.</p>',
                'repo_url' => 'https://github.com/example/design-system',
            ],
            [
                'title' => 'Recipe Planner Concept',
                'short_description' => 'A self-initiated concept exploring how meal planning could feel less like a chore.',
                'role' => 'UI/UX Designer & Developer',
                'client' => null,
                'year' => 2024,
                'duration' => null,
                'tools' => ['Figma', 'Next.js'],
                'problem' => '<p>Work in progress.</p>',
                'process' => '<p>Work in progress.</p>',
                'solution' => '<p>Work in progress.</p>',
                'outcome' => '<p>Work in progress.</p>',
                'is_published' => false,
            ],
        ];

        foreach ($projects as $data) {
            Project::factory()->create([
                'live_url' => null,
                'repo_url' => null,
                'figma_url' => null,
                'is_featured' => false,
                'is_published' => true,
                ...$data,
                'cover_image' => PlaceholderImage::make('projects/covers', $data['title']),
                'gallery' => collect(range(1, 3))
                    ->map(fn (int $i) => PlaceholderImage::make('projects/gallery', "{$data['title']} {$i}"))
                    ->all(),
            ]);
        }
    }

    protected function skills(): void
    {
        $skills = [
            SkillCategory::Design->value => ['User research', 'Wireframing', 'Prototyping', 'Usability testing', 'Design systems', 'Accessibility'],
            SkillCategory::Frontend->value => ['React', 'TypeScript', 'Tailwind CSS', 'Inertia.js', 'HTML & CSS'],
            SkillCategory::Backend->value => ['Laravel', 'PHP', 'REST APIs', 'MySQL'],
            SkillCategory::Tools->value => ['Figma', 'FigJam', 'Maze', 'Storybook', 'Git'],
        ];

        foreach ($skills as $category => $names) {
            foreach ($names as $name) {
                Skill::create(['name' => $name, 'category' => $category]);
            }
        }
    }

    protected function experiences(): void
    {
        $experiences = [
            [
                'company' => 'Northwind Software',
                'position' => 'Frontend Developer & UI Designer',
                'start_date' => '2023-03-01',
                'end_date' => null,
                'description' => 'Design and build product interfaces for hospitality clients. Led the redesign of the reporting module, from user interviews to the shipped React frontend.',
            ],
            [
                'company' => 'Brightside Studio',
                'position' => 'Frontend Developer',
                'start_date' => '2020-09-01',
                'end_date' => '2023-02-28',
                'description' => 'Built marketing sites and web apps for agency clients with Laravel and React. Started running usability tests on our own prototypes, which turned into a regular part of the studio process.',
            ],
            [
                'company' => 'Freelance',
                'position' => 'Web Developer',
                'start_date' => '2019-01-01',
                'end_date' => '2020-08-31',
                'description' => 'Designed and developed websites for small businesses and non-profits.',
            ],
        ];

        foreach ($experiences as $experience) {
            Experience::create($experience);
        }
    }

    protected function testimonials(): void
    {
        $testimonials = [
            [
                'name' => 'Maria Keller',
                'role' => 'Head of Product',
                'company' => 'StayWell',
                'quote' => 'Yllka has a rare ability to move between research, design and code without losing sight of the user. The dashboard prototypes were so close to production that we skipped a whole handoff phase.',
            ],
            [
                'name' => 'Jonas Weber',
                'role' => 'Operations Manager',
                'company' => 'Physio Plus',
                'quote' => 'Our patients noticed the new booking flow straight away. Yllka listened carefully to our reception team and it shows in the result.',
            ],
            [
                'name' => 'Sara Lindqvist',
                'role' => 'Volunteer Coordinator',
                'company' => 'City Food Bank',
                'quote' => 'Clear, kind and quick to understand how we work. The onboarding flow has saved our coordinators hours every week.',
                'is_published' => false,
            ],
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::create([
                'is_published' => true,
                ...$testimonial,
                'avatar' => PlaceholderImage::make('testimonials', $testimonial['name'], 300, 300),
            ]);
        }
    }
}
