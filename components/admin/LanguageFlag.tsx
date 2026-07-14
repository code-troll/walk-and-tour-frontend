import type {ComponentType} from "react";
import {ES, GB, IT} from "country-flag-icons/react/3x2";

const FLAG_BY_LANGUAGE: Record<string, ComponentType<{className?: string; title?: string}>> = {
  en: GB,
  es: ES,
  it: IT,
};

/** Small flag for a language code (falls back to the uppercased code for unmapped locales). */
export function LanguageFlag({language, className}: {language: string; className?: string}) {
  const code = language.trim().toLowerCase().split("-")[0];
  const Flag = FLAG_BY_LANGUAGE[code];
  if (!Flag) {
    return (
      <span className={`text-[0.6rem] font-semibold uppercase text-muted-foreground ${className ?? ""}`}>
        {code}
      </span>
    );
  }
  return <Flag className={className} title={language} />;
}
