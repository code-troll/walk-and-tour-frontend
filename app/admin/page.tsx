import {getAdminViewerState} from "@/lib/admin/session";
import OverviewClient from "./overview-client";

export default async function AdminHomePage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  return <OverviewClient roleName={viewerState.backendAdmin.roleName}/>;
}
