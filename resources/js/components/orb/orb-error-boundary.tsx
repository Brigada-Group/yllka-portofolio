import { Component } from 'react';
import type { ReactNode } from 'react';
import { clearIntroClasses } from './intro';

/**
 * The orb is decoration. If WebGL is unavailable or the scene throws,
 * drop the orb, make sure the hero text is visible, and keep the page alive.
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
        clearIntroClasses();
        console.warn('Orb disabled:', error);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}
