import { usePage } from '@inertiajs/react';
import LiveTime from '@/components/live-time';
import SocialLinks from '@/components/social-links';
import { useLenis } from '@/lib/smooth-scroll';

export default function SiteFooter() {
    const { site } = usePage().props;
    const lenis = useLenis();

    const toTop = () => {
        if (lenis) {
            lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0 });
        }
    };

    return (
        <footer className="border-t border-foreground/10">
            <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-x-6 gap-y-6 px-4 py-10 font-mono text-label text-muted uppercase md:px-8">
                <p className="col-span-12 md:col-span-3">
                    © {new Date().getFullYear()} {site.name}
                </p>
                <SocialLinks className="col-span-12 flex flex-wrap gap-x-6 gap-y-2 md:col-span-4 md:col-start-4" />
                <p className="col-span-8 md:col-span-3">
                    {site.location && <span>{site.location} — </span>}
                    <LiveTime timezone={site.timezone} />
                </p>
                <button
                    type="button"
                    onClick={toTop}
                    className="col-span-4 text-right uppercase transition-colors hover:text-foreground md:col-span-2"
                >
                    Back to top ↑
                </button>
            </div>
        </footer>
    );
}
