import { Link } from '@inertiajs/react';
import Emphasis, { emphasizeTitle, plainText } from '@/components/emphasis';
import ProjectCover from '@/components/project-cover';
import RevealText from '@/components/reveal-text';
import SectionLabel from '@/components/section-label';
import projects from '@/routes/projects';
import type { ProjectSummary } from '@/types';

/** A staggered, editorial rhythm: frame shapes and vertical offsets cycle per card. */
const FRAMES = ['aspect-[4/5]', 'aspect-[16/10]', 'aspect-square'];
const OFFSETS = ['md:mt-0', 'md:mt-[6vw]', 'md:mt-[2.5vw]'];

/**
 * (01) Selected Work. On desktop the orb path pins this section, slides the
 * row, and rolls the orb along the track under it; the cards nearest the orb
 * come into focus. On small screens the row scrolls sideways and the orb
 * rolls along with it.
 */
export default function WorkGallery({ items }: { items: ProjectSummary[] }) {
    return (
        <section
            id="work"
            aria-labelledby="work-title"
            className="pt-24 pb-10 md:pt-16 md:pb-8"
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
                            <RevealText
                                as="h2"
                                className="mt-3 text-[clamp(2.25rem,1.4rem+2.6vw,4.5rem)] leading-[0.95] tracking-[-0.03em]"
                            >
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

                <div
                    data-orb-viewport
                    className="mt-8 snap-x overflow-x-auto md:mt-10"
                >
                    <ul
                        data-orb-row
                        className="flex w-max items-start gap-[6vw] md:gap-[4vw]"
                    >
                        {items.map((project, index) => (
                            <li
                                key={project.id}
                                className={`snap-start ${OFFSETS[index % OFFSETS.length]}`}
                            >
                                <Link
                                    href={projects.show(project.slug)}
                                    data-orb-item
                                    data-cursor="View case"
                                    className="group block w-[75vw] md:w-[32vw]"
                                >
                                    <div
                                        className={`overflow-hidden rounded-[7px] border border-white/[0.08] md:max-h-[48svh] ${FRAMES[index % FRAMES.length]}`}
                                    >
                                        <ProjectCover
                                            slug={project.slug}
                                            title={project.title}
                                            src={project.cover_image_url}
                                            className="transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]"
                                        />
                                    </div>

                                    <div data-focus-text className="mt-4">
                                        <span className="block font-display text-[3rem] leading-none text-muted italic">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="mt-2 text-[clamp(1.5rem,1.2rem+0.6vw,2rem)] leading-[1.05] tracking-[-0.02em]">
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
                                </Link>
                            </li>
                        ))}

                        {/* The end of the row. */}
                        <li className="flex w-[50vw] snap-start items-center self-stretch md:w-[22vw]">
                            <Link
                                href={projects.index()}
                                className="group text-[clamp(2rem,1.2rem+2.4vw,4rem)] leading-[0.95] tracking-[-0.03em]"
                            >
                                All <Emphasis text="*projects*" />{' '}
                                <span className="inline-block transition-transform group-hover:translate-x-2">
                                    →
                                </span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* The track the orb rolls along. It stops short of the edge, so the orb can roll off its end. */}
                <div
                    data-orb-lane
                    aria-hidden="true"
                    className="mt-6 mr-14 md:mt-8 md:mr-24"
                />
            </div>
        </section>
    );
}
