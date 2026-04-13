// Safe date parse — never creates timezone offset
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Format: "2026-04-01" → "Apr 01, 2026"
export const fmtDate = (raw: string): string => {
  if (!raw) return "N/A";
  const d = parseLocalDate(raw);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "2-digit", year: "numeric"
  });
};

// Format: "09:00" → "09:00 AM"
export const fmtTime = (raw: string): string => {
  if (!raw || raw === "N/A") return raw;
  const [h, m] = raw.split(":").map(Number);
  const s = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${String(m).padStart(2, "0")} ${s}`;
};

// "YYYY-MM-DD" local string — no UTC shift
export const todayLocalStr = (): string => {
  const d = new Date();
  return [d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, "0"),
  String(d.getDate()).padStart(2, "0")].join("-");
};

// "Today" | "Tomorrow" | formatted date string
export const dateBadge = (dateStr: string): string => {
  const today = todayLocalStr();
  const t = new Date(); t.setDate(t.getDate() + 1);
  const tomorrow = [t.getFullYear(),
  String(t.getMonth() + 1).padStart(2, "0"),
  String(t.getDate()).padStart(2, "0")].join("-");
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return fmtDate(dateStr);
};

// Sort appointments ascending by date then time
export const sortAscending = <T extends { date: string; time: string }>(
  arr: T[]
): T[] =>
  [...arr].sort((a, b) =>
    a.date === b.date
      ? a.time.localeCompare(b.time)
      : a.date.localeCompare(b.date)
  );

// Group appointments by date key
export const groupByDate = <T extends { date: string }>(
  arr: T[]
): Record<string, T[]> =>
  arr.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.date ?? "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
