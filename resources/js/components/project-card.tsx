import { Link } from '@inertiajs/react';
import Emphasis, { emphasizeTitle, plainText } from '@/components/emphasis';
import ProjectCover from '@/components/project-cover';
import projects from '@/routes/projects';
import type { ProjectSummary } from '@/types';

export default function ProjectCard({ project }: { project: ProjectSummary }) {
    return (
        <article>
            <Link
                href={projects.show(project.slug)}
                className="block space-y-3"
            >
                <div className="aspect-video overflow-hidden rounded-[7px] border border-line">
                    <ProjectCover
                        slug={project.slug}
                        title={project.title}
                        src={project.cover_image_url}
                        alt={project.cover_image_alt}
                    />
                </div>
                <h2 className="text-title">
                    <span className="sr-only">{plainText(project.title)}</span>
                    <span aria-hidden="true">
                        <Emphasis text={emphasizeTitle(project.title)} />
                    </span>
                </h2>
                <p className="text-foreground/80">
                    {project.short_description}
                </p>
                <p className="font-mono text-label text-muted uppercase">
                    {[project.year, project.role, project.category]
                        .filter(Boolean)
                        .join(' — ')}
                </p>
            </Link>
        </article>
    );
}
