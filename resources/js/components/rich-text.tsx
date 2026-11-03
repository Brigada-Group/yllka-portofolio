/**
 * Renders HTML written in Filament's rich editor. The content is admin-authored, so it is trusted.
 */
export default function RichText({ html }: { html: string | null }) {
    if (!html) {
        return null;
    }

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
