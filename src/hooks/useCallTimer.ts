import { useEffect, useRef, useState } from "react";

export const useCallTimer = (startTimeUtc: string | null): string => {
  const [elapsed, setElapsed] = useState("00:00");
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (ref.current) { clearInterval(ref.current); ref.current = null; }
    if (!startTimeUtc) { setElapsed("00:00"); return; }

    // Ensure UTC is parsed correctly — append Z if no timezone info
    let normalized = startTimeUtc.trim();
    if (!normalized.endsWith("Z") && !normalized.includes("+")) {
      normalized = normalized.replace(" ", "T") + "Z";
    }
    const startMs = new Date(normalized).getTime();
    if (isNaN(startMs)) { setElapsed("00:00"); return; }

    console.log("[Timer] ✅ UTC start:", new Date(startMs).toISOString());

    const tick = () => {
      const s = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      setElapsed(h > 0
        ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
        : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`);
    };
    tick();
    ref.current = setInterval(tick, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startTimeUtc]);

  return elapsed;
};
