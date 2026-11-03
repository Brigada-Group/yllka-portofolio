import { usePage } from '@inertiajs/react';
import ContactForm from '@/components/contact-form';
import SectionLabel from '@/components/section-label';

/**
 * (05) Contact: a giant "Let's talk." whose full stop is the orb. It lands in
 * the free space right of the heading and rolls back onto the full stop.
 */
export default function ContactSection() {
    const { site } = usePage().props;

    return (
        <section
            id="contact"
            aria-labelledby="contact-title"
            className="pt-28 pb-24 md:pt-44 md:pb-32"
        >
            <div className="mx-auto max-w-[1600px] px-4 md:px-8">
                <SectionLabel index={5}>Contact</SectionLabel>

                {/*
                  The orb stop: the heading itself. The orb is settled as the full stop
                  by the time the heading's centre reaches the middle of the viewport,
                  then stays.
                */}
                <h2
                    id="contact-title"
                    data-orb-stop="contact"
                    data-orb-trigger="self"
                    data-orb-arrive="center 50%"
                    className="mt-6 text-giant"
                >
                    <span className="sr-only">Let&rsquo;s talk.</span>
                    <span aria-hidden="true">
                        Let&rsquo;s{' '}
                        <span className="font-display italic">talk</span>
                        {/* The full stop: an empty, period-sized box the orb rests in. */}
                        <span
                            data-orb-slot
                            className="ml-[0.04em] inline-block size-[0.15em]"
                        />
                    </span>
                </h2>

                <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-12 md:mt-24">
                    <div className="col-span-12 md:col-span-6 md:col-start-3">
                        <ContactForm />
                    </div>
                    <div className="col-span-12 md:col-span-3 md:col-start-10">
                        <p className="font-mono text-label text-muted uppercase">
                            Or email
                        </p>
                        <a
                            href={`mailto:${site.email}`}
                            className="mt-3 inline-block text-[clamp(1.125rem,0.8rem+0.9vw,1.75rem)] break-all underline decoration-foreground/30 underline-offset-[0.2em] transition-colors hover:decoration-accent"
                        >
                            {site.email}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
