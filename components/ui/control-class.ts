/**
 * What a form control looks like, written once.
 *
 * `components/ui/input.tsx` is the real definition — this mirrors its height,
 * radius, border and padding so that a native `<select>` or `<textarea>`, which
 * cannot use that component, still sits correctly in a row beside one.
 *
 * It lives here rather than in either surface because both need it and they
 * needed the same thing: the hotel portal had 36 px selects beside 32 px inputs,
 * and the backoffice had `h-10 rounded-xl` fields beside `h-8 rounded-lg` ones.
 * Two definitions of "a control" is how a form ends up with three heights.
 *
 * The metrics come from shadcn rather than from the brand tokens on purpose.
 * Those control tokens are shared with everything else the app renders, so
 * moving them is a change to the whole application, not to one surface.
 */
export const controlClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 " +
  "text-sm text-[var(--wt-ink)] outline-none transition-colors " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

/** The same control, for a `<textarea>`: everything but the fixed height. */
export const controlMultilineClassName =
  "min-h-20 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 " +
  "text-sm text-[var(--wt-ink)] outline-none transition-colors " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";
