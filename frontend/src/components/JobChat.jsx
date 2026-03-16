import { useState, useEffect, useRef } from "react";

export default function JobChat({
  jobId,
  jobStatus,
  currentUserId,
  jobOwnerId,
  assignedGenieId,
  isFloating = false, // New prop to indicate floating mode
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const canChat = ["POSTED", "ACCEPTED", "IN_PROGRESS"].includes(jobStatus);

  // Check if current user is the job owner (user who posted the job)
  const isJobOwner = currentUserId === jobOwnerId;

  // Check if genie has sent any messages
  const genieHasMessaged = messages.some(
    (msg) => msg.sender_id === assignedGenieId,
  );

  // User can only send messages if they're the genie OR if they're the job owner and genie has messaged
  const canSendMessage = !isJobOwner || genieHasMessaged;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // In floating mode, connect immediately. In inline mode, only connect if chat is open
    const shouldConnect = isFloating ? canChat : canChat && isChatOpen;

    if (!shouldConnect) {
      // Cleanup if we shouldn't be connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }

    // Don't create a new connection if one already exists
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected, reusing existing connection");
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
        // Replace entire history, deduplicating by message ID
        const uniqueMessages = Array.from(
          new Map(data.messages.map((msg) => [msg.id, msg])).values(),
        );
        setMessages(uniqueMessages);
      } else if (data.type === "new_message") {
        // Only add message if it doesn't already exist (prevents duplicates)
        setMessages((prev) => {
          const messageExists = prev.some((m) => m.id === data.message.id);
          if (messageExists) {
            console.log("Duplicate message ignored:", data.message.id);
            return prev;
          }
          return [...prev, data.message];
        });
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
      // Clear the ref when connection closes
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    wsRef.current = ws;

    return () => {
      // Only close if this is the currently active connection
      if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection");
        ws.close();
      }
    };
  }, [jobId, canChat, isChatOpen, isFloating]);

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

  // Floating mode: render just the chat content (without toggle button)
  if (isFloating) {
    return (
      <div className="job-chat__floating-content">
        <div className="job-chat__messages">
          {messages.length === 0 ? (
            <div className="job-chat__empty">
              <p>
                {isJobOwner
                  ? "Waiting for the Genie to start the conversation..."
                  : "No messages yet. Start a conversation!"}
              </p>
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
            placeholder={
              !canSendMessage
                ? "Waiting for Genie to start the conversation..."
                : "Type a message..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!isConnected || !canSendMessage}
          />
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!isConnected || !newMessage.trim() || !canSendMessage}
          >
            Send
          </button>
        </form>

        <div className="job-chat__status-indicator">
          <span className="job-chat__status job-chat__status--info">
            {isConnected ? "● Connected" : "○ Connecting..."}
          </span>
        </div>
      </div>
    );
  }

  // Inline mode: render with toggle button (original behavior)
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
                <p>
                  {isJobOwner
                    ? "Waiting for the Genie to start the conversation..."
                    : "No messages yet. Start a conversation!"}
                </p>
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
              placeholder={
                !canSendMessage
                  ? "Waiting for Genie to start the conversation..."
                  : "Type a message..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!isConnected || !canSendMessage}
            />
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={!isConnected || !newMessage.trim() || !canSendMessage}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
