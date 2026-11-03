import { Component } from 'react';
import type { ReactNode } from 'react';

/**
 * The orb is decoration. If WebGL is unavailable or the scene throws,
 * drop the orb and keep the page alive.
 */
export default class OrbErrorBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: unknown) {
        console.warn('Orb disabled:', error);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}
