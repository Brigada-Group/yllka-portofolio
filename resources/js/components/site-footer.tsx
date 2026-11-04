import { Link, usePage } from '@inertiajs/react';
import LiveTime from '@/components/live-time';
import SocialLinks from '@/components/social-links';
import {
    setSiteReducesMotion,
    useSiteReducesMotion,
    useSystemReducesMotion,
} from '@/lib/motion';
import { useLenis } from '@/lib/smooth-scroll';
import { accessibility } from '@/routes';

/** Small mono links and buttons: at least 24px tall, to meet WCAG 2.5.8. */
const TARGET =
    'inline-flex min-h-6 items-center uppercase transition-colors hover:text-foreground';

/**
 * The site's "Reduce motion" switch. Turns off the orb's travel, scroll
 * effects, the skill rows and the theme transition. Already on (and fixed)
 * when the system asks for reduced motion.
 */
function ReduceMotionToggle() {
    const site = useSiteReducesMotion();
    const system = useSystemReducesMotion();
    const on = site || system;

    return (
        <>
            <button
                type="button"
                aria-pressed={on}
                aria-disabled={system || undefined}
                aria-describedby={system ? 'reduce-motion-note' : undefined}
                onClick={() => !system && setSiteReducesMotion(!site)}
                className={`${TARGET} gap-2`}
            >
                <span
                    aria-hidden="true"
                    className={`size-2 rounded-full border border-current ${on ? 'bg-current' : ''}`}
                />
                Reduce motion
                <span aria-hidden="true" className="text-faint">
                    {on ? 'On' : 'Off'}
                </span>
            </button>
            {system && (
                <span id="reduce-motion-note" className="sr-only">
                    Your system settings already reduce motion.
                </span>
            )}
        </>
    );
}

export default function SiteFooter() {
    const { site } = usePage().props;
    const lenis = useLenis();

    const toTop = () => {
        if (lenis) {
            lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0 });
        }

        // Keyboard users land back at the start of the page, not in the footer.
        document.getElementById('main')?.focus({ preventScroll: true });
    };

    return (
        <footer className="border-t border-foreground/10">
            <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-x-6 gap-y-6 px-4 py-10 font-mono text-label text-muted uppercase md:px-8">
                <p className="col-span-12 md:col-span-3">
                    © {new Date().getFullYear()} {site.name}
                </p>
                <SocialLinks
                    className="col-span-12 flex flex-wrap gap-x-6 gap-y-2 md:col-span-4 md:col-start-4"
                    linkClassName={TARGET}
                />
                <p className="col-span-8 md:col-span-3">
                    {site.location && <span>{site.location} — </span>}
                    <LiveTime timezone={site.timezone} />
                </p>
                <button
                    type="button"
                    onClick={toTop}
                    className={`${TARGET} col-span-4 gap-[0.5ch] justify-self-end md:col-span-2`}
                >
                    Back to top <span aria-hidden="true">↑</span>
                </button>

                <div className="col-span-12 flex flex-wrap gap-x-6 gap-y-2 md:col-start-4">
                    <Link href={accessibility()} className={TARGET}>
                        Accessibility
                    </Link>
                    <ReduceMotionToggle />
                </div>
            </div>
        </footer>
    );
}
