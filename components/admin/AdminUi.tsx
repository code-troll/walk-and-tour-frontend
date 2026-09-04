"use client";

import type {ReactNode} from "react";

/**
 * The backoffice's shared blocks — direction "Consola".
 *
 * These three components are used in 47 places, so they carry most of the
 * backoffice's appearance on their own. Restyling them here is what turns the
 * whole tool over to the brand tokens without touching every screen at once.
 *
 * Consola is near-neutral on purpose: an operator is in here for hours, and
 * colour that does not carry meaning is noise. Panels are drawn with a 1 px
 * rule and a 3 px radius, never a shadow — depth is decoration, and this is a
 * tool. Colour appears only where it means something, which in practice is the
 * status of a booking and the position you are standing in.
 */

export function AdminNoticeCard({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] p-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--wt-ink-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-medium tracking-tight text-[var(--wt-ink)]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--wt-ink-muted)]">{description}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}

export function AdminSectionCard({
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
    <section className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-[var(--wt-surface)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--wt-rule)] px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-[var(--wt-ink)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--wt-ink-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * A single figure. The value is monospaced and tabular so a column of these
 * lines up digit for digit — the backoffice is mostly money and counts.
 */
export function AdminStatCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--wt-ink-muted)]">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-medium tabular-nums text-[var(--wt-ink)]">
        {value}
      </p>
    </div>
  );
}
