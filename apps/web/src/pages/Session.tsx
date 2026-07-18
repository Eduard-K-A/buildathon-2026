import type { TutorTurnResult } from "@gabai/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Session.module.css";
import { Caption, Header, PrimaryButton, RuleCard, Screen } from "@/components/Primitives";
import { submitTutorTurn, transcribeAudio } from "@/api/gabai";
import { colors } from "@/design/tokens";
import { Recorder, recordingSupported } from "@/lib/recorder";
import { speak, speechSupported, stopSpeaking } from "@/lib/speech";
import { useSession } from "@/state/session";

type Phase = "answering" | "hint" | "correct" | "revealed";

export function SessionPage() {
  const navigate = useNavigate();
  const { questions, addResult, settings } = useSession();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [toneBadge, setToneBadge] = useState("");
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "preview">("idle");
  const [transcript, setTranscript] = useState("");
  const [tutorResult, setTutorResult] = useState<TutorTurnResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<Recorder | null>(null);

  const question = questions[index];
  const complete = phase === "correct" || phase === "revealed";
  const progress = Math.round(((index + (complete ? 1 : 0)) / Math.max(questions.length, 1)) * 100);

  useEffect(() => {
    document.title = "Practice — GabAI";
    return () => {
      stopSpeaking();
      recorderRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (voiceState === "recording") {
      timer = setInterval(() => {
        setSeconds((current) => {
          if (current >= 29) {
            void stopRecording();
            return 30;
          }
          return current + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceState]);

  const feedbackText = useMemo(() => {
    if (!tutorResult) return "";
    if (phase === "correct" || phase === "hint" || phase === "revealed") return tutorResult.feedback_text;
    return "";
  }, [phase, tutorResult]);

  useEffect(() => {
    if (!feedbackText || !settings.voiceOn || settings.reduceData) return;
    speak(feedbackText, {
      language: settings.language,
      speed: settings.voiceSpeed === "slow" || toneBadge ? "slow" : "normal",
    });
    return () => {
      stopSpeaking();
    };
  }, [feedbackText, settings.language, settings.voiceOn, settings.reduceData, settings.voiceSpeed, toneBadge]);

  function speakQuestion() {
    if (!question) return;
    stopSpeaking();
    speak(question.prompt, {
      language: settings.language,
      speed: settings.voiceSpeed,
    });
  }

  async function submit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await submitTutorTurn({
        question,
        studentAnswerText: answer,
        attemptNumber: attempts + 1,
        languagePreference: settings.language,
      });
      setTutorResult(result);
      setToneBadge(result.tone_badge_text ?? "");
      if (result.is_correct) {
        setPhase("correct");
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setPhase(result.reveal_answer ? "revealed" : "hint");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check your answer.");
    } finally {
      setSubmitting(false);
    }
  }

  function next(correct: boolean, skipped = false) {
    addResult({
      questionId: question.id,
      topic: question.topic,
      correct,
      attempts: correct ? attempts + 1 : attempts,
      skipped,
      source_reference: question.source_reference,
      detected_tone: tutorResult?.detected_tone,
    });
    if (index + 1 >= questions.length) {
      navigate("/summary", { replace: true });
      return;
    }
    setIndex(index + 1);
    setAnswer("");
    setAttempts(0);
    setPhase("answering");
    setToneBadge("");
    setVoiceState("idle");
    setTranscript("");
    setTutorResult(null);
    setError("");
    setSeconds(0);
  }

  async function startRecording() {
    setError("");
    setTranscript("");
    if (!recordingSupported()) {
      setError("Voice answers are not supported in this browser.");
      return;
    }
    try {
      const recorder = new Recorder();
      await recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setVoiceState("recording");
    } catch {
      setError("Microphone permission is required for voice answers.");
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setVoiceState("preview");
    setError("");
    try {
      const result = await recorder.stop();
      recorderRef.current = null;
      const response = await transcribeAudio(result.blob, result.filename);
      setTranscript(response.transcript);
    } catch (err) {
      recorderRef.current = null;
      setVoiceState("idle");
      setError(err instanceof Error ? err.message : "Could not transcribe your answer.");
    }
  }

  if (!question) {
    return (
      <Screen>
        <Header
          title=""
          action={
            <PrimaryButton variant="tertiary" onClick={() => navigate("/", { replace: true })}>
              Home
            </PrimaryButton>
          }
        />
        <RuleCard ruleColor={colors.flag}>
          <p className={styles.feedbackText}>Generate questions before starting a review.</p>
        </RuleCard>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        complete ? (
          <PrimaryButton onClick={() => next(phase === "correct")} style={{ width: "100%" }}>
            {index + 1 >= questions.length ? "See summary" : "Next question"}
          </PrimaryButton>
        ) : (
          <div className={styles.footerRow}>
            <PrimaryButton variant="tertiary" onClick={startRecording} className={styles.micButton}>
              Mic
            </PrimaryButton>
            <PrimaryButton disabled={submitting} onClick={submit} className={styles.footerGrow}>
              {submitting ? "Checking..." : "Submit"}
            </PrimaryButton>
            <PrimaryButton variant="tertiary" onClick={() => next(false, true)} className={styles.skipButton}>
              Skip
            </PrimaryButton>
          </div>
        )
      }
    >
      <Header
        title=""
        action={
          <PrimaryButton variant="tertiary" onClick={() => navigate("/summary", { replace: true })}>
            End
          </PrimaryButton>
        }
      />
      <Caption>
        Question {index + 1} of {questions.length}
      </Caption>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      {toneBadge ? (
        <div className={styles.toneBadge}>
          <span className={styles.toneText}>{toneBadge}</span>
        </div>
      ) : null}
      <div className={`${styles.body} ${styles.wide}`}>
        <RuleCard active ruleColor={ruleForPhase(phase)} className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <Caption>{question.type.replace(/_/g, " ")}</Caption>
            <button
              type="button"
              aria-label="Read question aloud"
              onClick={speakQuestion}
              disabled={!speechSupported()}
              className={styles.speakerButton}
            >
              ▶
            </button>
          </div>
          <p className={`t-question ${styles.prompt}`}>{question.prompt}</p>
          {question.source_reference ? (
            <div>
              <span className={styles.sourcePill}>
                <span className={styles.sourceText}>Based on your notes</span>
              </span>
            </div>
          ) : null}
        </RuleCard>
        <div>
          {voiceState === "recording" ? (
            <RuleCard ruleColor={colors.ember} className={`${styles.voiceCard} ${styles.wideHead}`}>
              <div className={styles.recordDot} />
              <span className={styles.voiceLabel}>Listening... 0:{String(seconds).padStart(2, "0")}</span>
              <PrimaryButton onClick={stopRecording}>Stop</PrimaryButton>
            </RuleCard>
          ) : null}
          {voiceState === "preview" ? (
            <RuleCard ruleColor={colors.ember} style={{ marginTop: 12 }}>
              <Caption>Transcript</Caption>
              <p className={styles.feedbackText}>{transcript || "Transcribing..."}</p>
              <div className={styles.footerRow} style={{ marginTop: 12 }}>
                <PrimaryButton variant="tertiary" onClick={startRecording} className={styles.footerGrow}>
                  Retake
                </PrimaryButton>
                <PrimaryButton
                  variant="secondary"
                  disabled={!transcript}
                  onClick={() => {
                    setAnswer(transcript);
                    setVoiceState("idle");
                  }}
                  className={styles.footerGrow}
                >
                  Use this answer
                </PrimaryButton>
              </div>
            </RuleCard>
          ) : null}
          {voiceState === "idle" ? (
            question.choices ? (
              <div className={styles.options}>
                {question.choices.map((choice, optionIndex) => {
                  const selected = answer === choice;
                  const correct = complete && choice === question.correct_answer;
                  const wrong = phase === "revealed" && selected && !correct;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setAnswer(choice)}
                      disabled={complete}
                      className={[
                        styles.option,
                        selected ? styles.optionSelected : "",
                        correct ? styles.optionCorrect : "",
                        wrong ? styles.optionWrong : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className={`${styles.optionLetter}${selected ? ` ${styles.optionLetterSelected}` : ""}`}>
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className={styles.optionText}>{choice}</span>
                      {correct ? <span className={styles.correctMark}>✓</span> : null}
                      {wrong ? <span className={styles.wrongMark}>×</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer in your own words..."
                className={styles.answerInput}
              />
            )
          ) : null}
          {phase === "hint" ? (
            <Feedback
              title="Socratic hint"
              text={tutorResult?.hint_text ?? feedbackText}
              actionLabel="Try again"
              onAction={() => setPhase("answering")}
            />
          ) : null}
          {phase === "correct" ? <Feedback title="Correct" text={feedbackText} /> : null}
          {phase === "revealed" ? (
            <Feedback title={`Answer: ${question.correct_answer}`} text={feedbackText || question.explanation} neutral />
          ) : null}
          {error ? (
            <RuleCard ruleColor={colors.flag} className={styles.feedback}>
              <p className={styles.feedbackText}>{error}</p>
            </RuleCard>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}

function Feedback({
  title,
  text,
  actionLabel,
  onAction,
  neutral,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  neutral?: boolean;
}) {
  return (
    <RuleCard ruleColor={neutral ? colors.inkSoft : colors.moss} className={styles.feedback}>
      <p className={styles.feedbackTitle}>{title}</p>
      <p className={styles.feedbackText}>{text}</p>
      {actionLabel ? (
        <PrimaryButton variant="secondary" onClick={onAction} style={{ marginTop: 12 }}>
          {actionLabel}
        </PrimaryButton>
      ) : null}
    </RuleCard>
  );
}

function ruleForPhase(phase: Phase) {
  if (phase === "correct") return colors.moss;
  if (phase === "hint") return colors.flag;
  if (phase === "revealed") return colors.inkSoft;
  return colors.ember;
}
