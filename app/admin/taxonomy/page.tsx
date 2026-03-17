import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { TaxonomyClient } from "./taxonomy-client";

export default async function AdminTaxonomyPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Taxonomy administration is not available for the marketing role."
        description="Tags and locales are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  return (
    <TaxonomyClient
      initialTags={[]}
      initialLanguages={[]}
      canManageLanguages={viewerState.backendAdmin.roleName === "super_admin"}
    />
  );
}
