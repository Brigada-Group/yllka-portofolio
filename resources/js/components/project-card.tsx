import { Link } from '@inertiajs/react';
import projects from '@/routes/projects';
import type { ProjectSummary } from '@/types';

export default function ProjectCard({ project }: { project: ProjectSummary }) {
    return (
        <article>
            <Link
                href={projects.show(project.slug)}
                className="block space-y-2"
            >
                {project.cover_image_url && (
                    <img
                        src={project.cover_image_url}
                        alt=""
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                    />
                )}
                <h3>{project.title}</h3>
                <p>{project.short_description}</p>
                <p>
                    {project.role} · {project.year}
                    {project.client && ` · ${project.client}`}
                </p>
            </Link>
        </article>
    );
}
