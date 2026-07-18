import { useEffect } from "react";
import styles from "./SettingsSheet.module.css";
import { PrimaryButton } from "./Primitives";
import { useSession } from "@/state/session";

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSession();

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Settings">
      <button type="button" aria-label="Close settings" className={styles.scrim} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <h2 className={`t-title ${styles.title}`}>Settings</h2>
        <ToggleRow
          title="Voice feedback"
          detail="Speak feedback after each answer."
          value={settings.voiceOn}
          onChange={() => updateSettings({ voiceOn: !settings.voiceOn })}
        />
        <SegmentRow
          title="Voice speed"
          options={[
            ["normal", "Normal"],
            ["slow", "Slow"],
          ]}
          value={settings.voiceSpeed}
          onChange={(voiceSpeed) => updateSettings({ voiceSpeed })}
        />
        <SegmentRow
          title="Language"
          options={[
            ["auto", "Auto"],
            ["english", "English"],
            ["filipino", "Filipino"],
            ["taglish", "Taglish"],
          ]}
          value={settings.language}
          onChange={(language) => updateSettings({ language })}
        />
        <ToggleRow
          title="Reduce data usage"
          detail="Disables auto-play and keeps responses shorter."
          value={settings.reduceData}
          onChange={() => updateSettings({ reduceData: !settings.reduceData })}
        />
        <PrimaryButton variant="secondary" onClick={onClose} style={{ marginTop: 16 }}>
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}

function ToggleRow({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: () => void }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowBody}>
        <div className={styles.rowTitle}>{title}</div>
        <div className={styles.rowDetail}>{detail}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={title}
        onClick={onChange}
        className={`${styles.toggle}${value ? ` ${styles.toggleOn}` : ""}`}
      >
        <span className={`${styles.knob}${value ? ` ${styles.knobOn}` : ""}`} />
      </button>
    </div>
  );
}

function SegmentRow<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.segmentBlock}>
      <div className={styles.rowTitle}>{title}</div>
      <div className={styles.segment} role="radiogroup" aria-label={title}>
        {options.map(([key, label]) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(key)}
              className={`${styles.segmentItem}${active ? ` ${styles.segmentActive}` : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
