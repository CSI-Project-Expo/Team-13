import { useEffect, useRef } from 'react';

/**
 * CustomCursor
 * - A small indigo dot that snaps exactly to the mouse pointer.
 * - A larger frosted ring that lerps behind for a smooth trailing effect.
 * - The ring scales up and fills lightly when hovering interactive elements.
 *
 * Drop this once at the top level (App.jsx). It hides the native cursor globally.
 */
export default function CustomCursor() {
    const dotRef  = useRef(null);
    const ringRef = useRef(null);
    const rafRef  = useRef(null);

    const mouse  = useRef({ x: window.innerWidth / 2,  y: window.innerHeight / 2 });
    const ring   = useRef({ x: window.innerWidth / 2,  y: window.innerHeight / 2 });
    const hover  = useRef(false);

    useEffect(() => {
        const LERP = 0.14;

        // ── Track raw mouse ──────────────────────────────────────────────────
        const onMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        // ── Detect interactive elements ──────────────────────────────────────
        const onEnter = () => { hover.current = true; };
        const onLeave = () => { hover.current = false; };

        const INTERACTIVES = 'a, button, input, textarea, select, label, [role="button"]';

        const attachHover = () => {
            document.querySelectorAll(INTERACTIVES).forEach(el => {
                el.addEventListener('mouseenter', onEnter);
                el.addEventListener('mouseleave', onLeave);
            });
        };

        // Re-attach on DOM changes (e.g. React route changes)
        const observer = new MutationObserver(attachHover);
        observer.observe(document.body, { childList: true, subtree: true });
        attachHover();

        // ── Hide native cursor globally ──────────────────────────────────────
        document.documentElement.style.cursor = 'none';

        // ── Animation loop ───────────────────────────────────────────────────
        const tick = () => {
            const mx = mouse.current.x;
            const my = mouse.current.y;

            // Dot snaps immediately
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${mx}px, ${my}px)`;
            }

            // Ring lerps
            ring.current.x += (mx - ring.current.x) * LERP;
            ring.current.y += (my - ring.current.y) * LERP;

            if (ringRef.current) {
                const scale = hover.current ? 2.0 : 1;
                const opacity = hover.current ? 0.35 : 0.65;
                ringRef.current.style.transform  = `translate(${ring.current.x}px, ${ring.current.y}px) scale(${scale})`;
                ringRef.current.style.opacity    = opacity;
                ringRef.current.style.background = hover.current
                    ? 'rgba(99,102,241,0.12)'
                    : 'transparent';
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        window.addEventListener('mousemove', onMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafRef.current);
            observer.disconnect();
            document.documentElement.style.cursor = '';
        };
    }, []);

    return (
        <>
            {/* Dot — snaps to cursor */}
            <div ref={dotRef} style={{
                position: 'fixed',
                top: 0, left: 0,
                pointerEvents: 'none',
                zIndex: 99999,
                willChange: 'transform',
                transform: 'translate(-50%, -50%)',
            }}>
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 8px rgba(99,102,241,0.8)',
                    translate: '-50% -50%',
                }} />
            </div>

            {/* Ring — lerps behind */}
            <div ref={ringRef} style={{
                position: 'fixed',
                top: 0, left: 0,
                pointerEvents: 'none',
                zIndex: 99998,
                willChange: 'transform, opacity',
                transition: 'background 0.2s, opacity 0.2s',
            }}>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(99,102,241,0.75)',
                    translate: '-50% -50%',
                    transition: 'border-color 0.2s',
                }} />
            </div>
        </>
    );
}
