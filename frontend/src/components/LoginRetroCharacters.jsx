import { useEffect, useMemo, useRef, useState } from "react";

const CHARACTERS = [
  {
    id: "tall",
    x: 13,
    y: 71,
    width: 170,
    height: 300,
    color: "#ef5b7b",
    eyeCount: 2,
    tilt: -1,
    mouthOffsetY: -0.29,
    mouthSense: 0.14,
  },
  {
    id: "pink",
    x: 64,
    y: 73,
    width: 188,
    height: 302,
    color: "#ee9ec0",
    eyeCount: 1,
    tilt: 1,
    mouthOffsetY: 0.08,
    mouthSense: 0.16,
  },
  {
    id: "teal",
    x: 23,
    y: 84,
    width: 154,
    height: 154,
    color: "#72c9c6",
    eyeCount: 2,
    tilt: 2,
    mouthOffsetY: 0.08,
    mouthSense: 0.2,
  },
  {
    id: "blue",
    x: 49,
    y: 87,
    width: 126,
    height: 126,
    color: "#3b8fe6",
    eyeCount: 2,
    tilt: 1,
    mouthOffsetY: 0.16,
    mouthSense: 0.2,
  },
];

function CharacterEyes({ eyeCount = 2 }) {
  return (
    <div className={`retro-char-eyes ${eyeCount === 1 ? "retro-char-eyes--single" : ""}`}>
      <div className="retro-char-eye">
        <span className="retro-char-pupil" />
      </div>
      {eyeCount === 2 && (
        <div className="retro-char-eye">
          <span className="retro-char-pupil" />
        </div>
      )}
    </div>
  );
}

export default function LoginRetroCharacters({
  activeField = "",
  mood = "happy",
  isPasswordVisible = false,
}) {
  const panelRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (event) => {
      setMouse({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const eyeOffset = useMemo(() => {
    if (activeField === "email") {
      return { x: 6, y: -1 };
    }

    if (activeField === "password") {
      return { x: 7, y: 2 };
    }

    const centerX = window.innerWidth / 2 || 1;
    const centerY = window.innerHeight / 2 || 1;
    const angle = Math.atan2(mouse.y - centerY, mouse.x - centerX);
    return {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5,
    };
  }, [activeField, mouse.x, mouse.y]);

  const nearMouthIds = useMemo(() => {
    const panel = panelRef.current;
    if (!panel) return new Set();

    const rect = panel.getBoundingClientRect();
    const hits = new Set();

    CHARACTERS.forEach((character) => {
      const centerY = rect.top + (character.y / 100) * rect.height;
      const mouthX = rect.left + (character.x / 100) * rect.width;
      const mouthY = centerY + character.height * character.mouthOffsetY;
      const distance = Math.hypot(mouse.x - mouthX, mouse.y - mouthY);
      const threshold = Math.max(
        24,
        Math.max(character.width, character.height) * character.mouthSense
      );
      if (distance <= threshold) {
        hits.add(character.id);
      }
    });

    return hits;
  }, [mouse.x, mouse.y]);

  const shellClasses = ["retro-characters"];
  if (activeField === "password") shellClasses.push("retro-characters--password");
  if (isPasswordVisible) {
    shellClasses.push("retro-characters--turn-away");
    shellClasses.push("retro-characters--whistle");
  }
  if (mood === "sad") shellClasses.push("retro-characters--sad");

  return (
    <div ref={panelRef} className={shellClasses.join(" ")}>
      {CHARACTERS.map((character, index) => (
        <div
          key={character.id}
          className={`retro-character retro-character--${character.id} ${nearMouthIds.has(character.id) ? "retro-character--mouth-open" : ""}`}
          style={{
            left: `${character.x}%`,
            top: `${character.y}%`,
            width: `${character.width}px`,
            height: `${character.height}px`,
            backgroundColor: character.color,
            "--tilt": `${character.tilt}deg`,
            "--pupil-x": `${eyeOffset.x}px`,
            "--pupil-y": `${eyeOffset.y}px`,
            animationDelay: `${index * 0.12}s`,
          }}
        >
          <CharacterEyes eyeCount={character.eyeCount} />
          <div className="retro-char-mouth" />
          <div className="retro-char-whistle" />
          <div className="retro-char-legs" />
          <div className="retro-char-hand retro-char-hand--left" />
          <div className="retro-char-hand retro-char-hand--right" />
        </div>
      ))}
    </div>
  );
}
