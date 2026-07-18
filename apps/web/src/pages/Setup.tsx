import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Setup.module.css";
import { Header, PrimaryButton, Screen } from "@/components/Primitives";
import { generateQuestions } from "@/api/gabai";
import { useSession } from "@/state/session";
import { exerciseTypeSchema, type CustomReviewer, type Difficulty, type ExerciseType } from "@gabai/shared";

const allTypes = exerciseTypeSchema.options;
const difficulties: Array<{ value: Difficulty | null; label: string }> = [
  { value: null, label: "Auto" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function SetupPage() {
  const navigate = useNavigate();
  const {
    sourceId,
    analysis,
    selectedTypes,
    setSelectedTypes,
    questionCount,
    setQuestionCount,
    customizer,
    updateCustomizer,
    setQuestions,
    settings,
  } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const keyTopics = analysis?.key_topics ?? [];
  const mixActive = customizer.enabled && customizer.typeMix !== null;
  const mixEntries = mixActive
    ? selectedTypes
        .map((type) => ({ type, count: customizer.typeMix?.[type] ?? 0 }))
        .filter((entry) => entry.count > 0)
    : [];
  const mixTotal = mixEntries.reduce((sum, entry) => sum + entry.count, 0);
  const mixInvalid = mixActive && (mixTotal < 5 || mixTotal > 15);
  const disabled = selectedTypes.length === 0 || !sourceId || loading || mixInvalid;

  useEffect(() => {
    document.title = "Ihanda ang review — GabAI";
  }, []);

  function toggleFocusTopic(topic: string) {
    updateCustomizer({
      focusTopics: customizer.focusTopics.includes(topic)
        ? customizer.focusTopics.filter((item) => item !== topic)
        : [...customizer.focusTopics, topic],
    });
  }

  function toggleMix() {
    if (customizer.typeMix) {
      updateCustomizer({ typeMix: null });
      return;
    }
    const perType = Math.max(1, Math.floor(questionCount / Math.max(selectedTypes.length, 1)));
    const initial: Partial<Record<ExerciseType, number>> = {};
    for (const type of selectedTypes) initial[type] = perType;
    updateCustomizer({ typeMix: initial });
  }

  function stepMix(type: ExerciseType, delta: number) {
    const current = customizer.typeMix?.[type] ?? 0;
    updateCustomizer({
      typeMix: { ...customizer.typeMix, [type]: Math.max(0, Math.min(15, current + delta)) },
    });
  }

  function buildCustom(): CustomReviewer | undefined {
    if (!customizer.enabled) return undefined;
    const instructions = customizer.instructions.trim();
    return {
      focusTopics: customizer.focusTopics,
      difficulty: customizer.difficulty ?? undefined,
      instructions: instructions ? instructions : undefined,
      typeMix: mixEntries.length > 0 ? mixEntries : undefined,
    };
  }

  async function startReview() {
    if (!sourceId || selectedTypes.length === 0) return;
    setError("");
    setLoading(true);
    try {
      const response = await generateQuestions(
        sourceId,
        selectedTypes,
        questionCount,
        settings.language,
        buildCustom(),
      );
      setQuestions(response.questions);
      navigate("/session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={
        <PrimaryButton disabled={disabled} onClick={startReview} style={{ width: "100%" }}>
          {loading ? "Generating..." : "Start review"}
        </PrimaryButton>
      }
    >
      <Header title="Ihanda ang review" onBack={() => navigate(-1)} />
      <span className={`t-caption ${styles.label}`}>Question types</span>
      {!sourceId ? <p className={styles.empty}>Choose a source before starting a review.</p> : null}
      {selectedTypes.length === 0 && sourceId && !loading ? (
        <p className={styles.empty}>Pick at least one question type to continue.</p>
      ) : null}
      <div className={styles.chips}>
        {allTypes.map((typeName) => {
          const selected = selectedTypes.includes(typeName);
          return (
            <button
              key={typeName}
              type="button"
              aria-pressed={selected}
              className={`${styles.typeChip}${selected ? ` ${styles.typeChipSelected}` : ""}`}
              onClick={() =>
                setSelectedTypes(
                  selected
                    ? selectedTypes.filter((item) => item !== typeName)
                    : [...selectedTypes, typeName],
                )
              }
            >
              {typeName.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>
      {!mixActive ? (
        <>
          <span className={`t-caption ${styles.label}`}>Question count</span>
          <div className={styles.segment}>
            {[5, 10, 15].map((count) => {
              const active = count === questionCount;
              return (
                <PrimaryButton
                  key={count}
                  variant={active ? "primary" : "tertiary"}
                  onClick={() => setQuestionCount(count)}
                  className={`${styles.countButton}${active ? ` ${styles.countActive}` : ""}`}
                >
                  {count}
                </PrimaryButton>
              );
            })}
          </div>
        </>
      ) : null}
      <button
        type="button"
        aria-pressed={customizer.enabled}
        className={`${styles.typeChip} ${styles.customToggle}${customizer.enabled ? ` ${styles.typeChipSelected}` : ""}`}
        onClick={() => updateCustomizer({ enabled: !customizer.enabled })}
      >
        Customize reviewer
      </button>
      {customizer.enabled ? (
        <div className={styles.customSection}>
          {keyTopics.length > 0 ? (
            <>
              <span className={`t-caption ${styles.label}`}>Focus topics</span>
              <p className={styles.help}>Pick topics to focus on. None selected means the whole material.</p>
              <div className={styles.chips}>
                {keyTopics.map((topic) => {
                  const selected = customizer.focusTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      aria-pressed={selected}
                      className={`${styles.typeChip}${selected ? ` ${styles.typeChipSelected}` : ""}`}
                      onClick={() => toggleFocusTopic(topic)}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
          <span className={`t-caption ${styles.label}`}>Difficulty</span>
          <div className={styles.segment}>
            {difficulties.map(({ value, label }) => {
              const active = value === customizer.difficulty;
              return (
                <PrimaryButton
                  key={label}
                  variant={active ? "primary" : "tertiary"}
                  onClick={() => updateCustomizer({ difficulty: value })}
                  className={`${styles.countButton}${active ? ` ${styles.countActive}` : ""}`}
                >
                  {label}
                </PrimaryButton>
              );
            })}
          </div>
          <span className={`t-caption ${styles.label}`}>Question mix</span>
          <button
            type="button"
            aria-pressed={mixActive}
            className={`${styles.typeChip}${mixActive ? ` ${styles.typeChipSelected}` : ""}`}
            onClick={toggleMix}
            disabled={selectedTypes.length === 0}
          >
            Set counts per type
          </button>
          {mixActive ? (
            <div className={styles.mixList}>
              {selectedTypes.map((type) => (
                <div key={type} className={styles.mixRow}>
                  <span className={styles.mixLabel}>{type.replace(/_/g, " ")}</span>
                  <div className={styles.stepper}>
                    <button type="button" className={styles.stepButton} onClick={() => stepMix(type, -1)}>
                      −
                    </button>
                    <span className={styles.stepValue}>{customizer.typeMix?.[type] ?? 0}</span>
                    <button type="button" className={styles.stepButton} onClick={() => stepMix(type, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
              <p className={mixInvalid ? styles.empty : styles.help}>
                Total: {mixTotal} question{mixTotal === 1 ? "" : "s"} (must be 5–15)
              </p>
            </div>
          ) : null}
          <span className={`t-caption ${styles.label}`}>Instructions for Gabi</span>
          <textarea
            value={customizer.instructions}
            maxLength={500}
            onChange={(event) => updateCustomizer({ instructions: event.target.value })}
            placeholder="e.g. Focus on dates and definitions"
            className={styles.instructionsInput}
          />
        </div>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.note}>Questions will be generated from your uploaded or pasted material.</p>
    </Screen>
  );
}
