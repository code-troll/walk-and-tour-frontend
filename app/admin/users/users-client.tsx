"use client";

import {useEffect, useState} from "react";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {getAdminRolesClient, getAdminUsersClient} from "@/lib/admin/admin-client";
import {formatAdminDate} from "@/lib/admin/format-date";
import type {components} from "@/lib/api/generated/backend-types";

type ApiUser = components["schemas"]["AdminUserResponseDto"];
type ApiRole = components["schemas"]["RoleResponseDto"];

export default function AdminUsersClient() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsersWorkspace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextUsers, nextRoles] = await Promise.all([
        getAdminUsersClient(),
        getAdminRolesClient(),
      ]);

      setUsers(nextUsers);
      setRoles(nextRoles);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the users workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsersWorkspace();
  }, []);

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the users workspace."
        description="Resolving admin users and role metadata."
      />
    );
  }

  if (error) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The users workspace could not be loaded."
        description={error}
        actions={
          <button
            type="button"
            onClick={() => void loadUsersWorkspace()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Admin users"
        description="This page reads from the admin BFF so the browser owns the request lifecycle."
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
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#f4ecdf] text-[#294049]">
                  <td className="py-4 pr-4">{user.email}</td>
                  <td className="py-4 pr-4">{user.roleName}</td>
                  <td className="py-4 pr-4 capitalize">{user.status}</td>
                  <td className="py-4 pr-4">{user.lastLoginAt ? formatAdminDate(user.lastLoginAt) : "Never"}</td>
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
          {roles.map((role) => (
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
