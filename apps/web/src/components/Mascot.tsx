import { useState } from "react";
import styles from "./Mascot.module.css";
import idleVideo from "@/assets/gabi-idle.mp4";
import workingVideo from "@/assets/gabi-working.mp4";
import fallback from "@/assets/gabi-avatar.png";

export function Mascot({ state = "idle", size = 92 }: { state?: "idle" | "working"; size?: number }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const source = state === "working" ? workingVideo : idleVideo;

  return (
    <div className={styles.wrap} style={{ width: size, height: size }} role="img" aria-label="Gabi">
      {videoFailed ? (
        <img src={fallback} alt="" className={styles.fallback} />
      ) : (
        <video
          key={source}
          className={styles.video}
          src={source}
          autoPlay
          muted
          loop
          playsInline
          poster={fallback}
          onError={() => setVideoFailed(true)}
        />
      )}
    </div>
  );
}
