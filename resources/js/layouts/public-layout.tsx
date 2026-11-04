import type { ReactNode } from 'react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { SmoothScroll } from '@/lib/smooth-scroll';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <SmoothScroll>
            <div aria-hidden className="grain" />
            {/* Content stacks above the fixed orb canvas (z-0). */}
            <div className="relative z-10 flex min-h-screen flex-col">
                <SiteHeader />
                {/* Room for the fixed header (h-20), so the page starts below it. */}
                <div aria-hidden="true" className="h-20 shrink-0" />

                <main className="flex-1">{children}</main>

                <SiteFooter />
            </div>
        </SmoothScroll>
    );
}
