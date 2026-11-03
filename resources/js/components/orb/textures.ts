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
 * The bloom's soft halo: a blurred disc, solid to about 80% of its radius
 * and fading to nothing at the edge. Tinted by the material colour.
 */
export function createHaloTexture(): CanvasTexture {
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
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
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
