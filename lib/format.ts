// lib/format.ts

//
// MONEY FORMATTER
//
export const money = (n: number | null | undefined) => {
  const value = Number(n ?? 0);
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

//
// PERCENT FORMATTER (expects a ratio 0–1, returns "37.45%")
//
export const pct = (n: number | null | undefined) => {
  const ratio = Number(n ?? 0);    // e.g. 0.3745
  const percent = ratio * 100;     // -> 37.45
  return `${percent.toFixed(2)}%`;
};

//
// OPTIONAL: COLOR FORMATTED PERCENT (green if positive, red if negative)
// Use for UI components where you want colored % values.
// Example usage:
//   <span className={pctColor(margin)}>{pct(margin)}</span>
//
export const pctColor = (n: number | null | undefined) => {
  const value = Number(n ?? 0);
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-slate-600";
};

//
// OPTIONAL: MONEY COLOR (positive green, negative red)
// Example:
//   <span className={moneyColor(gp)}>{money(gp)}</span>
//
export const moneyColor = (n: number | null | undefined) => {
  const value = Number(n ?? 0);
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-slate-900";
};
