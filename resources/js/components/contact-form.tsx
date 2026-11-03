import { Form, usePage } from '@inertiajs/react';
import { store } from '@/routes/contact';

export default function ContactForm({
    className = '',
}: {
    className?: string;
}) {
    const { flash } = usePage();

    return (
        <div className={className}>
            {flash.success && <p role="status">{flash.success}</p>}

            <Form
                {...store.form()}
                resetOnSuccess
                options={{ preserveScroll: true }}
                className="space-y-4"
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
