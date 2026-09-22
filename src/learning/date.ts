export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// The Date constructor's overflow handling gets DST shifts and month ends right;
// adding n * 86_400_000 milliseconds does not.
export const addDays = (d: Date, n: number): Date =>
  new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + n,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  );

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day, "YYYY-MM-DD" — never UTC, or a late-evening session lands on tomorrow. */
export const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const dayKeyToDate = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
