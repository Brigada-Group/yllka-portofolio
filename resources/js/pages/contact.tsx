import { Form, usePage } from '@inertiajs/react';
import Seo from '@/components/seo';
import { store } from '@/routes/contact';

export default function Contact() {
    const {
        props: { site },
        flash,
    } = usePage();

    return (
        <div className="space-y-8">
            <Seo
                title="Contact"
                description={`Get in touch with ${site.name}.`}
            />

            <header className="space-y-2">
                <h1>Contact</h1>
                <p>
                    Send me a message, or email me directly at{' '}
                    <a href={`mailto:${site.email}`}>{site.email}</a>.
                </p>
            </header>

            {flash.success && <p role="status">{flash.success}</p>}

            <Form
                {...store.form()}
                resetOnSuccess
                options={{ preserveScroll: true }}
                className="max-w-lg space-y-4"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                autoComplete="name"
                                className="border"
                            />
                            {errors.name && <p role="alert">{errors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="border"
                            />
                            {errors.email && <p role="alert">{errors.email}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows={6}
                                required
                                className="border"
                            />
                            {errors.message && (
                                <p role="alert">{errors.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="border px-4 py-2"
                        >
                            {processing ? 'Sending…' : 'Send message'}
                        </button>
                    </>
                )}
            </Form>
        </div>
    );
}
