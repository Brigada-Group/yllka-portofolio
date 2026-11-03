import { Link } from '@inertiajs/react';
import Emphasis, { emphasizeTitle, plainText } from '@/components/emphasis';
import RevealText from '@/components/reveal-text';
import SectionLabel from '@/components/section-label';
import projects from '@/routes/projects';
import type { ProjectSummary } from '@/types';

/**
 * (01) Selected Work. On desktop the orb path pins this section and slides
 * the row of cards past the orb, which rolls on the lane below; the card
 * nearest the orb is in focus. On small screens the row scrolls sideways.
 */
export default function WorkGallery({ items }: { items: ProjectSummary[] }) {
    return (
        <section
            id="work"
            aria-labelledby="work-title"
            className="pt-24 pb-12 md:pt-20 md:pb-10"
        >
            <div
                data-orb-stop="work"
                data-orb-mode="horizontal"
                data-orb-side="right"
                className="mx-auto max-w-[1600px] px-4 md:px-8"
            >
                <div className="grid grid-cols-12 gap-x-6">
                    <div className="col-span-12 flex items-end justify-between gap-6 md:col-span-10 md:col-start-3">
                        <div>
                            <SectionLabel index={1}>Selected Work</SectionLabel>
                            <RevealText as="h2" className="mt-4 text-display">
                                <span id="work-title">
                                    Selected <Emphasis text="*work*" />
                                </span>
                            </RevealText>
                        </div>
                        <p className="hidden font-mono text-label text-muted uppercase md:block">
                            {String(items.length).padStart(2, '0')} projects
                        </p>
                    </div>
                </div>

                {/* Cards are centred in the viewport, so the middle card lines up with the orb. */}
                <div
                    data-orb-viewport
                    className="mt-8 snap-x snap-mandatory overflow-x-auto md:mt-10"
                >
                    <ul
                        data-orb-row
                        className="flex w-max gap-4 md:gap-10 md:px-[calc((100%_-_70vw)/2)]"
                    >
                        {items.map((project, index) => (
                            <li key={project.id} className="snap-center">
                                <Link
                                    href={projects.show(project.slug)}
                                    data-orb-item
                                    data-cursor="View case"
                                    className="block w-[90vw] md:w-[70vw]"
                                >
                                    <div className="aspect-[16/10] overflow-hidden bg-foreground/5 md:aspect-auto md:h-[44svh]">
                                        {project.cover_image_url && (
                                            <img
                                                src={project.cover_image_url}
                                                alt=""
                                                className="size-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-start gap-5 md:mt-5 md:gap-8">
                                        <span className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.8] text-muted italic">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                            <h3 className="text-title">
                                                <span className="sr-only">
                                                    {plainText(project.title)}
                                                </span>
                                                <span aria-hidden="true">
                                                    <Emphasis
                                                        text={emphasizeTitle(
                                                            project.title,
                                                        )}
                                                    />
                                                </span>
                                            </h3>
                                            <p className="mt-2 font-mono text-label text-muted uppercase">
                                                {[
                                                    project.year,
                                                    project.role,
                                                    project.category,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' — ')}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* The track the orb rolls along while the section is pinned. */}
                <div data-orb-lane aria-hidden="true" className="mt-8" />

                <div className="mt-6 flex justify-end">
                    <Link
                        href={projects.index()}
                        className="group font-mono text-label uppercase"
                    >
                        All projects{' '}
                        <span className="inline-block transition-transform group-hover:translate-x-1">
                            →
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
