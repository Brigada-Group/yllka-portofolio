import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { navJumpState } from '@/components/site-nav';
import { SmoothScroll } from '@/lib/smooth-scroll';

/**
 * After a client-side page change, move focus to the new page's h1 (or
 * main) as a full page load would reset it, and announce the new title.
 * Visits that stay on the same page (a form submit) leave focus alone.
 */
function usePageChangeFocus(): string {
    const [announcement, setAnnouncement] = useState('');
    const lastPath = useRef<string | null>(null);

    useEffect(
        () =>
            router.on('navigate', (event) => {
                const path = new URL(
                    event.detail.page.url,
                    window.location.origin,
                ).pathname;
                const first = lastPath.current === null;
                const changed = path !== lastPath.current;
                lastPath.current = path;

                if (first || !changed) {
                    return;
                }

                // After React has rendered the page and <Head> has set its title.
                window.setTimeout(() => {
                    const main = document.getElementById('main');
                    const heading = main?.querySelector<HTMLElement>('h1');
                    const target = heading ?? main;

                    // A nav link jumping to a section moves focus there itself.
                    if (target && !navJumpState.pending) {
                        target.tabIndex = -1;
                        target.focus({ preventScroll: true });
                    }

                    setAnnouncement(document.title);
                }, 100);
            }),
        [],
    );

    return announcement;
}

export default function PublicLayout({ children }: { children: ReactNode }) {
    const announcement = usePageChangeFocus();

    return (
        <SmoothScroll>
            <a
                href="#main"
                className="fixed top-3 left-3 z-50 -translate-y-24 rounded-full bg-foreground px-4 py-2 font-mono text-[12px] tracking-[0.06em] text-background uppercase focus:translate-y-0"
            >
                Skip to content
            </a>
            <div aria-hidden className="grain" />
            {/* Content stacks above the fixed orb canvas (z-0). */}
            <div className="relative z-10 flex min-h-screen flex-col">
                <SiteHeader />
                {/* Room for the fixed header (h-20), so the page starts below it. */}
                <div aria-hidden="true" className="h-20 shrink-0" />

                <main id="main" tabIndex={-1} className="flex-1 outline-none">
                    {children}
                </main>

                <SiteFooter />
            </div>

            {/* Announces the new page after client-side navigation. */}
            <p aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </p>
        </SmoothScroll>
    );
}
