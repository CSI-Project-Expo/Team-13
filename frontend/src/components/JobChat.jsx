import { useState, useEffect, useRef } from "react";

export default function JobChat({ jobId, jobStatus, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const canChat = ["POSTED", "ACCEPTED", "IN_PROGRESS"].includes(jobStatus);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!canChat || !isChatOpen) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }

    // Create WebSocket connection
    const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${jobId}?token=${token}`;
    console.log("Attempting WebSocket connection to:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      if (data.type === "history") {
        setMessages(data.messages);
      } else if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.error("WebSocket state:", ws.readyState);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log(
        "WebSocket disconnected. Code:",
        event.code,
        "Reason:",
        event.reason,
      );
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [jobId, canChat, isChatOpen]);

  const sendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !isConnected) return;

    wsRef.current?.send(
      JSON.stringify({
        type: "message",
        content: newMessage.trim(),
      }),
    );

    setNewMessage("");
  };

  if (!canChat) {
    return null;
  }

  return (
    <div className="job-chat">
      <button
        className="btn btn--sm btn--ghost job-chat__toggle"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        💬 {isChatOpen ? "Close Chat" : "Open Chat"}
        {messages.length > 0 && !isChatOpen && (
          <span className="job-chat__badge">{messages.length}</span>
        )}
      </button>

      {isChatOpen && (
        <div className="job-chat__window">
          <div className="job-chat__header">
            <h3 className="job-chat__title">Job Chat</h3>
            <span className="job-chat__status job-chat__status--info">
              {isConnected ? "● Connected" : "○ Connecting..."}
            </span>
          </div>

          <div className="job-chat__messages">
            {messages.length === 0 ? (
              <div className="job-chat__empty">
                <p>No messages yet. Start a conversation!</p>
                <p style={{ fontSize: "11px", marginTop: "8px", opacity: 0.7 }}>
                  Messages will be saved. The other person can reply anytime.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`job-chat__message ${
                    msg.sender_id === currentUserId
                      ? "job-chat__message--own"
                      : "job-chat__message--other"
                  }`}
                >
                  <div className="job-chat__message-header">
                    <span className="job-chat__sender">{msg.sender_name}</span>
                    <span className="job-chat__time">
                      {new Date(msg.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="job-chat__message-content">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="job-chat__form" onSubmit={sendMessage}>
            <input
              type="text"
              className="job-chat__input"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={!isConnected || !newMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
