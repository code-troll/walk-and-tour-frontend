"use client";

import Image from "next/image";
import {useEffect, useState} from "react";
import {Pencil, Plus} from "lucide-react";
import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {getAdminTeamMembersClient} from "@/lib/admin/admin-team-member-client";
import {getAdminLanguagesClient} from "@/lib/admin/admin-client";
import type {ApiTeamMember} from "@/lib/team-members/admin-team-member-types";
import type {components} from "@/lib/api/generated/backend-types";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];

export default function TeamMembersListClient() {
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useAdminRouteLoadingBoundary(isLoading);

  const loadWorkspace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextMembers, nextLanguages] = await Promise.all([
        getAdminTeamMembersClient(),
        getAdminLanguagesClient(),
      ]);

      setMembers(nextMembers);
      setLanguages(nextLanguages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load team members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the team members workspace."
        description="Resolving team member records and available languages."
      />
    );
  }

  if (error) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The team members workspace could not be loaded."
        description={error}
        actions={
          <button
            type="button"
            onClick={() => void loadWorkspace()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
      />
    );
  }

  const languageNameByCode = Object.fromEntries(
    languages.map((language) => [language.code, language.name]),
  );

  const getDisplayRole = (member: ApiTeamMember): string => {
    const firstTranslation = Object.values(member.translations)[0];
    return firstTranslation?.role || "";
  };

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Team Members"
        description="Manage team members shown on the About Us page. Each member can have a photo, LinkedIn profile, and localized name and role."
        actions={
          <Button asChild className="h-10">
            <AdminProgressLink href="/team-members/new">
              <Plus className="size-4" />
              Create Team Member
            </AdminProgressLink>
          </Button>
        }
      >
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            <p>No team members have been created yet.</p>
            <Button asChild className="h-10 mt-4">
              <AdminProgressLink href="/team-members/new">
                <Plus className="size-4" />
                Create your first team member
              </AdminProgressLink>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-[#f0e6d8] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    {member.photoMedia ? (
                      <Image
                        src={`/api/internal/admin/media/${member.photoMediaId}/content`}
                        alt=""
                        width={56}
                        height={56}
                        unoptimized
                        className="size-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#f5efe5] text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">
                        {member.name}
                      </h3>
                      {getDisplayRole(member) && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {getDisplayRole(member)}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Order: {member.orderIndex}</span>
                        <span>{Object.keys(member.translations).length} translations</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        member.isPublished
                          ? "border border-[#cfe4d3] bg-[#f3fbf4] text-[#2f6b3f]"
                          : "border border-[#eadfce] bg-[#fbf7f0] text-[#8a6029]"
                      }`}
                    >
                      {member.isPublished ? "Published" : "Draft"}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <AdminProgressLink href={`/team-members/${member.id}`}>
                        <Pencil className="size-4" />
                        Edit
                      </AdminProgressLink>
                    </Button>
                  </div>
                </div>

                {member.translationAvailability.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.translationAvailability.map((availability) => (
                      <span
                        key={availability.languageCode}
                        className="rounded-full border border-[#eadfce] px-3 py-1 text-xs text-muted-foreground"
                      >
                        {languageNameByCode[availability.languageCode] ?? availability.languageCode}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
}
