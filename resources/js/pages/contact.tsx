import { usePage } from '@inertiajs/react';
import ContactForm from '@/components/contact-form';
import Container from '@/components/container';
import Seo from '@/components/seo';

export default function Contact() {
    const { site } = usePage().props;

    return (
        <Container className="py-8">
            <div className="space-y-8">
                <Seo
                    title="Contact"
                    description={`Get in touch with ${site.name}.`}
                />

                <header className="space-y-2">
                    <h1>Contact</h1>
                    <p>
                        Send me a message, or email me directly at{' '}
                        <a href={`mailto:${site.email}`}>{site.email}</a>
                        {site.phone && (
                            <>
                                {' '}
                                or call{' '}
                                <a
                                    href={`tel:${site.phone.replace(/\s+/g, '')}`}
                                >
                                    {site.phone}
                                </a>
                            </>
                        )}
                        .
                    </p>
                </header>

                <ContactForm className="max-w-lg" />
            </div>
        </Container>
    );
}
