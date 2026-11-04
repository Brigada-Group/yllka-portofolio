import { usePage } from '@inertiajs/react';
import { useRef } from 'react';
import Emphasis from '@/components/emphasis';
import HeroName from '@/components/hero-name';
import HeroOrb from '@/components/hero-orb';
import LatestWork from '@/components/latest-work';
import LiveTime from '@/components/live-time';
import { useReducedMotion } from '@/lib/motion';
import type { ProjectSummary } from '@/types';

/** "(Scroll)" over a hairline with a light running down it. */
function ScrollCue() {
    return (
        <div
            aria-hidden="true"
            className="flex flex-col items-center gap-3 font-mono text-label text-muted uppercase"
        >
            <span>(Scroll)</span>
            <span className="scroll-cue relative block h-14 w-px overflow-hidden bg-foreground/15" />
        </div>
    );
}

export default function Hero({ latest }: { latest: ProjectSummary | null }) {
    const { site } = usePage().props;
    const section = useRef<HTMLElement>(null);
    const name = useRef<HTMLSpanElement>(null);
    const reducedMotion = useReducedMotion();

    return (
        <section
            ref={section}
            id="hero"
            aria-labelledby="hero-title"
            className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-[1600px] flex-col overflow-x-clip px-4 pb-6 md:px-8"
        >
            <HeroOrb hero={section} name={name} reducedMotion={reducedMotion} />

            <div className="relative flex justify-between gap-6 pt-6 font-mono text-label text-muted uppercase">
                <p>({site.role})</p>
                {site.education && (
                    <p className="max-w-[50%] text-right">{site.education}</p>
                )}
            </div>

            {/*
              The orb stop: it rests as the dot of the last "i" until the page
              scrolls at all (depart 0), then rolls off the side of the letter
              and falls to the Selected Work heading.
            */}
            <div
                data-orb-stop="hero"
                data-orb-side="left"
                data-orb-depart="0"
                className="relative mt-auto pt-16"
            >
                {/*
                  The h1 reads as the plain name: the visible letters are split
                  into spans (for the weight effect) and end in a dotless ı,
                  so they are hidden from assistive tech.
                */}
                <h1 id="hero-title">
                    <span className="sr-only">{site.name}</span>
                    <span aria-hidden="true">
                        <HeroName
                            name={site.name}
                            nameRef={name}
                            weightEffect={!reducedMotion}
                        />
                    </span>
                </h1>
                <p className="mt-4 max-w-[19em] text-lede md:mt-6">
                    <Emphasis text={site.headline} />
                </p>
            </div>

            <div className="relative mt-12 flex items-end justify-between gap-6 md:mt-[6vh]">
                <p className="font-mono text-label text-muted uppercase">
                    {/* Just the city here ("Pristina, Kosovo" → "Pristina"). */}
                    {site.location && (
                        <span>{site.location.split(',')[0]} — </span>
                    )}
                    <LiveTime timezone={site.timezone} />
                </p>

                <div className="flex items-end gap-10">
                    {latest && (
                        <LatestWork
                            project={latest}
                            className="hidden md:flex"
                        />
                    )}
                    <ScrollCue />
                </div>
            </div>
        </section>
    );
}
