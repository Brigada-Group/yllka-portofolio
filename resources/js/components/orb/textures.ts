import { CanvasTexture, SRGBColorSpace } from 'three';

function canvasTexture(
    width: number,
    height: number,
    draw: (context: CanvasRenderingContext2D) => void,
): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d')!);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;

    return texture;
}

/**
 * What the glass refracts. The page is HTML, outside the 3D scene, so the
 * glass bends this instead: a faint design grid with soft shading, seen only
 * through the orb. Mapped to the screen, so it reads as a backdrop behind the page.
 */
export function createRefractionTexture(): CanvasTexture {
    const size = 1024;

    return canvasTexture(size, size, (context) => {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size, size);

        for (const [x, y, radius, alpha] of [
            [0.25, 0.3, 0.45, 0.18],
            [0.75, 0.7, 0.5, 0.14],
        ]) {
            const gradient = context.createRadialGradient(
                x * size,
                y * size,
                0,
                x * size,
                y * size,
                radius * size,
            );
            gradient.addColorStop(0, `rgba(24, 24, 27, ${alpha})`);
            gradient.addColorStop(1, 'rgba(24, 24, 27, 0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, size, size);
        }

        for (let i = 0; i <= size; i += 32) {
            const major = i % 128 === 0;
            context.fillStyle = major
                ? 'rgba(24, 24, 27, 0.35)'
                : 'rgba(24, 24, 27, 0.14)';
            context.fillRect(i, 0, major ? 2 : 1, size);
            context.fillRect(0, i, size, major ? 2 : 1);
        }
    });
}

/**
 * Faint lines etched into the glass: an equator and one great circle.
 * A clear sphere looks the same at any rotation, so these show it rolling.
 */
export function createEtchTexture(): CanvasTexture {
    return canvasTexture(1024, 512, (context) => {
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.fillRect(0, 254, 1024, 4);
        context.fillRect(0, 0, 4, 512);
        context.fillRect(510, 0, 4, 512);
    });
}

/** A soft, round shadow: opaque in the middle, fading to nothing at the edge. */
export function createShadowTexture(): CanvasTexture {
    const size = 128;

    return canvasTexture(size, size, (context) => {
        const gradient = context.createRadialGradient(
            size / 2,
            size / 2,
            0,
            size / 2,
            size / 2,
            size / 2,
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
    });
}
