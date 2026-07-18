import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Summary.module.css";
import { Chip, Header, PrimaryButton, RuleCard, Screen } from "@/components/Primitives";
import { Mascot } from "@/components/Mascot";
import { summarizeSession } from "@/api/gabai";
import { colors } from "@/design/tokens";
import { useSession } from "@/state/session";

export function SummaryPage() {
  const navigate = useNavigate();
  const { results, questions, analysis, summary, setSummary, resetSession, settings } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const total = summary?.score.total ?? (results.length || questions.length);
  const correct = summary?.score.correct ?? results.filter((item) => item.correct).length;
  const weak = summary?.weak_areas ?? [];
  const passed = correct / Math.max(total, 1) >= 0.7;
  const topics = summary?.topics_covered ?? [...new Set(questions.map((q) => q.topic))];

  useEffect(() => {
    document.title = "Summary — GabAI";
  }, []);

  useEffect(() => {
    if (summary || results.length === 0) return;
    setLoading(true);
    summarizeSession(results, analysis?.dominant_language ?? "taglish", settings.language)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not generate summary."))
      .finally(() => setLoading(false));
  }, [analysis?.dominant_language, results, setSummary, settings.language, summary]);

  function home() {
    resetSession();
    navigate("/", { replace: true });
  }

  return (
    <Screen>
      <Header title="Summary" onBack={() => navigate("/", { replace: true })} />
      <div className={styles.body}>
        <RuleCard ruleColor={passed ? colors.moss : colors.inkSoft} className={styles.scoreCard}>
          <Mascot state="idle" size={76} />
          <p className={styles.score}>
            {correct} / {total}
          </p>
          <p className={styles.encouragement}>
            {loading
              ? "Generating your session summary..."
              : summary?.encouragement_message ?? "Summary will appear after your answers are evaluated."}
          </p>
        </RuleCard>
        {error ? (
          <RuleCard ruleColor={colors.flag} style={{ marginTop: 16 }}>
            <p className={styles.weakReason}>{error}</p>
          </RuleCard>
        ) : null}
        <p className={`t-section ${styles.sectionTitle}`}>Topics covered</p>
        <div className={styles.chips}>
          {topics.map((topic) => (
            <Chip key={topic} label={topic} />
          ))}
        </div>
        {weak.length ? (
          <>
            <p className={`t-section ${styles.sectionTitle}`}>Weak areas</p>
            <div className={styles.weakList}>
              {weak.map((item) => (
                <RuleCard key={`${item.topic}-${item.question_ids.join("-")}`} ruleColor={colors.rule}>
                  <p className={styles.weakTitle}>{item.topic}</p>
                  <p className={styles.weakReason}>{item.reason}</p>
                  {item.source_reference ? <p className={styles.sourceRef}>{item.source_reference}</p> : null}
                </RuleCard>
              ))}
            </div>
          </>
        ) : null}
        <div className={styles.buttons}>
          {weak.length ? (
            <PrimaryButton onClick={() => navigate("/session", { replace: true })} style={{ marginTop: 24 }}>
              Redo weak areas
            </PrimaryButton>
          ) : null}
          <PrimaryButton variant="secondary" onClick={() => navigate("/analyze", { replace: true })} style={{ marginTop: 12 }}>
            Start new session
          </PrimaryButton>
          <PrimaryButton variant="tertiary" onClick={home} style={{ marginTop: 8 }}>
            Back to home
          </PrimaryButton>
        </div>
      </div>
    </Screen>
  );
}
