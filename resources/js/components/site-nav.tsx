import { router, usePage } from '@inertiajs/react';
import type { MouseEvent } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { useLenis } from '@/lib/smooth-scroll';
import { home } from '@/routes';

/** Nav items scroll to sections of the home page (`null`: the top). */
const ITEMS: { label: string; section: string | null }[] = [
    { label: 'Home', section: null },
    { label: 'Projects', section: 'work' },
    { label: 'About', section: 'about' },
    { label: 'Contact', section: 'contact' },
];

/** Smooth, with an ease that starts and ends gently. */
const SCROLL_DURATION = 1.6;
const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/**
 * The site nav. On the home page, links scroll smoothly to their section
 * (with Lenis, so the orb travels along); elsewhere, they go to the home
 * page first and then scroll there. Links keep real addresses (/#about), so
 * opening them in a new tab works.
 */
export default function SiteNav() {
    const { component } = usePage();
    const lenis = useLenis();

    const scrollTo = (section: string | null) => {
        const target = section ? document.getElementById(section) : null;

        if (section && !target) {
            return;
        }

        if (lenis) {
            // Lenis re-measures the page only after a debounce, so after a visit
            // its scroll limit can still be the previous page's. Measure now.
            lenis.resize();
            lenis.scrollTo(target ?? 0, {
                duration: SCROLL_DURATION,
                easing: easeInOutCubic,
            });
        } else {
            // No smooth scrolling (reduced motion): go straight there.
            window.scrollTo({
                top: target
                    ? target.getBoundingClientRect().top + window.scrollY
                    : 0,
            });
        }

        window.history.replaceState(
            window.history.state,
            '',
            section ? `#${section}` : home().url,
        );
    };

    const onClick = (event: MouseEvent, section: string | null) => {
        // Let modified clicks (new tab, new window) through.
        if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
        ) {
            return;
        }

        event.preventDefault();

        if (component === 'home') {
            scrollTo(section);

            return;
        }

        // From another page: go home, then scroll once the page has laid out.
        // Wait for the visit's `navigate` event (the smooth-scroll provider
        // re-syncs Lenis there, which would cancel an earlier scroll), then for
        // ScrollTrigger's refresh that lays out the pinned sections, or a short
        // wait if that has already happened.
        if (section) {
            const off = router.on('navigate', () => {
                off();
                let done = false;
                const go = () => {
                    if (!done) {
                        done = true;
                        ScrollTrigger.removeEventListener('refresh', go);
                        requestAnimationFrame(() => scrollTo(section));
                    }
                };

                ScrollTrigger.addEventListener('refresh', go);
                setTimeout(go, 300);
            });
        }

        router.visit(home().url);
    };

    return (
        <nav aria-label="Main">
            <ul className="flex gap-3 text-sm md:gap-4 md:text-base">
                {ITEMS.map((item) => (
                    <li key={item.label}>
                        {/*
                          A plain link, not Inertia's <Link>: that would start its own
                          visit and jump to the anchor alongside this smooth scroll.
                        */}
                        <a
                            href={
                                item.section
                                    ? `${home().url}#${item.section}`
                                    : home().url
                            }
                            onClick={(event) => onClick(event, item.section)}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
