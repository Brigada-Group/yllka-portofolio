import { Form, usePage } from '@inertiajs/react';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { store } from '@/routes/contact';

const inputClass =
    'w-full border-b border-field bg-transparent py-3 text-body text-foreground transition-colors placeholder:text-faint focus:border-accent aria-invalid:border-accent';

/**
 * A labelled field. The label points at the input, and an error (if any) is
 * linked to it with aria-describedby and marks it aria-invalid.
 */
function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactElement<{
        id?: string;
        'aria-describedby'?: string;
        'aria-invalid'?: boolean;
    }>;
}) {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div>
            <label
                htmlFor={id}
                className="font-mono text-label text-muted uppercase"
            >
                {label}
            </label>
            {cloneElement(children, {
                id,
                'aria-describedby': error ? errorId : undefined,
                'aria-invalid': error ? true : undefined,
            })}
            {error && (
                <p id={errorId} className="mt-2 text-label text-accent">
                    {error}
                </p>
            )}
        </div>
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
            <Form
                {...store.form()}
                resetOnSuccess
                options={{ preserveScroll: true }}
                className="space-y-8"
            >
                {({ errors, processing }) => {
                    const errorCount = Object.keys(errors).length;

                    return (
                        <>
                            {/*
                              One polite live region for the outcome: the success
                              message, or how many fields need fixing.
                            */}
                            <div aria-live="polite" aria-atomic="true">
                                {flash.success && errorCount === 0 && (
                                    <p className="text-body text-accent">
                                        {flash.success}
                                    </p>
                                )}
                                {errorCount > 0 && (
                                    <p className="text-body text-accent">
                                        Please fix {errorCount}{' '}
                                        {errorCount === 1 ? 'field' : 'fields'}{' '}
                                        below.
                                    </p>
                                )}
                            </div>

                            <p className="font-mono text-label text-muted uppercase">
                                All fields are required.
                            </p>

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
                                className="group inline-flex items-center gap-3 rounded-full border border-field px-6 py-3 font-mono text-label uppercase transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
                            >
                                {processing ? 'Sending…' : 'Send message'}
                                <span
                                    aria-hidden="true"
                                    className="transition-transform motion-safe:group-hover:translate-x-1"
                                >
                                    →
                                </span>
                            </button>
                        </>
                    );
                }}
            </Form>
        </div>
    );
}
