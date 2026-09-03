/* eslint-disable @next/next/no-html-link-for-pages */
import {AdminNoticeCard} from "@/components/admin/AdminUi";

/**
 * Where the identity provider returns the browser once a password has been set.
 *
 * It sits outside the `(portal)` group on purpose: the hotel has just chosen a
 * password and has not signed in yet, so gating this page behind a session
 * would show a sign-in prompt at the exact moment the flow succeeded.
 */
export default function PasswordUpdatedPage() {
  return (
    <AdminNoticeCard
      eyebrow="Walk and Tour"
      title="Your password is set."
      description="You can now sign in with the username Walk and Tour gave you and the password you just chose."
      actions={
        <a
          className="inline-flex items-center rounded-full bg-[#2b666d] px-5 py-2.5 text-sm font-semibold text-white"
          href="/"
        >
          Go to sign in
        </a>
      }
    />
  );
}
