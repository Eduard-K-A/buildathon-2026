import type { Difficulty, DocumentAnalysis, ExerciseType, PracticeQuestion, SessionSummary, ToneState } from "@gabai/shared";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type Settings = {
  voiceOn: boolean;
  voiceSpeed: "normal" | "slow";
  language: "auto" | "english" | "filipino" | "taglish";
  reduceData: boolean;
};

type Result = {
  questionId: string;
  topic: string;
  correct: boolean;
  attempts: number;
  skipped: boolean;
  source_reference: string | null;
  detected_tone?: ToneState;
};

export type Customizer = {
  enabled: boolean;
  focusTopics: string[];
  difficulty: Difficulty | null;
  typeMix: Partial<Record<ExerciseType, number>> | null;
  instructions: string;
};

const defaultCustomizer: Customizer = {
  enabled: false,
  focusTopics: [],
  difficulty: null,
  typeMix: null,
  instructions: "",
};

type SessionContextValue = {
  sourceId: string | null;
  sourcePreview: string;
  analysis: DocumentAnalysis | null;
  questions: PracticeQuestion[];
  summary: SessionSummary | null;
  selectedTypes: ExerciseType[];
  questionCount: number;
  customizer: Customizer;
  results: Result[];
  settings: Settings;
  setSource: (sourceId: string, preview: string) => void;
  setAnalysis: (analysis: DocumentAnalysis | null) => void;
  setQuestions: (questions: PracticeQuestion[]) => void;
  setSummary: (summary: SessionSummary | null) => void;
  setSelectedTypes: (types: ExerciseType[]) => void;
  toggleType: (type: ExerciseType) => void;
  setQuestionCount: (count: number) => void;
  updateCustomizer: (patch: Partial<Customizer>) => void;
  resetSession: () => void;
  addResult: (result: Result) => void;
  updateSettings: (settings: Partial<Settings>) => void;
};

const SETTINGS_KEY = "gabai-settings";

const defaultSettings: Settings = {
  voiceOn: true,
  voiceSpeed: "normal",
  language: "auto",
  reduceData: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt or unavailable storage
  }
  return defaultSettings;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<ExerciseType[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [customizer, setCustomizer] = useState<Customizer>(defaultCustomizer);
  const [results, setResults] = useState<Result[]>([]);
  const [settings, setSettings] = useState(loadSettings);

  const value = useMemo<SessionContextValue>(
    () => ({
      sourceId,
      sourcePreview,
      analysis,
      questions,
      summary,
      selectedTypes,
      questionCount,
      customizer,
      results,
      settings,
      setSource: (nextSourceId, preview) => {
        setSourceId(nextSourceId);
        setSourcePreview(preview);
        setAnalysis(null);
        setQuestions([]);
        setSummary(null);
        setResults([]);
        setCustomizer(defaultCustomizer);
      },
      setAnalysis,
      setQuestions,
      setSummary,
      setSelectedTypes,
      toggleType: (type) => {
        setSelectedTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
      },
      setQuestionCount,
      updateCustomizer: (patch) => setCustomizer((current) => ({ ...current, ...patch })),
      resetSession: () => {
        setSourceId(null);
        setSourcePreview("");
        setAnalysis(null);
        setQuestions([]);
        setSummary(null);
        setSelectedTypes([]);
        setQuestionCount(10);
        setCustomizer(defaultCustomizer);
        setResults([]);
      },
      addResult: (result) => setResults((current) => [...current, result]),
      updateSettings: (patch) => {
        setSettings((current) => {
          const next = { ...current, ...patch };
          try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
          } catch {
            // storage unavailable (private mode) — keep in-memory settings
          }
          return next;
        });
      },
    }),
    [sourceId, sourcePreview, analysis, questions, summary, selectedTypes, questionCount, customizer, results, settings],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
