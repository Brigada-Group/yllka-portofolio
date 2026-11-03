/** A section's mono label, e.g. "(01) — Selected Work". */
export default function SectionLabel({
    index,
    children,
}: {
    index: number;
    children: string;
}) {
    return (
        <p className="font-mono text-label text-muted uppercase">
            ({String(index).padStart(2, '0')}) — {children}
        </p>
    );
}
