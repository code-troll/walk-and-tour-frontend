import type {ReactNode} from "react";

import {controlClassName} from "@/components/ui/control-class";

/**
 * The hotel portal's own primitives — direction "Skilt".
 *
 * These exist because the portal used to import `components/admin/AdminUi`, and
 * a partner-facing product that borrows the backoffice's components will always
 * look like the backoffice no matter what colours it is given.
 *
 * Skilt has no cards. Hierarchy comes from air and from a single rule under a
 * heading, which is what lets a receptionist scan a screen they see twice a
 * month. Every colour is a role from `app/design-system.css`; there is not a
 * hex literal in this file, and the lint rule will not allow one.
 */

/** Primary action. One per screen — it is the brand red, and it stops meaning "the way forward" if it repeats. */
export const portalPrimaryAction =
  "inline-flex items-center justify-center gap-2 rounded-[var(--wt-radius-control)] " +
  "bg-[var(--wt-accent)] px-5 py-2.5 text-sm font-medium text-white transition " +
  "hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

/** Everything else: the same shape, drawn with a rule instead of a fill. */
export const portalSecondaryAction =
  "inline-flex items-center justify-center gap-2 rounded-[var(--wt-radius-control)] " +
  "border border-[var(--wt-rule-strong)] px-5 py-2.5 text-sm font-medium " +
  "text-[var(--wt-ink)] transition hover:bg-[var(--wt-surface-sunk)] " +
  "disabled:pointer-events-none disabled:opacity-50";

/** For navigating back, where a bordered button would be too loud. */
export const portalQuietAction =
  "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--wt-ink-muted)] " +
  "transition hover:text-[var(--wt-ink)]";

/**
 * The portal's form control. The shape itself lives in
 * `components/ui/control-class.ts`, shared with the backoffice, because both
 * surfaces needed the same thing and each having its own copy is exactly how
 * this got out of step in the first place.
 */
export const portalControl = controlClassName;

/**
 * A titled block of content.
 *
 * The rule under the heading is the whole device: it separates without drawing
 * a box, so several sections down a page read as one continuous document
 * rather than a stack of unrelated panels.
 */
export function PortalSection({
  actions,
  children,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--wt-rule)] pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-medium tracking-tight text-[var(--wt-ink)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--wt-ink-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

/**
 * A whole-screen message: signed out, nothing found, something failed.
 *
 * Deliberately not a card. These appear when the portal has nothing to show,
 * and a box drawn around an apology only makes the emptiness louder.
 */
export function PortalNotice({
  actions,
  description,
  kicker,
  title,
}: {
  actions?: ReactNode;
  description: string;
  kicker: string;
  title: string;
}) {
  return (
    <section className="max-w-xl py-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--wt-ink-muted)]">
        {kicker}
      </p>
      <h2 className="mt-3 text-3xl font-normal tracking-tight text-[var(--wt-ink)]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--wt-ink-muted)]">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}

/**
 * A short definition, for the guest details on a booking.
 */
export function PortalField({label, children}: {label: string; children: ReactNode}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--wt-ink)]">{children}</dd>
    </div>
  );
}

/**
 * An inline message attached to a screen rather than replacing it — a failed
 * action, a cancellation reason. Drawn with a left rule in the brand red,
 * which is the one place red appears outside the primary action.
 */
export function PortalAlert({children}: {children: ReactNode}) {
  return (
    <p className="border-l-2 border-[var(--wt-danger)] py-1 pl-4 text-sm text-[var(--wt-ink)]">
      {children}
    </p>
  );
}
