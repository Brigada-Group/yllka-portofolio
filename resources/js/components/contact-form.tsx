import { Form, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { store } from '@/routes/contact';

const inputClass =
    'w-full border-b border-foreground/20 bg-transparent py-3 text-body text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent';

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="font-mono text-label text-muted uppercase">
                {label}
            </span>
            {children}
            {error && (
                <span
                    role="alert"
                    className="mt-2 block text-label text-accent"
                >
                    {error}
                </span>
            )}
        </label>
    );
}

export default function ContactForm({
    className = '',
}: {
    className?: string;
}) {
    const { flash } = usePage();

    return (
        <div className={className}>
            {flash.success && (
                <p role="status" className="mb-8 text-body text-accent">
                    {flash.success}
                </p>
            )}

            <Form
                {...store.form()}
                resetOnSuccess
                options={{ preserveScroll: true }}
                className="space-y-8"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-8 md:grid-cols-2">
                            <Field label="Name" error={errors.name}>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    autoComplete="name"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Email" error={errors.email}>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <Field label="Message" error={errors.message}>
                            <textarea
                                name="message"
                                rows={4}
                                required
                                className={`${inputClass} resize-none`}
                            />
                        </Field>
                        <button
                            type="submit"
                            disabled={processing}
                            className="group inline-flex items-center gap-3 rounded-full border border-foreground/30 px-6 py-3 font-mono text-label uppercase transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
                        >
                            {processing ? 'Sending…' : 'Send message'}
                            <span className="transition-transform group-hover:translate-x-1">
                                →
                            </span>
                        </button>
                    </>
                )}
            </Form>
        </div>
    );
}
