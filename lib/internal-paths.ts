import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export type InternalPage = "/" | "/tours" | "/about-us" | "/companies";

export type HomeSectionId =
  | "home"
  | "about"
  | "companies"
  | "blog"
  | "contact"
  | "private";

export type InternalTarget =
  | { kind: "page"; page: InternalPage; }
  | { kind: "homeSection"; section: HomeSectionId; };

export const getHomeSectionHash = (section: HomeSectionId) => `#${ section }`;

export const getInternalHref = ({
                                  locale,
                                  target,
                                }: {
  locale: AppLocale;
  target: InternalTarget;
}) => {
  if (target.kind === "page") {
    return getPathname({locale, href: target.page});
  }

  const homePath = getPathname({locale, href: "/"});
  return `${ homePath }${ getHomeSectionHash(target.section) }`;
};
