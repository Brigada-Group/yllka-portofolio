import { advance, Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsap';
import type { OrbMotion } from './motion';
import Orb from './orb';
import OrbDebug from './orb-debug';
import OrbRipple from './orb-ripple';
import type { OrbPathStore } from './types';

type OrbCanvasProps = {
    path: OrbPathStore;
    motion: OrbMotion;
    /** Called once the WebGL context exists and the first frame can render. */
    onReady: () => void;
    mobile: boolean;
    debug: boolean;
};

function usePageVisible(): boolean {
    const [visible, setVisible] = useState(
        () => document.visibilityState === 'visible',
    );

    useEffect(() => {
        const onChange = () =>
            setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', onChange);

        return () => document.removeEventListener('visibilitychange', onChange);
    }, []);

    return visible;
}

/**
 * The fixed, full-screen canvas behind the page. Loaded lazily by OrbStage,
 * so three.js stays out of the main bundle. R3F disposes the renderer,
 * geometries and materials when this unmounts.
 *
 * It is portalled to <body> so it sits below the layout's content layer
 * (z-10) instead of inside it.
 */
export default function OrbCanvas({
    path,
    motion,
    onReady,
    mobile,
    debug,
}: OrbCanvasProps) {
    const visible = usePageVisible();

    // Render from GSAP's ticker, right after Lenis has scrolled and
    // ScrollTrigger has updated the pins, so the orb and the page move in the
    // same frame. Paused while the tab is hidden.
    useEffect(() => {
        if (!visible) {
            return;
        }

        const render = () => advance(performance.now());
        gsap.ticker.add(render);

        return () => gsap.ticker.remove(render);
    }, [visible]);

    return createPortal(
        <Canvas
            aria-hidden
            // Inline, because R3F sets pointer-events: auto on its wrapper.
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
            }}
            dpr={[1, mobile ? 1.5 : 2]}
            frameloop="never"
            gl={{
                antialias: !mobile,
                alpha: true,
                powerPreference: 'high-performance',
            }}
            camera={{ fov: 25, position: [0, 0, 20], near: 0.1, far: 100 }}
            onCreated={onReady}
        >
            <hemisphereLight args={['#ffffff', '#a1a1aa', 1.2]} />
            <directionalLight position={[-4, 6, 8]} intensity={2.2} />
            <directionalLight position={[5, -2, -4]} intensity={0.6} />

            <Orb
                path={path}
                motion={motion}
                quality={mobile ? 'low' : 'high'}
            />
            <OrbRipple path={path} motion={motion} />
            {debug && <OrbDebug path={path} />}
        </Canvas>,
        document.body,
    );
}
