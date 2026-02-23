import { useEffect, useRef } from 'react';

/**
 * ParallaxBg
 * Three glowing orbs that smoothly follow the mouse cursor at different
 * parallax depths, creating a sense of dimensionality.
 *
 * Usage: drop <ParallaxBg /> as the first child inside any full-screen wrapper.
 */
export default function ParallaxBg() {
    const orb1Ref = useRef(null);
    const orb2Ref = useRef(null);
    const orb3Ref = useRef(null);
    const rafRef  = useRef(null);

    // Current (lerped) positions for each orb
    const pos = useRef({
        o1: { x: 0, y: 0 },
        o2: { x: 0, y: 0 },
        o3: { x: 0, y: 0 },
    });

    // Raw mouse position (–0.5 … 0.5 relative to viewport)
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e) => {
            mouse.current.x = (e.clientX / window.innerWidth)  - 0.5;
            mouse.current.y = (e.clientY / window.innerHeight) - 0.5;
        };

        window.addEventListener('mousemove', onMove, { passive: true });

        // Lerp factor per orb — higher = snappier / more responsive
        const LERP = { o1: 0.10, o2: 0.14, o3: 0.20 };

        // Max travel distance in px per orb
        const RANGE = { o1: 150, o2: 240, o3: 340 };

        const lerp = (a, b, t) => a + (b - a) * t;

        const tick = () => {
            const p  = pos.current;
            const mx = mouse.current.x;
            const my = mouse.current.y;

            p.o1.x = lerp(p.o1.x, mx * RANGE.o1, LERP.o1);
            p.o1.y = lerp(p.o1.y, my * RANGE.o1, LERP.o1);

            p.o2.x = lerp(p.o2.x, mx * RANGE.o2, LERP.o2);
            p.o2.y = lerp(p.o2.y, my * RANGE.o2, LERP.o2);

            p.o3.x = lerp(p.o3.x, mx * RANGE.o3, LERP.o3);
            p.o3.y = lerp(p.o3.y, my * RANGE.o3, LERP.o3);

            if (orb1Ref.current)
                orb1Ref.current.style.transform = `translate(calc(-50% + ${p.o1.x}px), calc(-50% + ${p.o1.y}px))`;
            if (orb2Ref.current)
                orb2Ref.current.style.transform = `translate(calc(${p.o2.x}px), calc(${p.o2.y}px))`;
            if (orb3Ref.current)
                orb3Ref.current.style.transform = `translate(calc(-50% + ${p.o3.x}px), calc(-50% + ${p.o3.y}px))`;

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {/* Orb 1 — top-left anchor, indigo-violet, moves slowest (deep) */}
            <div ref={orb1Ref} style={{
                position: 'absolute',
                top: '10%', left: '15%',
                width: 520, height: 520,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.25) 50%, transparent 100%)',
                filter: 'blur(72px)',
                willChange: 'transform',
                transform: 'translate(-50%, -50%)',
            }} />

            {/* Orb 2 — bottom-right anchor, blue, moves at medium speed */}
            <div ref={orb2Ref} style={{
                position: 'absolute',
                bottom: '-8%', right: '-5%',
                width: 440, height: 440,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(99,102,241,0.2) 55%, transparent 100%)',
                filter: 'blur(68px)',
                willChange: 'transform',
            }} />

            {/* Orb 3 — center, teal-indigo, moves fastest (foreground feel) */}
            <div ref={orb3Ref} style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 360, height: 360,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(99,102,241,0.15) 55%, transparent 100%)',
                filter: 'blur(64px)',
                willChange: 'transform',
                transform: 'translate(-50%, -50%)',
            }} />
        </div>
    );
}
