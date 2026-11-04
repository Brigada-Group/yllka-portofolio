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

/**
 * The site nav. On the home page, links jump straight to their section;
 * elsewhere, they go to the home page first and then jump there. Links keep real addresses (/#about), so
 * opening them in a new tab works.
 */
export default function SiteNav() {
    const { component } = usePage();
    const lenis = useLenis();

    const jumpTo = (section: string | null) => {
        const target = section ? document.getElementById(section) : null;

        if (section && !target) {
            return;
        }

        const top = target
            ? target.getBoundingClientRect().top + window.scrollY
            : 0;

        if (lenis) {
            // Lenis re-measures the page only after a debounce, so after a visit
            // its scroll limit can still be the previous page's. Measure now.
            lenis.resize();
            lenis.scrollTo(top, { immediate: true, force: true });
        } else {
            window.scrollTo({ top });
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
            jumpTo(section);

            return;
        }

        // From another page: go home, then jump once the page has laid out.
        // Wait for the visit's `navigate` event (the smooth-scroll provider
        // re-syncs Lenis there, which would undo an earlier jump), then for
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
                        requestAnimationFrame(() => jumpTo(section));
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
                          A plain link, not Inertia's <Link>: that would start its own visit
                          and jump to the anchor before the pinned sections are laid out.
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
