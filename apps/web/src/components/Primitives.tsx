import { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import styles from "./Primitives.module.css";
import { colors } from "@/design/tokens";

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className={styles.screen}>
      <div className={styles.phone}>
        <main className={styles.content}>{children}</main>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Header({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  return (
    <header className={styles.header}>
      {onBack ? (
        <button type="button" aria-label="Back" onClick={onBack} className={styles.iconButton}>
          ‹
        </button>
      ) : null}
      <h1 className={`t-title ${styles.headerTitle}`}>{title}</h1>
      <div className={styles.headerAction}>{action}</div>
    </header>
  );
}

export function RuleCard({
  children,
  active,
  ruleColor,
  className,
  style,
}: {
  children: ReactNode;
  active?: boolean;
  ruleColor?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const cardRule = ruleColor ?? (active ? colors.ember : colors.rule);
  return (
    <div
      className={`${styles.card}${className ? ` ${className}` : ""}`}
      style={{ "--card-rule": cardRule, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: "primary" | "secondary" | "tertiary" }) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Caption({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span className={`t-caption ${styles.caption}${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </span>
  );
}

export function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className={`${styles.chip}${onRemove ? "" : ` ${styles.chipNoRemove}`}`}>
      <span className={styles.chipText}>{label}</span>
      {onRemove ? (
        <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className={styles.chipRemove}>
          ×
        </button>
      ) : null}
    </span>
  );
}
