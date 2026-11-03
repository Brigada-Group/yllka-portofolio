import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import ContactForm from '@/components/contact-form';
import ExperienceTimeline from '@/components/experience-timeline';
import { OrbStage } from '@/components/orb';
import type { OrbMode, OrbSide } from '@/components/orb';
import ProjectCard from '@/components/project-card';
import Seo from '@/components/seo';
import SkillList from '@/components/skill-list';
import { about } from '@/routes';
import projects from '@/routes/projects';
import type { Experience, ProjectSummary, Skill } from '@/types';

type HomeProps = {
    featuredProjects: ProjectSummary[];
    skills: Skill[];
    experiences: Experience[];
};

type SectionProps = {
    id: string;
    mode?: OrbMode;
    side: OrbSide;
    className?: string;
    children: ReactNode;
};

/**
 * A full-width home section. The inner box is the orb stop: the orb rests
 * in the gutter beside it (or above it on narrow screens), never on top.
 */
function Section({
    id,
    mode = 'vertical',
    side,
    className = '',
    children,
}: SectionProps) {
    return (
        <section id={id} aria-labelledby={`${id}-title`} className={className}>
            <div
                data-orb-stop={id}
                data-orb-mode={mode}
                data-orb-side={side}
                className="mx-auto w-full max-w-3xl px-4"
            >
                {children}
            </div>
        </section>
    );
}

export default function Home({
    featuredProjects,
    skills,
    experiences,
}: HomeProps) {
    const { site } = usePage().props;

    return (
        <>
            <Seo description={site.headline} />
            <OrbStage />

            <Section
                id="hero"
                side="left"
                className="flex min-h-[calc(100svh-5rem)] items-center"
            >
                <div data-orb-reveal data-orb-beside>
                    <h1 id="hero-title">{site.name}</h1>
                    <p>{site.headline}</p>
                </div>
            </Section>

            <Section id="about" side="left" className="py-24 md:py-32">
                <h2 id="about-title">About</h2>
                <p className="whitespace-pre-line">{site.bio}</p>
                <Link href={about()}>More about me</Link>
            </Section>

            <Section
                id="projects"
                mode="horizontal"
                side="left"
                className="py-24 md:py-32"
            >
                <h2 id="projects-title">Selected work</h2>
                <div data-orb-viewport className="mt-6 overflow-x-auto">
                    <div data-orb-row className="flex w-max gap-6">
                        {featuredProjects.map((project) => (
                            <div
                                key={project.id}
                                data-orb-item
                                className="w-72 shrink-0"
                            >
                                <ProjectCard project={project} />
                            </div>
                        ))}
                    </div>
                </div>
                <div data-orb-lane aria-hidden />
                <Link href={projects.index()}>All projects</Link>
            </Section>

            <Section
                id="skills"
                mode="horizontal"
                side="left"
                className="py-24 md:py-32"
            >
                <h2 id="skills-title">Skills</h2>
                <div data-orb-viewport className="mt-6 overflow-x-auto">
                    <SkillList skills={skills} layout="row" />
                </div>
                <div data-orb-lane aria-hidden />
            </Section>

            <Section id="experience" side="left" className="py-24 md:py-32">
                <h2 id="experience-title">Experience</h2>
                <div className="mt-6">
                    <ExperienceTimeline experiences={experiences} />
                </div>
            </Section>

            <Section id="contact" side="left" className="py-24 md:py-32">
                <h2 id="contact-title">Contact</h2>
                <ContactForm className="mt-6 max-w-lg" />
            </Section>
        </>
    );
}
