import {getRequestConfig} from "next-intl/server";
import {routing, type AppLocale} from "@/i18n/routing";

const messageLoaders: Record<AppLocale, () => Promise<{default: Record<string, unknown>}>> = {
  en: () => import("@/messages/en.json"),
  es: () => import("@/messages/es.json"),
  it: () => import("@/messages/it.json"),
};

const isValidLocale = (locale: string): locale is AppLocale =>
  routing.locales.includes(locale as AppLocale);

export default getRequestConfig(async ({locale: localeOverride, requestLocale}) => {
  const requestedLocale = localeOverride ?? (await requestLocale);
  const locale =
    requestedLocale && isValidLocale(requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});
