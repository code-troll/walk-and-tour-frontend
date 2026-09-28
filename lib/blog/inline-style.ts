import type { CSSProperties } from "react";

// Serialises a style object for HTML that is stored, such as a blog post body.
export const styleObjectToString = (style: CSSProperties) =>
  Object.entries(style)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== null)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (character) => `-${ character.toLowerCase() }`);
      return `${ cssKey }:${ value }`;
    })
    .join(";");
