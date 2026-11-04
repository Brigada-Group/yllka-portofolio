import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import CustomCursor from '@/components/custom-cursor';
import SiteFooter from '@/components/site-footer';
import SiteNav from '@/components/site-nav';
import { SmoothScroll } from '@/lib/smooth-scroll';
import { home } from '@/routes';

export default function PublicLayout({ children }: { children: ReactNode }) {
    const { site } = usePage().props;

    return (
        <SmoothScroll>
            <div aria-hidden className="grain" />
            <CustomCursor />
            {/* Content stacks above the fixed orb canvas (z-0). */}
            <div className="relative z-10 flex min-h-screen flex-col">
                <header>
                    <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-4 py-6 md:px-8">
                        <Link href={home()} className="whitespace-nowrap">
                            {site.name}
                        </Link>
                        <SiteNav />
                    </div>
                </header>

                <main className="flex-1">{children}</main>

                <SiteFooter />
            </div>
        </SmoothScroll>
    );
}
