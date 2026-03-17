import { useEffect, useRef } from "react";
import "../styles/MaterialFloatingElements.css";

export default function MaterialFloatingElements() {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(
      "[data-material-float]",
    );
    elementsRef.current = elements;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      elements.forEach((el) => {
        const depth = parseFloat(el.getAttribute("data-depth")) || 1;
        const offsetX = (clientX - centerX) * depth * 0.02;
        const offsetY = (clientY - centerY) * depth * 0.02;

        el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const materials = [
    {
      icon: "📱",
      label: "Mobile First",
      color: "material-blue",
      delay: "0s",
      depth: 2,
    },
    {
      icon: "⚡",
      label: "Fast & Smooth",
      color: "material-amber",
      delay: "0.1s",
      depth: 3,
    },
    {
      icon: "🔒",
      label: "Secure",
      color: "material-red",
      delay: "0.2s",
      depth: 1,
    },
    {
      icon: "🎯",
      label: "Reliable",
      color: "material-green",
      delay: "0.3s",
      depth: 2,
    },
    {
      icon: "✨",
      label: "Premium",
      color: "material-purple",
      delay: "0.4s",
      depth: 3,
    },
    {
      icon: "🚀",
      label: "Fast Deploy",
      color: "material-cyan",
      delay: "0.5s",
      depth: 1,
    },
  ];

  return (
    <div ref={containerRef} className="material-floating-container">
      {materials.map((item, idx) => (
        <div
          key={idx}
          data-material-float
          data-depth={item.depth}
          className={`material-float-card ${item.color}`}
          style={{ animationDelay: item.delay }}
        >
          <div className="material-float-icon">{item.icon}</div>
          <div className="material-float-label">{item.label}</div>
          <div className="material-ripple"></div>
        </div>
      ))}
    </div>
  );
}
