import { useEffect, useRef } from "react";
import "../styles/GlassMorphismDecor.css";

/**
 * LoginFloatingDecor — Glass Morphism Floating Cards
 * Creates elegant floating glassmorphic cards that float and rotate smoothly.
 * Interactive elements respond to mouse movement with parallax effect.
 */
export default function LoginFloatingDecor() {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };

    const elements = document.querySelectorAll("[data-glass-float]");
    elementsRef.current = Array.from(elements).map((el) => {
      const depth = parseFloat(el.getAttribute("data-glass-float"));
      return {
        element: el,
        depth,
        x: 0,
        y: 0,
        rotX: 0,
        rotY: 0,
      };
    });

    const animate = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      elementsRef.current.forEach((item) => {
        const range = 60 * item.depth;
        item.x += (mx * range - item.x) * 0.08;
        item.y += (my * range - item.y) * 0.08;
        item.rotX += (my * 20 - item.rotX) * 0.06;
        item.rotY += (mx * 20 - item.rotY) * 0.06;

        item.element.style.transform = `
          translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px))
          rotateX(${item.rotX}deg)
          rotateY(${item.rotY}deg)
          rotateZ(${item.x * 0.05}deg)
        `;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const glassCards = [
    // Top-left cluster
    {
      id: "glass-1",
      size: 120,
      top: "10%",
      left: "8%",
      depth: 0.3,
      delay: "0s",
      icon: "✨",
      color: "from-pink-500 to-orange-400",
    },
    {
      id: "glass-2",
      size: 80,
      top: "22%",
      left: "18%",
      depth: 0.5,
      delay: "0.4s",
      icon: "🚀",
      color: "from-purple-500 to-pink-400",
    },
    {
      id: "glass-3",
      size: 60,
      top: "8%",
      left: "26%",
      depth: 0.2,
      delay: "0.8s",
      icon: "💫",
      color: "from-blue-400 to-cyan-300",
    },

    // Top-right cluster
    {
      id: "glass-4",
      size: 100,
      top: "12%",
      right: "10%",
      depth: 0.35,
      delay: "0.2s",
      icon: "🌟",
      color: "from-cyan-400 to-blue-500",
    },
    {
      id: "glass-5",
      size: 70,
      top: "28%",
      right: "18%",
      depth: 0.25,
      delay: "0.6s",
      icon: "⚡",
      color: "from-lime-400 to-green-500",
    },

    // Middle-left
    {
      id: "glass-6",
      size: 90,
      top: "48%",
      left: "6%",
      depth: 0.28,
      delay: "0.3s",
      icon: "🎯",
      color: "from-orange-400 to-red-500",
    },

    // Middle-right
    {
      id: "glass-7",
      size: 85,
      top: "55%",
      right: "8%",
      depth: 0.32,
      delay: "0.5s",
      icon: "💎",
      color: "from-purple-400 to-pink-500",
    },

    // Bottom-left cluster
    {
      id: "glass-8",
      size: 110,
      bottom: "10%",
      left: "12%",
      depth: 0.3,
      delay: "0.1s",
      icon: "🌈",
      color: "from-yellow-300 to-orange-400",
    },
    {
      id: "glass-9",
      size: 65,
      bottom: "24%",
      left: "4%",
      depth: 0.45,
      delay: "0.7s",
      icon: "✨",
      color: "from-pink-400 to-rose-500",
    },

    // Bottom-right cluster
    {
      id: "glass-10",
      size: 95,
      bottom: "12%",
      right: "10%",
      depth: 0.33,
      delay: "0.35s",
      icon: "🎨",
      color: "from-blue-400 to-purple-500",
    },
    {
      id: "glass-11",
      size: 75,
      bottom: "28%",
      right: "20%",
      depth: 0.27,
      delay: "0.65s",
      icon: "🔮",
      color: "from-cyan-300 to-blue-400",
    },

    // Side accents
    {
      id: "glass-12",
      size: 50,
      top: "38%",
      left: "2%",
      depth: 0.2,
      delay: "0.9s",
      icon: "⭐",
      color: "from-yellow-200 to-yellow-400",
    },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        perspective: "1000px",
      }}
    >
      {glassCards.map((card) => (
        <div
          key={card.id}
          data-glass-float={card.depth}
          className="glass-morphism-card"
          style={{
            position: "absolute",
            ...(card.top && { top: card.top }),
            ...(card.bottom && { bottom: card.bottom }),
            ...(card.left && { left: card.left }),
            ...(card.right && { right: card.right }),
            width: `${card.size}px`,
            height: `${card.size}px`,
            transform: "translate(-50%, -50%)",
            animation: `float-glass ${6 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: card.delay,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${
                {
                  "from-pink-500 to-orange-400":
                    "rgba(236, 72, 153, 0.15), rgba(251, 146, 60, 0.1)",
                  "from-purple-500 to-pink-400":
                    "rgba(168, 85, 247, 0.15), rgba(244, 114, 182, 0.1)",
                  "from-blue-400 to-cyan-300":
                    "rgba(96, 165, 250, 0.15), rgba(165, 243, 252, 0.1)",
                  "from-cyan-400 to-blue-500":
                    "rgba(34, 211, 238, 0.15), rgba(59, 130, 246, 0.1)",
                  "from-lime-400 to-green-500":
                    "rgba(163, 230, 53, 0.15), rgba(34, 197, 94, 0.1)",
                  "from-orange-400 to-red-500":
                    "rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.1)",
                  "from-purple-400 to-pink-500":
                    "rgba(192, 132, 250, 0.15), rgba(236, 72, 153, 0.1)",
                  "from-yellow-300 to-orange-400":
                    "rgba(253, 224, 71, 0.15), rgba(251, 146, 60, 0.1)",
                  "from-pink-400 to-rose-500":
                    "rgba(244, 114, 182, 0.15), rgba(239, 68, 68, 0.1)",
                  "from-blue-400 to-purple-500":
                    "rgba(96, 165, 250, 0.15), rgba(168, 85, 247, 0.1)",
                  "from-cyan-300 to-blue-400":
                    "rgba(165, 243, 252, 0.15), rgba(96, 165, 250, 0.1)",
                  "from-yellow-200 to-yellow-400":
                    "rgba(254, 243, 199, 0.15), rgba(253, 224, 71, 0.1)",
                }[card.color] || "rgba(255, 255, 255, 0.1)"
              })`,
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              borderRadius: `${card.size * 0.15}px`,
              boxShadow:
                "0 8px 32px 0 rgba(31, 38, 135, 0.1), inset 0 1px 2px 0 rgba(255, 255, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${card.size * 0.4}px`,
              transformStyle: "preserve-3d",
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {card.icon}
            <div
              style={{
                position: "absolute",
                inset: "3px",
                borderRadius: `${card.size * 0.12}px`,
                background:
                  "radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4), transparent)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
