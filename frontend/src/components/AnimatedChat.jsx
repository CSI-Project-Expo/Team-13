import { useState, useEffect, useRef } from 'react';

const CONVERSATION_EXAMPLES = [
  {
    id: 1,
    title: "Garden Help",
    messages: [
      { id: 1, text: "Ugh, my garden grass is so long but I'm way too lazy to cut it 😩", sender: "you" },
      { id: 2, text: "Don't worry, I've got it! 🌿⚡", sender: "genie" },
      { id: 3, text: "Really? You're a lifesaver!", sender: "you" },
    ]
  },
  {
    id: 2,
    title: "Airport Run",
    messages: [
      { id: 1, text: "Need someone to pick up my sister from airport in 2 hrs 🛫", sender: "you" },
      { id: 2, text: "I'm nearby! What terminal?", sender: "genie" },
      { id: 3, text: "Terminal 2, Delta flight. You're amazing!", sender: "you" },
      { id: 4, text: "On my way! 🚗💨", sender: "genie" },
    ]
  },
  {
    id: 3,
    title: "Payment",
    messages: [
      { id: 1, text: "Job done! The lawn looks perfect 🌱", sender: "genie" },
      { id: 2, text: "Wow, that was fast! Releasing payment now 💳", sender: "you" },
      { id: 3, text: "₹500 received! Thanks for the quick work!", sender: "genie" },
      { id: 4, text: "⭐⭐⭐⭐⭐ Excellent service!", sender: "you" },
    ]
  },
  {
    id: 4,
    title: "Rating System",
    messages: [
      { id: 1, text: "How was the grocery shopping experience?", sender: "genie" },
      { id: 2, text: "Perfect! Got everything on my list 📝", sender: "you" },
      { id: 3, text: "Great! Could you rate me? ⭐", sender: "genie" },
      { id: 4, text: "5 stars! Super efficient and friendly!", sender: "you" },
      { id: 5, text: "🎉 You earned 50 reward points!", sender: "system" },
    ]
  }
];

export default function AnimatedChat() {
  const [currentExample, setCurrentExample] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [visibleCount]);

  // Reset scroll when transitioning to new conversation
  useEffect(() => {
    if (messagesContainerRef.current && isTransitioning) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [isTransitioning]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= CONVERSATION_EXAMPLES[currentExample].messages.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [currentExample]);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentExample((prev) => (prev + 1) % CONVERSATION_EXAMPLES.length);
        setVisibleCount(0);
        setIsTransitioning(false);
      }, 500);
    }, 8000);
    return () => clearInterval(rotationInterval);
  }, []);

  const currentMessages = CONVERSATION_EXAMPLES[currentExample].messages;

  return (
    <div className="animated-chat">
      <div className="animated-chat__header">
        <span className="animated-chat__title">{CONVERSATION_EXAMPLES[currentExample].title}</span>
        <div className="animated-chat__dots-indicator">
          {CONVERSATION_EXAMPLES.map((_, index) => (
            <span 
              key={index}
              className={`animated-chat__dot ${index === currentExample ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
      <div 
        ref={messagesContainerRef}
        className={`animated-chat__messages ${isTransitioning ? 'transitioning' : ''}`}
      >
        {currentMessages.slice(0, visibleCount).map((msg) => (
          <div
            key={msg.id}
            className={`animated-chat__row animated-chat__row--${msg.sender === 'genie' ? 'stranger' : msg.sender}`}
          >
            <div className="animated-chat__bubble">
              <span className="animated-chat__label">
                {msg.sender === 'you' ? 'YOU' : msg.sender === 'genie' ? 'GENIE' : 'SYSTEM'}
              </span>
              <p className="animated-chat__text">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      {visibleCount > 0 && visibleCount < currentMessages.length && (
        <div className="animated-chat__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}
