import { Link } from '@inertiajs/react';
import RichText from '@/components/rich-text';
import Seo from '@/components/seo';
import projects from '@/routes/projects';
import type { Project } from '@/types';

const sections = [
    { key: 'problem', title: 'Problem' },
    { key: 'process', title: 'Process' },
    { key: 'solution', title: 'Solution' },
    { key: 'outcome', title: 'Outcome' },
] as const;

export default function ProjectShow({ project }: { project: Project }) {
    const links = [
        { label: 'Live site', href: project.live_url },
        { label: 'Repository', href: project.repo_url },
        { label: 'Figma', href: project.figma_url },
    ].filter((link) => link.href);

    return (
        <article className="space-y-10">
            <Seo
                title={project.title}
                description={project.short_description}
            />

            <header className="space-y-4">
                <Link href={projects.index()}>← All projects</Link>
                <h1>{project.title}</h1>
                <p>{project.short_description}</p>

                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                        <dt>Role</dt>
                        <dd>{project.role}</dd>
                    </div>
                    {project.client && (
                        <div>
                            <dt>Client</dt>
                            <dd>{project.client}</dd>
                        </div>
                    )}
                    <div>
                        <dt>Year</dt>
                        <dd>{project.year}</dd>
                    </div>
                    {project.duration && (
                        <div>
                            <dt>Duration</dt>
                            <dd>{project.duration}</dd>
                        </div>
                    )}
                </dl>

                {project.tools && project.tools.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                        {project.tools.map((tool) => (
                            <li key={tool}>{tool}</li>
                        ))}
                    </ul>
                )}

                {links.length > 0 && (
                    <ul className="flex gap-4">
                        {links.map((link) => (
                            <li key={link.label}>
                                <a
                                    href={link.href!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {project.cover_image_url && (
                <img src={project.cover_image_url} alt="" className="w-full" />
            )}

            {sections.map(
                (section) =>
                    project[section.key] && (
                        <section key={section.key} className="space-y-4">
                            <h2>{section.title}</h2>
                            <RichText html={project[section.key]} />
                        </section>
                    ),
            )}

            {project.gallery_urls.length > 0 && (
                <section className="space-y-4">
                    <h2>Gallery</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {project.gallery_urls.map((url, index) => (
                            <img
                                key={url}
                                src={url}
                                alt={`${project.title}, image ${index + 1}`}
                                className="w-full"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </section>
            )}
        </article>
    );
}
