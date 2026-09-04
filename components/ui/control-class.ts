/**
 * What a form control looks like, written once.
 *
 * This used to be a hand-copy of `components/ui/input.tsx`, kept in step by
 * hand, and it had already drifted: the copy said `text-sm` where the original
 * says `text-base md:text-sm`, so a native `<select>` beside an `<Input>` was
 * 14 px on a phone against the Input's 16 px — and under 16 px iOS zooms the
 * page when the field takes focus. It was also missing the placeholder,
 * invalid and disabled-background rules entirely.
 *
 * So the direction is inverted. This file is the definition; `input.tsx` and
 * `textarea.tsx` consume it, and a native `<select>`, `<textarea>` or `<input>`
 * that cannot use those components takes the same string. There is no copy left
 * to drift.
 *
 * The metrics come from shadcn rather than from the brand tokens on purpose.
 * Those control tokens are shared with everything else the app renders, so
 * moving them is a change to the whole application, not to one surface. For the
 * same reason the colour is `text-inherit`: the control takes the ink of the
 * surface it is dropped into, so one string works under both `data-surface`
 * themes without naming either.
 */
// 16 px on a phone, 14 px from `md` up. The first half is not a style choice:
// iOS zooms into any field whose text is under 16 px when it takes focus.
const controlTypeClassName =
  "text-base text-inherit transition-colors outline-none md:text-sm " +
  "placeholder:text-muted-foreground";

const controlBaseClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 " +
  controlTypeClassName + " " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 " +
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 " +
  "dark:bg-input/30 dark:disabled:bg-input/80 " +
  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

/** One line: an `<input>`, a native `<select>`, anything 32 px tall. */
export const controlClassName = `h-8 py-1 ${controlBaseClassName}`;

/**
 * The same control for a `<textarea>`: a floor instead of a fixed height.
 *
 * Deliberately without `field-sizing-content`, which `textarea.tsx` adds for
 * itself. Sixteen native textareas across the backoffice size themselves with
 * `rows`, and `field-sizing: content` overrides it — they would all collapse to
 * this floor.
 */
export const controlMultilineClassName = `min-h-20 py-2 ${controlBaseClassName}`;

/**
 * The label above a control.
 *
 * There were three of these. `components/ui/label.tsx` and 50-odd hand-written
 * labels agreed on `text-sm font-medium`; the proposal editor used `font-semibold`
 * with its own `mb-1`. Measured on the two screens: the hotels editor put its
 * label 0 px from the field it names, the proposal editor 4 px.
 *
 * Neither was right on its own, so this takes the weight from the majority and
 * the spacing from the one screen that had any. Colour is inherited rather than
 * named: the labels that set it were split between `text-foreground` and
 * `text-[var(--wt-ink)]`, which resolve to two different near-blacks — lab(2.75%)
 * and #000 — for no reason anyone intended.
 */
export const fieldLabelClassName = "mb-1 block text-sm leading-none font-medium";

/**
 * A control that reads as text until you touch it.
 *
 * The itinerary rows use this: a stop's id and how you travel to the next one
 * sit inside a line of prose, and a box drawn around each would turn a list of
 * stops into a form. It is still the same control — the same height, so a row
 * does not jump when it gains focus, and the same type — with the box removed.
 *
 * It is here because there were two spellings of it, one on an `<Input>` and
 * one on a native `<select>`, and they disagreed about the font size.
 */
export const controlBareClassName =
  "h-8 min-w-0 border-0 bg-transparent px-0 py-0 font-medium " +
  controlTypeClassName + " " +
  "focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50";
