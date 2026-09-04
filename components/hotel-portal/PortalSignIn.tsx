import {
  PortalNotice,
  PortalSection,
  portalPrimaryAction,
} from "@/components/hotel-portal/PortalUi";

/**
 * The screen a hotel sees before it signs in.
 *
 * It was a heading, two lines and a button on an otherwise empty page. What it
 * was missing was not more of the product — a first draft explained what the
 * portal is for in three columns and that read as a sales page, which is not
 * what someone standing at a reception desk at nine in the evening needs.
 *
 * What it needed was the one thing that actually goes wrong here: the username
 * is not an email address, and there was nowhere on this screen to find that
 * out or to ask. Nothing here is a new style — the same `PortalNotice` and
 * `PortalSection` the signed-in screens use, and the section rule doing the job
 * it does everywhere else.
 *
 * The help sits on the bottom edge rather than under the button, which is what
 * makes it read as a footnote instead of a second thing to do. The column is
 * the viewport less the masthead and the shell's own bottom padding; `mt-auto`
 * does the rest, so a short window closes the gap instead of scrolling.
 */

/** A plain underlined link. The portal has no inline-link style yet, and a
 *  bordered action inside a sentence would read as a button. */
const inlineLink =
  "font-medium text-[var(--wt-ink)] underline underline-offset-4 transition hover:opacity-70";

export function PortalSignIn({signInHref}: {signInHref: string}) {
  return (
    <div className="flex min-h-[calc(100svh-7.5rem)] flex-col">
      <PortalNotice
        kicker="Sign in"
        title="Sign in to book tours for your guests."
        description="Use the username Walk and Tour gave you and the password you chose from the emailed link."
        actions={
          <a className={portalPrimaryAction} href={signInHref}>
            Sign in
          </a>
        }
      />

      <div className="mt-auto pt-16">
        <PortalSection title="Trouble signing in">
          <div className="max-w-xl space-y-3 text-sm leading-6 text-[var(--wt-ink-muted)]">
            <p>
              Your username is not your email address. It is in the email Walk and Tour
              sent when your hotel was registered, and you need it every time you sign in.
            </p>
            <p>
              If that email never arrived, or the password needs resetting, write to{" "}
              <a className={inlineLink} href="mailto:info@walkandtour.dk">
                info@walkandtour.dk
              </a>{" "}
              or call{" "}
              <a className={inlineLink} href="tel:+4571352453">
                +45 71 35 24 53
              </a>
              , Monday to Sunday between 10:00 and 16:00.
            </p>
          </div>
        </PortalSection>
      </div>
    </div>
  );
}
