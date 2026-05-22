"use client";

import type {AppLocale} from "@/i18n/routing";
import {fetchJson} from "@/lib/api/client-json";
import type {PublicTeamMember} from "@/lib/team-members/admin-team-member-types";

export const listPublicTeamMembersClient = async ({locale}: {locale: AppLocale}): Promise<PublicTeamMember[]> => {
  const members = await fetchJson<PublicTeamMember[]>({
    input: `/api/internal/public/api/public/team-members?locale=${locale}`,
    fallbackMessage: "Unable to load team members.",
  });

  return members.map((member) => ({
    ...member,
    photoMedia: member.photoMedia
      ? {
          ...member.photoMedia,
          contentUrl: `/api/internal/public${member.photoMedia.contentUrl}`,
        }
      : null,
  }));
};

export const listPublicTeamMembersSafeClient = async ({
  locale,
}: {
  locale: AppLocale;
}): Promise<{members: PublicTeamMember[]; didFail: boolean}> => {
  try {
    return {
      members: await listPublicTeamMembersClient({locale}),
      didFail: false,
    };
  } catch (error) {
    console.error("Unable to load public team members", error);
    return {
      members: [],
      didFail: true,
    };
  }
};
