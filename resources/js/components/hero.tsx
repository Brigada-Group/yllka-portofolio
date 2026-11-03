import { usePage } from '@inertiajs/react';
import Emphasis, { plainText } from '@/components/emphasis';
import LiveTime from '@/components/live-time';

/**
 * The name with its last "i" set dotless (ı): the orb drops onto the spot
 * where the dot would be and becomes it (see `data-orb-dot` in the orb path,
 * which measures the dot from the font).
 */
function NameWithDot({ name }: { name: string }) {
    const index = name.lastIndexOf('i');

    if (index < 0) {
        return <>{name}</>;
    }

    return (
        <>
            {name.slice(0, index)}
            <span data-orb-dot>ı</span>
            {name.slice(index + 1)}
        </>
    );
}

export default function Hero() {
    const { site } = usePage().props;

    return (
        <section
            id="hero"
            aria-labelledby="hero-title"
            className="relative flex min-h-[calc(100svh-5rem)] flex-col px-4 pb-6 md:px-8"
        >
            <div className="flex justify-between gap-6 pt-6 font-mono text-label text-muted uppercase">
                <span>({site.role})</span>
                {site.education && (
                    <span className="max-w-[50%] text-right">
                        {site.education}
                    </span>
                )}
            </div>

            {/*
              The orb stop: it rests as the dot of the last "i", lifts off to
              the right along the line, then heads down past this block.
            */}
            <div
                data-orb-stop="hero"
                data-orb-side="left"
                data-orb-exit="right"
                className="mt-auto pt-16"
            >
                <h1 id="hero-title">
                    <span className="sr-only">
                        {site.name}. {plainText(site.headline)}
                    </span>
                    <span aria-hidden="true">
                        <span className="block text-hero font-normal">
                            <NameWithDot name={site.name} />
                        </span>
                        <span className="mt-4 block max-w-[19em] text-lede md:mt-6">
                            <Emphasis text={site.headline} />
                        </span>
                    </span>
                </h1>

                <p className="mt-12 font-mono text-label text-muted uppercase md:mt-16">
                    {site.location && <span>{site.location} — </span>}
                    <LiveTime timezone={site.timezone} />
                </p>
            </div>
        </section>
    );
}
