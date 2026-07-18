import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Chat.module.css";
import { Header, PrimaryButton, RuleCard, Screen } from "@/components/Primitives";
import { Mascot } from "@/components/Mascot";
import { quickChat } from "@/api/gabai";
import { useSession } from "@/state/session";

type Message = { role: "gabi" | "student"; text: string };

export function ChatPage() {
  const navigate = useNavigate();
  const { settings } = useSession();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "gabi",
      text: "Hi. Si Gabi 'to. Ask me in English, Filipino, or Taglish.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Quick chat — GabAI";
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const clean = text.trim();
    if (!clean || loading) return;
    setError("");
    setLoading(true);
    const history = messages.slice(1);
    setMessages((current) => [...current, { role: "student", text: clean }]);
    setText("");
    try {
      const response = await quickChat(clean, history, settings.language);
      setMessages((current) => [...current, { role: "gabi", text: response.response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={
        <form className={styles.composer} onSubmit={send}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ask Gabi..."
            className={styles.input}
            aria-label="Message"
          />
          <PrimaryButton type="submit" disabled={loading} className={styles.send}>
            {loading ? "..." : "Send"}
          </PrimaryButton>
        </form>
      }
    >
      <Header title="Quick chat" onBack={() => navigate(-1)} />
      <div className={styles.intro}>
        <Mascot state="idle" size={64} />
        <p className={styles.introText}>
          No upload needed. Gabi mirrors your language and starts with guidance when it looks like homework.
        </p>
      </div>
      <div className={styles.messages}>
        {messages.map((message, index) => {
          const mine = message.role === "student";
          return (
            <div key={`${message.role}-${index}`} className={`${styles.bubbleRow}${mine ? ` ${styles.bubbleRowMine}` : ""}`}>
              <p className={`${styles.bubble} ${mine ? styles.mine : styles.gabi}`}>{message.text}</p>
            </div>
          );
        })}
        {messages.length === 1 ? (
          <RuleCard style={{ marginTop: 16 }}>
            <p className={styles.error}>Type a question to start a real AI chat.</p>
          </RuleCard>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}
