import { useState, useEffect } from 'react';

const MESSAGES = [
  { id: 1, text: "Ugh, my garden grass is so long but I'm way too lazy to cut it 😩", sender: "you" },
  { id: 2, text: "Don't worry, I've got it! 🌿⚡", sender: "genie" },
  { id: 3, text: "Really? You're a lifesaver!", sender: "you" },
];

export default function AnimatedChat() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= MESSAGES.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animated-chat">
      <div className="animated-chat__messages">
        {MESSAGES.slice(0, visibleCount).map((msg) => (
          <div
            key={msg.id}
            className={`animated-chat__row animated-chat__row--${msg.sender === 'genie' ? 'stranger' : msg.sender}`}
          >
            <div className="animated-chat__bubble">
              <span className="animated-chat__label">
                {msg.sender === 'you' ? 'YOU' : 'GENIE'}
              </span>
              <p className="animated-chat__text">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      {visibleCount > 0 && (
        <div className="animated-chat__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}
