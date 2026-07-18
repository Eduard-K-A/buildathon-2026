import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Analyze.module.css";
import { Caption, Header, PrimaryButton, RuleCard, Screen } from "@/components/Primitives";
import { Mascot } from "@/components/Mascot";
import { analyzeSource } from "@/api/gabai";
import { colors } from "@/design/tokens";
import { useSession } from "@/state/session";

const labels = ["Reading your material...", "Finding the topic...", "Preparing recommendations..."];
const DEBUG_ANALYZE = import.meta.env.DEV;
const ANALYZE_TIMEOUT_MS = 45_000;

export function AnalyzePage() {
  const navigate = useNavigate();
  const { sourceId, analysis, selectedTypes, setAnalysis, setSelectedTypes, toggleType } = useSession();
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Pagsusuri — GabAI";
  }, []);

  useEffect(() => {
    if (!sourceId) {
      logAnalyze("missing sourceId");
      setError("Choose a source before analyzing.");
      setPhase(3);
      return;
    }

    let active = true;
    setError("");
    setPhase(0);
    const timers = [
      setTimeout(() => {
        if (active) setPhase(1);
      }, 850),
      setTimeout(() => {
        if (active) setPhase(2);
      }, 1700),
    ];
    const timeout = setTimeout(() => {
      if (!active) return;
      logAnalyze("timeout", { sourceId, timeoutMs: ANALYZE_TIMEOUT_MS });
      setError("Analysis is taking too long. Check the server logs, then try again.");
      setPhase(3);
      active = false;
    }, ANALYZE_TIMEOUT_MS);

    logAnalyze("start", { sourceId });
    analyzeSource(sourceId)
      .then((nextAnalysis) => {
        if (!active) return;
        clearTimeout(timeout);
        logAnalyze("success", {
          sourceId,
          subject: nextAnalysis.subject,
          topic: nextAnalysis.detected_topic,
          recommendedTypes: nextAnalysis.suggested_exercise_types.map((item) => item.type),
        });
        setAnalysis(nextAnalysis);
        setSelectedTypes(nextAnalysis.suggested_exercise_types.map((item) => item.type));
        setPhase(3);
        navigate("/setup", { replace: true });
      })
      .catch((err) => {
        if (!active) return;
        clearTimeout(timeout);
        logAnalyze("error", {
          sourceId,
          message: err instanceof Error ? err.message : String(err),
          error: err,
        });
        setError(err instanceof Error ? err.message : "Analysis failed.");
        setPhase(3);
      });
    return () => {
      logAnalyze("cleanup", { sourceId });
      active = false;
      timers.forEach(clearTimeout);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, setAnalysis, setSelectedTypes]);

  const done = phase >= 3;
  const canCreate = done && Boolean(analysis) && selectedTypes.length > 0;

  return (
    <Screen
      footer={
        done ? (
          <PrimaryButton disabled={!canCreate} onClick={() => navigate("/setup")} style={{ width: "100%" }}>
            Create practice
          </PrimaryButton>
        ) : undefined
      }
    >
      <Header title="Pagsusuri" onBack={() => navigate(-1)} />
      {!done ? (
        <RuleCard active className={styles.loadingCard}>
          <Mascot state="working" size={112} />
          <p className={`t-title ${styles.loadingLabel}`}>{labels[phase]}</p>
        </RuleCard>
      ) : error ? (
        <RuleCard ruleColor={colors.flag}>
          <p className={styles.error}>{error}</p>
          <PrimaryButton variant="secondary" onClick={() => navigate("/", { replace: true })} style={{ marginTop: 12 }}>
            Back to source
          </PrimaryButton>
        </RuleCard>
      ) : analysis ? (
        <div>
          <RuleCard>
            <Row label="Subject" value={analysis.subject} />
            <Row label="Topic" value={analysis.detected_topic} />
            <Row label="Level" value={analysis.detected_grade_level} />
            <Row label="Language" value={analysis.dominant_language} last />
          </RuleCard>
          <p className={`t-section ${styles.sectionTitle}`}>Choose practice types</p>
          <p className={styles.help}>Pick one or more. Gabi recommends these for the material.</p>
          <div className={styles.recommendations}>
            {analysis.suggested_exercise_types.map((item) => {
              const active = selectedTypes.includes(item.type);
              return (
                <RuleCard key={item.type} active={active} className={styles.recommendation}>
                  <p className={styles.cardTitle}>{labelForType(item.type)}</p>
                  <p className={styles.cardCopy}>{item.reason}</p>
                  <PrimaryButton
                    variant={active ? "primary" : "secondary"}
                    onClick={() => toggleType(item.type)}
                    className={styles.smallButton}
                  >
                    {active ? "Selected" : "Select"}
                  </PrimaryButton>
                </RuleCard>
              );
            })}
          </div>
        </div>
      ) : null}
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <p className={`${styles.row}${last ? "" : ` ${styles.rowBorder}`}`}>
      <Caption>{label}</Caption>
      <span className={styles.rowValue}> {value}</span>
    </p>
  );
}

function labelForType(typeName: string) {
  return typeName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function logAnalyze(event: string, details?: unknown) {
  if (!DEBUG_ANALYZE) return;
  console.log(`[Pagsusuri] ${event}`, details ?? "");
}
