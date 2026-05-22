import {routing, type AppLocale} from "@/i18n/routing";

export const getLocalizedPath = ({
  locale,
  pathname,
}: {
  locale: AppLocale;
  pathname: string;
}) => locale === routing.defaultLocale ? pathname : `/${ locale }${ pathname }`;
