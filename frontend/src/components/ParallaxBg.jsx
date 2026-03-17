import { useEffect, useRef } from 'react';

/**
 * ParallaxBg — Neo Brutalism Edition
 * Geometric shapes (squares, circles, triangles) that follow the mouse
 * with parallax depth, featuring bold borders and flat colors.
 */
export default function ParallaxBg() {
    const shape1Ref = useRef(null);
    const shape2Ref = useRef(null);
    const shape3Ref = useRef(null);
    const rafRef  = useRef(null);

    const pos = useRef({
        s1: { x: 0, y: 0 },
        s2: { x: 0, y: 0 },
        s3: { x: 0, y: 0 },
    });

    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e) => {
            mouse.current.x = (e.clientX / window.innerWidth)  - 0.5;
            mouse.current.y = (e.clientY / window.innerHeight) - 0.5;
        };

        window.addEventListener('mousemove', onMove, { passive: true });

        const LERP = { s1: 0.08, s2: 0.12, s3: 0.18 };
        const RANGE = { s1: 100, s2: 180, s3: 260 };

        const lerp = (a, b, t) => a + (b - a) * t;

        const tick = () => {
            const p  = pos.current;
            const mx = mouse.current.x;
            const my = mouse.current.y;

            p.s1.x = lerp(p.s1.x, mx * RANGE.s1, LERP.s1);
            p.s1.y = lerp(p.s1.y, my * RANGE.s1, LERP.s1);

            p.s2.x = lerp(p.s2.x, mx * RANGE.s2, LERP.s2);
            p.s2.y = lerp(p.s2.y, my * RANGE.s2, LERP.s2);

            p.s3.x = lerp(p.s3.x, mx * RANGE.s3, LERP.s3);
            p.s3.y = lerp(p.s3.y, my * RANGE.s3, LERP.s3);

            if (shape1Ref.current)
                shape1Ref.current.style.transform = `translate(calc(-50% + ${p.s1.x}px), calc(-50% + ${p.s1.y}px)) rotate(${p.s1.x * 0.15}deg)`;
            if (shape2Ref.current)
                shape2Ref.current.style.transform = `translate(calc(${p.s2.x}px), calc(${p.s2.y}px)) rotate(${p.s2.x * -0.1}deg)`;
            if (shape3Ref.current)
                shape3Ref.current.style.transform = `translate(calc(-50% + ${p.s3.x}px), calc(-50% + ${p.s3.y}px)) rotate(${p.s3.x * 0.2}deg)`;

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);
}
