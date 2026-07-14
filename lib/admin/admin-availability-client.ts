"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {ApiAvailability} from "@/lib/team-members/admin-availability-types";
import type {ApiTeamMember} from "@/lib/team-members/admin-team-member-types";

export const getMemberAvailabilityClient = (memberId: string) =>
  fetchJson<ApiAvailability>({
    input: `/api/internal/admin/team-members/${memberId}/availability`,
    fallbackMessage: "Unable to load availability.",
  });

export const listAvailableMembersClient = (dateIso: string, durationMinutes: number) =>
  fetchJson<ApiTeamMember[]>({
    input: `/api/internal/admin/team-members/available?date=${encodeURIComponent(dateIso)}&durationMinutes=${durationMinutes}`,
    fallbackMessage: "Unable to load available team members.",
  });
