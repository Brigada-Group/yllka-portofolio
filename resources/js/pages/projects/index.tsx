import ProjectCard from '@/components/project-card';
import Seo from '@/components/seo';
import type { ProjectSummary } from '@/types';

export default function ProjectsIndex({
    projects,
}: {
    projects: ProjectSummary[];
}) {
    return (
        <>
            <Seo
                title="Projects"
                description="Case studies covering research, design and development work."
            />

            <h1>Projects</h1>

            {projects.length === 0 ? (
                <p>No projects yet.</p>
            ) : (
                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </>
    );
}
