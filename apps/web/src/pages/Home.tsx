import { DragEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Home.module.css";
import { Caption, Header, PrimaryButton, RuleCard, Screen } from "@/components/Primitives";
import { Mascot } from "@/components/Mascot";
import { SettingsSheet } from "@/components/SettingsSheet";
import { createTextSource, uploadSource } from "@/api/gabai";
import { colors } from "@/design/tokens";
import { useSession } from "@/state/session";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function HomePage() {
  const navigate = useNavigate();
  const { setSource } = useSession();
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = inputMode === "upload" ? Boolean(fileName) : pasteText.trim().length > 0;

  useEffect(() => {
    document.title = "GabAI";
  }, []);

  async function handleFile(file: File) {
    setError("");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("GabAI reads PDFs only for now. Try pasting the text instead.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is over 10 MB. Try a shorter section or paste the text directly.");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    try {
      const source = await uploadSource(file);
      setSource(source.sourceId, source.preview);
    } catch (err) {
      setFileName("");
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  async function analyze() {
    if (!hasContent) return;
    setError("");
    setLoading(true);
    try {
      if (inputMode === "paste") {
        const source = await createTextSource(pasteText);
        setSource(source.sourceId, source.preview);
      }
      navigate("/analyze");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare your source.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header
        title="GabAI"
        action={
          <button
            type="button"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
            className={styles.settingsButton}
          >
            ☰
          </button>
        }
      />
      <div className={styles.hero}>
        <Mascot state={hasContent ? "working" : "idle"} size={72} />
        <div className={styles.heroBody}>
          <p className={`t-title ${styles.subtitle}`}>Turn your notes into a guided review.</p>
          <p className={styles.heroCopy}>Upload a PDF or paste text. Gabi keeps it text-first for low bandwidth.</p>
        </div>
      </div>
      <RuleCard active={hasContent} ruleColor={error ? colors.flag : hasContent ? colors.ember : colors.rule}>
        <div className={styles.tabs}>
          <Tab label="Upload PDF" active={inputMode === "upload"} onClick={() => setInputMode("upload")} />
          <Tab label="Paste text" active={inputMode === "paste"} onClick={() => setInputMode("paste")} />
        </div>
        {inputMode === "upload" ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={[
                styles.dropzone,
                fileName ? styles.dropzoneFilled : "",
                dragging ? styles.dropzoneDragging : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.fileIcon}>▱</span>
              <span className={styles.dropTitle}>{fileName || "Choose a PDF"}</span>
              <Caption>{fileName ? "Ready to analyze" : "MAX 10 MB"}</Caption>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className={styles.hiddenInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
          </>
        ) : (
          <textarea
            value={pasteText}
            onChange={(event) => {
              setError("");
              setPasteText(event.target.value);
            }}
            placeholder="Paste your notes here..."
            className={styles.textarea}
          />
        )}
        {error ? <p className={styles.error}>{error}</p> : null}
      </RuleCard>
      <div className={styles.actions}>
        <PrimaryButton disabled={!hasContent || loading} onClick={analyze} style={{ marginTop: 16 }}>
          {loading ? "Preparing..." : "Analyze"}
        </PrimaryButton>
        <PrimaryButton variant="tertiary" onClick={() => navigate("/chat")} style={{ marginTop: 8 }}>
          Just ask a question instead
        </PrimaryButton>
      </div>
      <div className={styles.privacy}>
        <p className={styles.privacyText}>Your content is only used during this session and deleted after.</p>
      </div>
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Screen>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.tab}${active ? ` ${styles.tabActive}` : ""}`}>
      {label}
    </button>
  );
}
