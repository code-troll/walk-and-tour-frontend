"use client";

import type {ReactNode} from "react";

import {AdminProgressLink} from "@/components/admin/AdminRouteProgress";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {ArrowLeft} from "lucide-react";

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

/**
 * The row that sits above every detail screen: a way back on the left, and
 * whatever that screen wants to say about itself on the right.
 *
 * It exists because six screens had grown five different versions of it — a
 * ghost Button, an outline Button, a bare link in semibold, a plain <button>,
 * and labels alternating between "Back to X" and the destination. There was
 * nothing to share, so everybody wrote their own. Now there is.
 *
 * `onClick` instead of `href` is for screens that cannot simply navigate: the
 * tour editor has to run its unsaved-changes guard first.
 */
export function AdminBackRow({
  href,
  label,
  onClick,
  children,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {href ? (
        <Button asChild size="sm" variant="ghost">
          <AdminProgressLink href={href}>
            <ArrowLeft className="size-4" />
            {label}
          </AdminProgressLink>
        </Button>
      ) : (
        <Button onClick={onClick} size="sm" type="button" variant="ghost">
          <ArrowLeft className="size-4" />
          {label}
        </Button>
      )}
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}

/**
 * A row action with no room for a label: copy, open, delete.
 *
 * `size="icon-sm"` is 28 px square with the `sm` radius — the same button as
 * the labelled `size="sm"` it always sits beside, minus the text. It squared
 * off `size="sm"` by hand at first, which worked but wrote a size the scale
 * already had.
 *
 * The label is required and becomes both the tooltip and the accessible name.
 * The four hand-written versions this replaces had a `title` and nothing else,
 * so a screen reader announced them as "button".
 */
export function AdminIconButton({
  children,
  href,
  label,
  onClick,
  tone = "neutral",
}: {
  children: ReactNode;
  /** An external destination. Internal navigation belongs in a normal link. */
  href?: string;
  label: string;
  onClick?: () => void;
  tone?: "neutral" | "danger";
}) {
  const className = cn(
    tone === "danger" && "border-[var(--wt-danger)] text-[var(--wt-danger)]",
  );

  if (href) {
    return (
      <Button aria-label={label} asChild className={className} size="icon-sm" title={label} variant="outline">
        <a href={href} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      </Button>
    );
  }

  return (
    <Button
      aria-label={label}
      className={className}
      onClick={onClick}
      size="icon-sm"
      title={label}
      type="button"
      variant="outline"
    >
      {children}
    </Button>
  );
}

/** The muted line a detail screen puts opposite its back link. */
export function AdminHeaderMeta({children}: {children: ReactNode}) {
  return <p className="text-xs text-[var(--wt-ink-muted)]">{children}</p>;
}

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
  /** Optional: a section that is only a heading and its actions is a valid shape. */
  children?: ReactNode;
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
      {children ? <div className="px-5 py-4">{children}</div> : null}
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

/**
 * A pill you press to choose something: a weekday, a language, a tag.
 *
 * There were four of these — the recurrence builder, the event frequency, the
 * team member's languages and the blog's tags — with three different paddings
 * and two different ideas of what "selected" looks like. Three drew the chosen
 * one in muted ink, which reads as the disabled one; the blog filled it with
 * the primary colour. It is one thing now, and the chosen one is the darker.
 *
 * It is a `<button>` rather than the shared Button because it is a toggle:
 * `aria-pressed` is the whole point, and a pill is one of the few shapes
 * `rounded-full` is actually for.
 */
export function AdminToggleChip({
  children,
  onClick,
  pressed,
}: {
  children: ReactNode;
  onClick: () => void;
  pressed: boolean;
}) {
  return (
    <button
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        pressed
          ? "border-[var(--wt-ink)] bg-[var(--wt-surface-sunk)] text-[var(--wt-ink)]"
          : "border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] text-[var(--wt-ink-muted)] hover:text-[var(--wt-ink)]",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
