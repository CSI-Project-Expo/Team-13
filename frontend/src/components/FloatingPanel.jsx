import { useEffect } from "react";

export default function FloatingPanel({
  isOpen,
  onClose,
  title,
  children,
  size = "large", // 'small', 'medium', 'large'
}) {
  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Add escape key handler
      const handleEscapeKey = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = "auto";
      };
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div className="floating-panel__backdrop" onClick={handleBackdropClick} />

      {/* Floating panel */}
      <div
        className={`floating-panel floating-panel--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="floating-panel__header">
          <h2 className="floating-panel__title">{title}</h2>
          <button
            className="floating-panel__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="floating-panel__content">{children}</div>
      </div>
    </>
  );
}
