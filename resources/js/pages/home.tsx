import { Link, usePage } from '@inertiajs/react';
import ProjectCard from '@/components/project-card';
import Seo from '@/components/seo';
import SkillList from '@/components/skill-list';
import { contact } from '@/routes';
import projects from '@/routes/projects';
import type { ProjectSummary, Skill } from '@/types';

type HomeProps = {
    featuredProjects: ProjectSummary[];
    skills: Skill[];
};

export default function Home({ featuredProjects, skills }: HomeProps) {
    const { site } = usePage().props;

    return (
        <>
            <Seo description={site.headline} />

            <section className="space-y-4">
                {site.avatar_url && (
                    <img
                        src={site.avatar_url}
                        alt={site.name}
                        className="size-24 object-cover"
                    />
                )}
                <h1>{site.name}</h1>
                <p>{site.headline}</p>
                <Link href={contact()}>Get in touch</Link>
            </section>

            <section className="mt-12 space-y-6">
                <h2>Selected work</h2>
                <div className="grid gap-8 sm:grid-cols-2">
                    {featuredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
                <Link href={projects.index()}>All projects</Link>
            </section>

            <section className="mt-12 space-y-6">
                <h2>Skills</h2>
                <SkillList skills={skills} />
            </section>
        </>
    );
}
