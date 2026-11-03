import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins once. Import gsap and ScrollTrigger from here so registration
// is guaranteed before use.
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
