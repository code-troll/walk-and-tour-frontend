"use client";

import Image from "next/image";
import {useEffect, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/routing";
import {listPublicTeamMembersSafeClient} from "@/lib/team-members/public-team-member-client";
import type {PublicTeamMember} from "@/lib/team-members/admin-team-member-types";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e8ddd2]">
      <div className="h-72 w-full animate-pulse bg-[#f0e6d8]" />
      <div className="flex flex-col items-center gap-2 p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-[#f0e6d8]" />
        <div className="h-4 w-24 animate-pulse rounded bg-[#f0e6d8]" />
      </div>
    </div>
  );
}

export default function AboutUsTeamSection() {
  const t = useTranslations("aboutUs.team");
  const locale = useLocale() as AppLocale;
  const [members, setMembers] = useState<PublicTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      const result = await listPublicTeamMembersSafeClient({locale});
      setMembers(result.members);
      setIsLoading(false);
    })();
  }, [locale]);

  if (!isLoading && members.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <h2 className="text-center text-3xl font-semibold text-teal sm:text-4xl">
          {t("title")}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            members.map((member) => (
              <article
                key={member.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e8ddd2]"
              >
                {member.photoMedia ? (
                  <Image
                    src={member.photoMedia.contentUrl}
                    alt={member.imageAlt ?? ""}
                    width={400}
                    height={288}
                    unoptimized
                    className="h-72 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center bg-[#f5efe5] text-sm text-[#5c4d3e]">
                    No photo
                  </div>
                )}
                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-[#2a221a]">
                    {member.name}
                  </h3>
                  {member.role && (
                    <p className="mt-1 text-sm text-[#5c4d3e]">
                      {member.role}
                    </p>
                  )}
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block"
                    >
                      <Image
                        src="/walkandtour/social/color/linkedin.png"
                        alt="LinkedIn"
                        width={24}
                        height={24}
                      />
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}