import { Link } from '@inertiajs/react';
import { plainText } from '@/components/emphasis';
import { meshStyle } from '@/components/project-cover';
import projects from '@/routes/projects';
import type { ProjectSummary } from '@/types';

/** A small link to the newest case study: thumbnail, title and role, and an arrow. */
export default function LatestWork({
    project,
    className = '',
}: {
    project: ProjectSummary;
    className?: string;
}) {
    return (
        <Link
            href={projects.show(project.slug)}
            className={`group items-end gap-4 ${className}`}
        >
            <div className="aspect-[16/10] w-[180px] shrink-0 overflow-hidden rounded-[5px] border border-line">
                {project.cover_image_url ? (
                    <img
                        src={project.cover_image_url}
                        alt=""
                        className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-safe:group-hover:scale-105"
                    />
                ) : (
                    <div
                        aria-hidden="true"
                        className="mesh size-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-safe:group-hover:scale-105"
                        style={meshStyle(project.slug)}
                    />
                )}
            </div>

            <div className="font-mono text-label uppercase">
                <p className="text-muted">Latest work</p>
                <p className="mt-2 text-foreground">
                    {plainText(project.title)}
                </p>
                {project.role && <p className="text-muted">{project.role}</p>}
                <span
                    aria-hidden="true"
                    className="mt-2 inline-block text-base text-foreground transition-transform duration-300 motion-safe:group-hover:translate-x-1.5"
                >
                    →
                </span>
            </div>
        </Link>
    );
}
