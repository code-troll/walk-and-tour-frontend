/* eslint-disable @next/next/no-html-link-for-pages */
import {PortalNotice, portalPrimaryAction} from "@/components/hotel-portal/PortalUi";

/**
 * Where the identity provider returns the browser once a password has been set.
 *
 * It sits outside the `(portal)` group on purpose: the hotel has just chosen a
 * password and has not signed in yet, so gating this page behind a session
 * would show a sign-in prompt at the exact moment the flow succeeded. That is
 * also why it renders its own column — the navigation row lives in the group.
 */
export default function PasswordUpdatedPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-16 sm:px-10">
      <PortalNotice
        kicker="Walk and Tour"
        title="Your password is set."
        description="You can now sign in with the username Walk and Tour gave you and the password you just chose."
        actions={
          <a className={portalPrimaryAction} href="/">
            Go to sign in
          </a>
        }
      />
    </div>
  );
}
