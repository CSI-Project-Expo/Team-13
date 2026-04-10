import { useMemo, useState } from "react";
import alladinIcon from "../assets/alladin-icon.png";

const QUICK_PROMPTS = [
  "How do I book a job?",
  "How does wallet work?",
  "How do I become a verified genie?",
  "Give me tips to use this app better",
];

function buildReply(message) {
  const text = message.toLowerCase();

  if (
    text.includes("book") ||
    text.includes("post a job") ||
    text.includes("create job")
  ) {
    return "To book help, go to Create Job, add title + description + location + budget, and submit. Then check Dashboard for Genie responses and status updates.";
  }

  if (
    text.includes("wallet") ||
    text.includes("add funds") ||
    text.includes("withdraw") ||
    text.includes("escrow")
  ) {
    return "Wallet basics: add funds from Wallet page, accept/active jobs may lock funds in escrow, and you can withdraw available balance. Keep some balance ready for faster job acceptance.";
  }

  if (
    text.includes("genie") ||
    text.includes("verify") ||
    text.includes("verification")
  ) {
    return "For Genie verification, open Genie Dashboard > Verification tab, upload document(s), list your skills, and submit. Admin review decides approval.";
  }

  if (
    text.includes("profile") ||
    text.includes("password") ||
    text.includes("account")
  ) {
    return "In Profile, you can update your name, change password, view account details, and jump to Wallet or your Dashboard quickly.";
  }

  if (
    text.includes("tip") ||
    text.includes("guide") ||
    text.includes("help") ||
    text.includes("how to use")
  ) {
    return "Quick tips: be specific in job descriptions, set fair budget, respond quickly, keep wallet topped up, and complete profiles/verification for more trust.";
  }

  return "I can help with booking, wallet, profile, verification, dashboard usage, and general app guidance. Ask something like: 'How to post a job?' or 'How does escrow work?'";
}

export default function AlladinChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi, I am alladin. Ask me anything about this app, booking, wallet, profile, or tips.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const sendMessage = (rawText) => {
    const content = rawText.trim();
    if (!content) return;

    const reply = buildReply(content);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: content },
      { role: "bot", text: reply },
    ]);
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        className="alladin-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open alladin chatbot"
      >
        <img src={alladinIcon} alt="" className="alladin-trigger__icon" />
        <span>alladin</span>
      </button>

      {isOpen && (
        <section className="alladin-panel" aria-label="alladin chatbot">
          <header className="alladin-panel__header">
            <strong>alladin</strong>
            <button
              type="button"
              className="alladin-panel__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              x
            </button>
          </header>

          <div className="alladin-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`alladin-message alladin-message--${message.role}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="alladin-quick-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="alladin-quick-prompts__item"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="alladin-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              className="alladin-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about booking, wallet, tips..."
            />
            <button type="submit" className="alladin-send" disabled={!canSend}>
              Send
            </button>
          </form>
        </section>
      )}
    </>
  );
}
