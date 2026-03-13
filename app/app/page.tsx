"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { WELCOME_MESSAGE, PATHWAY_STAGES, PathwayStage } from "../../core/arbi";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STAGE_LABELS: Record<PathwayStage, string> = {
  intake: "Intake",
  groundzero: "GroundZero",
  civic: "Civic Access",
  skills: "Skills",
  market: "Market",
  profile: "Profile",
  career: "Career",
  business: "Business",
  trade: "Trade",
};

const STAGE_COLORS: Record<PathwayStage, string> = {
  intake: "#00e5ff",
  groundzero: "#ff6b35",
  civic: "#b47eff",
  skills: "#00e676",
  market: "#ffca28",
  profile: "#00b8d4",
  career: "#69f0ae",
  business: "#ff4081",
  trade: "#ffd740",
};

export default function ARBIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<PathwayStage>(
    PATHWAY_STAGES.INTAKE
  );
  const [showStages, setShowStages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streamingRef.current) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    streamingRef.current = true;

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userStage: currentStage,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: accumulated,
                    };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content:
            "Something went wrong on my end. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
      inputRef.current?.focus();
    }
  }, [input, messages, currentStage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stageColor = STAGE_COLORS[currentStage];

  return (
    <div className="arbi-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #040a0f;
          --surface: #080f18;
          --border: #0e2030;
          --text: #c8dde8;
          --text-dim: #4a6a7a;
          --text-muted: #1e3448;
          --accent: ${stageColor};
          --accent-dim: ${stageColor}22;
          --accent-glow: ${stageColor}44;
        }

        body { background: var(--bg); }

        .arbi-root {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          font-family: 'DM Mono', monospace;
          color: var(--text);
          position: relative;
          overflow: hidden;
        }

        .arbi-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(ellipse 60% 40% at 50% -10%, ${stageColor}08 0%, transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 40px, ${stageColor}04 40px, ${stageColor}04 41px);
          pointer-events: none;
          z-index: 0;
          transition: all 0.8s ease;
        }

        /* HEADER */
        .header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(4, 10, 15, 0.9);
          backdrop-filter: blur(10px);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .arbi-mark {
          width: 36px;
          height: 36px;
          border: 1.5px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 16px var(--accent-glow), inset 0 0 16px var(--accent-dim);
          animation: markPulse 3s ease-in-out infinite;
        }

        @keyframes markPulse {
          0%, 100% { box-shadow: 0 0 16px var(--accent-glow), inset 0 0 16px var(--accent-dim); }
          50% { box-shadow: 0 0 28px var(--accent-glow), inset 0 0 20px var(--accent-dim); }
        }

        .arbi-mark::before, .arbi-mark::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          border: 1px solid var(--accent);
        }
        .arbi-mark::before { top: -3px; left: -3px; }
        .arbi-mark::after { bottom: -3px; right: -3px; }

        .arbi-dot {
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent);
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .arbi-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: 4px;
          color: var(--accent);
          text-shadow: 0 0 20px var(--accent-glow);
        }

        .arbi-sub {
          font-size: 0.55rem;
          color: var(--text-dim);
          letter-spacing: 2px;
          margin-top: 1px;
        }

        /* STAGE INDICATOR */
        .stage-wrap {
          position: relative;
        }

        .stage-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-dim);
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 2px;
          padding: 6px 12px;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.2s;
        }

        .stage-btn:hover {
          background: var(--accent-glow);
        }

        .stage-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: rgba(4, 10, 15, 0.98);
          border: 1px solid var(--border);
          min-width: 200px;
          z-index: 100;
          backdrop-filter: blur(20px);
        }

        .stage-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 0.58rem;
          letter-spacing: 1px;
          color: var(--text-dim);
          border-bottom: 1px solid var(--border);
          transition: all 0.15s;
        }

        .stage-option:last-child { border-bottom: none; }
        .stage-option:hover { background: rgba(255,255,255,0.03); color: var(--text); }
        .stage-option.active { color: var(--text); }

        .stage-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* PATHWAY BAR */
        .pathway-bar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          padding: 0 24px;
          background: rgba(8, 15, 24, 0.8);
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
          gap: 0;
        }

        .pathway-bar::-webkit-scrollbar { display: none; }

        .pathway-node {
          display: flex;
          align-items: center;
          gap: 0;
          flex-shrink: 0;
        }

        .pnode {
          padding: 10px 14px;
          font-size: 0.48rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
        }

        .pnode:hover { color: var(--text-dim); }

        .pnode.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .pnode-sep {
          color: var(--text-muted);
          font-size: 0.5rem;
          padding: 0 2px;
        }

        /* MESSAGES */
        .messages-wrap {
          flex: 1;
          overflow-y: auto;
          position: relative;
          z-index: 10;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .messages-wrap::-webkit-scrollbar { width: 3px; }
        .messages-wrap::-webkit-scrollbar-thumb { background: var(--border); }

        .message {
          display: flex;
          gap: 14px;
          max-width: 820px;
          animation: msgIn 0.25s ease forwards;
        }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .msg-avatar {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.5rem;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .msg-avatar.arbi {
          border: 1px solid var(--accent);
          color: var(--accent);
          box-shadow: 0 0 8px var(--accent-glow);
        }

        .msg-avatar.user {
          border: 1px solid var(--text-muted);
          color: var(--text-dim);
        }

        .msg-content {
          flex: 1;
        }

        .msg-role {
          font-size: 0.46rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 6px;
          color: var(--text-dim);
        }

        .message.user .msg-role {
          text-align: right;
        }

        .msg-role.arbi-role { color: var(--accent); }

        .msg-bubble {
          padding: 14px 18px;
          line-height: 1.85;
          font-size: 0.82rem;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message.assistant .msg-bubble {
          background: rgba(8, 15, 24, 0.8);
          border: 1px solid var(--border);
          border-left: 2px solid var(--accent);
          color: var(--text);
        }

        .message.user .msg-bubble {
          background: var(--accent-dim);
          border: 1px solid var(--accent);
          color: var(--text);
          text-align: right;
        }

        .msg-time {
          font-size: 0.4rem;
          color: var(--text-muted);
          margin-top: 4px;
          letter-spacing: 1px;
        }

        .message.user .msg-time { text-align: right; }

        /* CURSOR */
        .stream-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--accent);
          vertical-align: text-bottom;
          margin-left: 2px;
          animation: blink 0.7s step-end infinite;
          box-shadow: 0 0 6px var(--accent);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* INPUT */
        .input-zone {
          position: relative;
          z-index: 10;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
          background: rgba(4, 10, 15, 0.95);
          backdrop-filter: blur(10px);
        }

        .input-wrap {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          border: 1px solid var(--border);
          background: var(--surface);
          padding: 12px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-wrap:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-dim);
        }

        textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.6;
          resize: none;
          min-height: 24px;
          max-height: 140px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        textarea::placeholder { color: var(--text-muted); }

        .send-btn {
          width: 36px;
          height: 36px;
          background: var(--accent);
          border: none;
          color: #040a0f;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 16px var(--accent-glow);
        }

        .send-btn:hover:not(:disabled) {
          box-shadow: 0 0 28px var(--accent-glow);
        }

        .send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          box-shadow: none;
        }

        .input-hint {
          font-size: 0.42rem;
          color: var(--text-muted);
          margin-top: 8px;
          letter-spacing: 1px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .xenogen-sig {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.42rem;
          letter-spacing: 3px;
          color: var(--text-muted);
        }

        /* TYPING INDICATOR */
        .typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 14px 18px;
          background: rgba(8, 15, 24, 0.8);
          border: 1px solid var(--border);
          border-left: 2px solid var(--accent);
          width: fit-content;
        }

        .typing-dot {
          width: 5px;
          height: 5px;
          background: var(--accent);
          border-radius: 50%;
          animation: typingDot 1.2s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="arbi-mark">
            <div className="arbi-dot" />
          </div>
          <div>
            <div className="arbi-name">ARBI</div>
            <div className="arbi-sub">
              ARTIFICIAL BIOLOGICAL & RECONNAISSANCE INTELLIGENCE
            </div>
          </div>
        </div>

        <div className="stage-wrap">
          <button
            className="stage-btn"
            onClick={() => setShowStages(!showStages)}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: stageColor,
                boxShadow: `0 0 6px ${stageColor}`,
                display: "inline-block",
              }}
            />
            {STAGE_LABELS[currentStage]}
            <span style={{ opacity: 0.6 }}>{showStages ? "▲" : "▼"}</span>
          </button>

          {showStages && (
            <div className="stage-dropdown">
              {Object.entries(PATHWAY_STAGES).map(([key, value]) => (
                <div
                  key={value}
                  className={`stage-option ${currentStage === value ? "active" : ""}`}
                  onClick={() => {
                    setCurrentStage(value as PathwayStage);
                    setShowStages(false);
                  }}
                >
                  <span
                    className="stage-pip"
                    style={{
                      background: STAGE_COLORS[value as PathwayStage],
                      boxShadow: currentStage === value
                        ? `0 0 6px ${STAGE_COLORS[value as PathwayStage]}`
                        : "none",
                    }}
                  />
                  {STAGE_LABELS[value as PathwayStage]}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* PATHWAY BAR */}
      <nav className="pathway-bar">
        {Object.entries(PATHWAY_STAGES).map(([key, value], idx, arr) => (
          <div className="pathway-node" key={value}>
            <div
              className={`pnode ${currentStage === value ? "active" : ""}`}
              style={
                currentStage === value
                  ? { color: STAGE_COLORS[value as PathwayStage], borderBottomColor: STAGE_COLORS[value as PathwayStage] }
                  : {}
              }
              onClick={() => setCurrentStage(value as PathwayStage)}
            >
              {STAGE_LABELS[value as PathwayStage]}
            </div>
            {idx < arr.length - 1 && (
              <span className="pnode-sep">→</span>
            )}
          </div>
        ))}
      </nav>

      {/* MESSAGES */}
      <div className="messages-wrap">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className={`msg-avatar ${msg.role === "assistant" ? "arbi" : "user"}`}>
              {msg.role === "assistant" ? "AR" : "YOU"}
            </div>
            <div className="msg-content">
              <div className={`msg-role ${msg.role === "assistant" ? "arbi-role" : ""}`}>
                {msg.role === "assistant" ? "ARBI" : "You"}
              </div>
              <div className="msg-bubble">
                {msg.content}
                {isStreaming &&
                  idx === messages.length - 1 &&
                  msg.role === "assistant" && (
                    <span className="stream-cursor" />
                  )}
              </div>
              <div className="msg-time">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="message assistant">
            <div className="msg-avatar arbi">AR</div>
            <div className="msg-content">
              <div className="msg-role arbi-role">ARBI</div>
              <div className="typing">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="input-zone">
        <div className="input-wrap">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tell me where you are right now..."
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
          >
            ↑
          </button>
        </div>
        <div className="input-hint">
          <span>Enter to send · Shift+Enter for new line</span>
          <span className="xenogen-sig">XENOGENESIS</span>
        </div>
      </div>
    </div>
  );
}
