import { usePage } from '@inertiajs/react';
import Container from '@/components/container';
import Seo from '@/components/seo';

/** The accessibility statement: the standard, how it was tested, the controls, and who to tell. */
export default function Accessibility() {
    const { site } = usePage().props;

    return (
        <Container className="py-8">
            <article className="max-w-2xl space-y-10">
                <Seo
                    title="Accessibility"
                    description={`How ${site.name}'s portfolio is built to be accessible, and how to report a problem.`}
                />

                <header className="space-y-4">
                    <h1>Accessibility</h1>
                    <p>
                        This site aims to meet the{' '}
                        <a
                            href="https://www.w3.org/TR/WCAG22/"
                            className="underline underline-offset-[0.2em]"
                        >
                            Web Content Accessibility Guidelines (WCAG) 2.2
                        </a>{' '}
                        at level AA, in both the dark and the light theme.
                    </p>
                </header>

                <section aria-labelledby="tested" className="space-y-4">
                    <h2 id="tested">How it was tested</h2>
                    <ul className="list-disc space-y-2 pl-5">
                        <li>
                            Automated checks with axe on every page, in both
                            themes, with no violations allowed.
                        </li>
                        <li>Lighthouse accessibility audits on every page.</li>
                        <li>
                            Keyboard only: every link, button and form field can
                            be reached and used with the keyboard, with a
                            visible focus outline, and a “Skip to content” link
                            comes first.
                        </li>
                        <li>
                            VoiceOver on macOS: headings, landmarks, links and
                            the contact form read clearly, and page changes are
                            announced.
                        </li>
                        <li>
                            Small screens down to 320px wide and 200% zoom, with
                            no sideways scrolling.
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="controls" className="space-y-4">
                    <h2 id="controls">Controls you have</h2>
                    <ul className="list-disc space-y-2 pl-5">
                        <li>
                            <strong className="font-medium">
                                Reduce motion
                            </strong>{' '}
                            (in the footer) turns off the animations: the
                            orb&rsquo;s drop and travel, scroll effects, the
                            moving skill rows and the theme transition. It is
                            also on automatically when your system asks for
                            reduced motion.
                        </li>
                        <li>
                            <strong className="font-medium">
                                Light and dark theme
                            </strong>{' '}
                            (in the main navigation). Dark is the default; your
                            choice is remembered.
                        </li>
                        <li>
                            The moving skill rows can be paused with their own
                            button, and pause while you hover over them.
                        </li>
                        <li>
                            The orb is decorative. You can drag it with a mouse
                            for fun, but nothing on the site depends on it.
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="report" className="space-y-4">
                    <h2 id="report">Report a problem</h2>
                    <p>
                        If something is hard to use or doesn&rsquo;t work with
                        your assistive technology, please email{' '}
                        <a
                            href={`mailto:${site.email}`}
                            className="underline underline-offset-[0.2em]"
                        >
                            {site.email}
                        </a>
                        . I&rsquo;ll get back to you and fix it.
                    </p>
                </section>
            </article>
        </Container>
    );
}
