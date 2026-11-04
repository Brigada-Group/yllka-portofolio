import { ShaderMaterial, Vector3 } from 'three';

/**
 * "Breathing bloom" (Harold symbol exploration, no. 16): a periwinkle orb
 * with blurred indigo, lavender and pink-violet blobs, an aqua bloom that
 * breathes from the centre outward, and grain on top.
 *
 * Unlit, and composited in sRGB like the SVG it comes from, so the colours
 * match the exploration file exactly. Blobs live on the sphere's surface, so
 * they roll with it. The aqua bloom is fixed to the centre of the disc.
 */
const PALETTE = {
    indigo: '#3B2FB8',
    peri: '#7C7CF0',
    lavender: '#C6BCF6',
    pinkViolet: '#D59AEB',
    aqua: '#9FE3EC',
};

/** sRGB components, without three's colour management (the shader outputs them as-is). */
const srgb = (hex: string) =>
    new Vector3(
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
    );

/**
 * A point on the front of the sphere where an SVG circle centred at (x, y)
 * appears, in the symbol's 64 × 64 box with the orb at (32, 32), radius 25.
 */
const front = (x: number, y: number) => {
    const u = (x - 32) / 25;
    const v = -(y - 32) / 25;

    return new Vector3(
        u,
        v,
        Math.sqrt(Math.max(0, 1 - u * u - v * v)),
    ).normalize();
};

/**
 * Blobs, painted in this order. The first three are the symbol's; the
 * second three cover the back, so the orb never rolls to a blank side.
 * Radii are in orb radii (SVG radius / 25).
 */
const BLOBS: { at: Vector3; color: string; radius: number }[] = [
    { at: front(34, 10), color: PALETTE.indigo, radius: 17 / 25 },
    { at: front(12, 42), color: PALETTE.lavender, radius: 13 / 25 },
    { at: front(54, 44), color: PALETTE.pinkViolet, radius: 10 / 25 },
    {
        at: new Vector3(-0.3, -0.6, -0.74).normalize(),
        color: PALETTE.indigo,
        radius: 17 / 25,
    },
    {
        at: new Vector3(0.6, 0.5, -0.62).normalize(),
        color: PALETTE.lavender,
        radius: 13 / 25,
    },
    {
        at: new Vector3(-0.7, 0.4, -0.59).normalize(),
        color: PALETTE.pinkViolet,
        radius: 10 / 25,
    },
];

const vertexShader = /* glsl */ `
    varying vec3 vObject;
    varying vec3 vView;

    void main() {
        vObject = normalize(position);
        vView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    uniform vec3 uBase;
    uniform vec3 uAqua;
    uniform vec3 uBlobAt[${BLOBS.length}];
    uniform vec3 uBlobColor[${BLOBS.length}];
    uniform float uBlobRadius[${BLOBS.length}];
    uniform float uBloomRadius;
    uniform float uBloomOpacity;
    uniform float uCoreRadius;
    uniform float uGlow;
    uniform float uLight;

    varying vec3 vObject;
    varying vec3 vView;

    // The SVG blurs its blobs with stdDeviation 6 on a radius-25 orb.
    const float BLUR = 0.24;

    // A disc of radius r blurred by s: a Gaussian-blurred edge is symmetric
    // about r, and a small disc's centre is dimmer once blurred.
    float softDisc(float d, float r, float s) {
        float edge = 1.0 - smoothstep(r - s * 1.2, r + s * 1.2, d);
        float peak = 1.0 - exp(-(r * r) / (2.0 * s * s));
        return edge * peak;
    }

    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    void main() {
        vec3 color = uBase;

        for (int i = 0; i < ${BLOBS.length}; i++) {
            float d = distance(vObject, uBlobAt[i]);
            color = mix(color, uBlobColor[i], softDisc(d, uBlobRadius[i], BLUR));
        }

        // The breathing aqua bloom and its white core, fixed to the disc (y up).
        vec2 disc = vView.xy;
        color = mix(color, uAqua, softDisc(distance(disc, vec2(0.08, -0.16)), uBloomRadius, BLUR) * uBloomOpacity);
        color = mix(color, vec3(1.0), softDisc(distance(disc, vec2(0.16, -0.24)), uCoreRadius, BLUR) * 0.7);

        // "Thinking" glow pulse.
        color = mix(color, vec3(1.0), uGlow);

        // Grain, overlay-blended at half strength. The SVG's fractal noise
        // clusters around mid grey, so keep the noise close to 0.5.
        float g = 0.5 + (hash(gl_FragCoord.xy) - 0.5) * 0.35;
        vec3 overlay = mix(2.0 * color * g, 1.0 - 2.0 * (1.0 - color) * (1.0 - g), step(0.5, color));
        color = mix(color, overlay, 0.5);

        // Light theme: deeper, more saturated colour and a soft darker rim,
        // so the orb holds its own against a pale page.
        float rim = smoothstep(0.55, 1.0, 1.0 - vView.z);
        color = mix(color, pow(color, vec3(1.45)), uLight * 0.75);
        color = mix(color, color * 0.72, rim * uLight * 0.6);

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function createBloomMaterial(): ShaderMaterial {
    return new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uBase: { value: srgb(PALETTE.peri) },
            uAqua: { value: srgb(PALETTE.aqua) },
            uBlobAt: { value: BLOBS.map((blob) => blob.at) },
            uBlobColor: { value: BLOBS.map((blob) => srgb(blob.color)) },
            uBlobRadius: { value: BLOBS.map((blob) => blob.radius) },
            uBloomRadius: { value: 0.24 },
            uBloomOpacity: { value: 0.6 },
            uCoreRadius: { value: 0.08 },
            uGlow: { value: 0 },
            uLight: { value: 0 },
        },
    });
}

/**
 * Sets the breath. `phase` runs 0 → 1 over one breath: the bloom opens
 * from radius 6 to 15 and back (eased), its opacity 0.6 → 1 → 0.6 and the
 * white core 2 → 6 → 2, as in the SVG. `glow` is the thinking pulse, 0 to 1.
 */
export function setBreath(
    material: ShaderMaterial,
    phase: number,
    glow: number,
) {
    const swell = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    const linear = 1 - Math.abs(1 - phase * 2);

    material.uniforms.uBloomRadius.value = (6 + 9 * swell) / 25;
    material.uniforms.uBloomOpacity.value = 0.6 + 0.4 * linear;
    material.uniforms.uCoreRadius.value = (2 + 4 * linear) / 25;
    material.uniforms.uGlow.value = glow * 0.16;
}

/** The material for a theme: tuned to stay visible on the light page. */
export function setBloomTheme(material: ShaderMaterial, light: boolean) {
    material.uniforms.uLight.value = light ? 1 : 0;
}

/** The halo per theme: a lavender glow on dark, a softer indigo one on light. */
export const HALO = {
    dark: { color: PALETTE.lavender, opacity: 0.45 },
    light: { color: PALETTE.indigo, opacity: 0.2 },
};
