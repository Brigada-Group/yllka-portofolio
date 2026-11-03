import { useEffect, useState } from 'react';

function format(timezone: string): string {
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
    };

    try {
        return new Intl.DateTimeFormat('en-GB', {
            ...options,
            timeZone: timezone,
        }).format(new Date());
    } catch {
        // Unknown timezone: fall back to the visitor's.
        return new Intl.DateTimeFormat('en-GB', options).format(new Date());
    }
}

/**
 * The current time in `timezone`, ticking every second. Rendered only after
 * mount, so the server and client HTML always match.
 */
export default function LiveTime({ timezone }: { timezone: string }) {
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        const tick = () => setTime(format(timezone));
        tick();
        const id = setInterval(tick, 1000);

        return () => clearInterval(id);
    }, [timezone]);

    return <time suppressHydrationWarning>{time ?? '--:--:--'}</time>;
}
