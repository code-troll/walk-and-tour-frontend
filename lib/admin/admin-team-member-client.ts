"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {ApiTeamMember} from "@/lib/team-members/admin-team-member-types";

export const getAdminTeamMembersClient = () =>
  fetchJson<ApiTeamMember[]>({
    input: "/api/internal/admin/team-members",
    fallbackMessage: "Unable to load team members.",
  });

export const getAdminTeamMemberClient = (id: string) =>
  fetchJson<ApiTeamMember | null>({
    input: `/api/internal/admin/team-members/${id}`,
    fallbackMessage: "Unable to load the team member.",
    notFoundFallback: null,
  });
