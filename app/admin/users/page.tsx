import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {createAdminApi} from "@/lib/api/admin";
import {isBackendApiError} from "@/lib/api/core/backend-client";
import {getAdminViewerState} from "@/lib/admin/session";

const loadUsersData = async (accessToken: string) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [users, roles] = await Promise.all([adminApi.getAdminUsers(), adminApi.getAdminRoles()]);

    return {
      roles,
      users,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load the users workspace.",
    };
  }
};

export default async function AdminUsersPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName !== "super_admin") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="User administration is restricted to super admins."
        description="The backend role matrix controls this page. Editors and marketing admins cannot list or manage admin users."
      />
    );
  }

  const usersData = await loadUsersData(viewerState.accessToken);

  if ("errorMessage" in usersData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The users workspace could not be loaded."
        description={usersData.errorMessage ?? "Unable to load the users workspace."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Admin users"
        description="This page already reads from the new admin API. Create and patch flows can now be added against the same typed client and internal proxy."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#6a7b80]">
              <tr className="border-b border-[#efe6d8]">
                <th className="py-3 pr-4 font-semibold">Email</th>
                <th className="py-3 pr-4 font-semibold">Role</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Last login</th>
              </tr>
            </thead>
            <tbody>
              {usersData.users.map((user) => (
                <tr key={user.id} className="border-b border-[#f4ecdf] text-[#294049]">
                  <td className="py-4 pr-4">{user.email}</td>
                  <td className="py-4 pr-4">{user.roleName}</td>
                  <td className="py-4 pr-4 capitalize">{user.status}</td>
                  <td className="py-4 pr-4">{user.lastLoginAt ?? "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Available roles"
        description="Role metadata is loaded from `/api/admin/roles` so labels and permissions stay aligned with the backend."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {usersData.roles.map((role) => (
            <div key={role.name} className="rounded-[1.25rem] border border-[#efe6d8] bg-[#fffcf7] p-5">
              <h3 className="text-lg font-semibold text-[#21343b]">{role.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5b6d72]">{role.description}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a2f]">
                {role.permissions.length} permissions
              </p>
            </div>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
