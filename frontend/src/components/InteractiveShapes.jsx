import { useEffect, useRef } from "react";
import "../styles/InteractiveShapes.css";

export default function InteractiveShapes() {
  const containerRef = useRef(null);
  const shapesRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const shapes = containerRef.current.querySelectorAll("[data-shape]");
    shapesRef.current = shapes;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;

      shapes.forEach((shape) => {
        const rect = shape.getBoundingClientRect();
        const shapeX = rect.left + rect.width / 2;
        const shapeY = rect.top + rect.height / 2;

        const distX = clientX - shapeX;
        const distY = clientY - shapeY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        // Repel effect - shapes move away from cursor
        const maxDistance = 200;
        if (distance < maxDistance) {
          const angle = Math.atan2(distY, distX);
          const force = (1 - distance / maxDistance) * 25;
          const pushX = Math.cos(angle) * force;
          const pushY = Math.sin(angle) * force;

          shape.style.transform = `translate(${-pushX}px, ${-pushY}px) rotate(${distance * 0.05}deg)`;
        } else {
          shape.style.transform = `translate(0, 0) rotate(0deg)`;
        }
      });
    };

    const handleMouseLeave = () => {
      shapes.forEach((shape) => {
        shape.style.transform = `translate(0, 0) rotate(0deg)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Generate random shapes with even distribution
  const generateShapes = () => {
    const shapes = [];
    const positions = [
      // Top row - evenly spaced
      {
        top: "8%",
        left: "10%",
        size: 100,
        type: "circle",
        color: "shape-blue",
      },
      {
        top: "8%",
        left: "40%",
        size: 85,
        type: "square",
        color: "shape-amber",
      },
      {
        top: "8%",
        right: "10%",
        size: 95,
        type: "triangle",
        color: "shape-red",
      },

      // Middle row - evenly spaced
      {
        top: "50%",
        left: "8%",
        size: 90,
        type: "square",
        color: "shape-purple",
      },
      {
        top: "48%",
        left: "50%",
        transform: "translateX(-50%)",
        size: 100,
        type: "circle",
        color: "shape-cyan",
      },
      {
        top: "50%",
        right: "8%",
        size: 95,
        type: "triangle",
        color: "shape-pink",
      },
    ];

    return positions.map((pos, idx) => ({
      id: idx,
      ...pos,
    }));
  };

  const shapes = generateShapes();

  return (
    <div ref={containerRef} className="interactive-shapes-container">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          data-shape
          className={`interactive-shape ${shape.type} ${shape.color}`}
          style={{
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            top: shape.top,
            bottom: shape.bottom,
            left: shape.left,
            right: shape.right,
            animationDelay: `${shape.id * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
