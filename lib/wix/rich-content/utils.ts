export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getWixImageUrl(imageId?: string): string | null {
  if (!imageId) return null;

  if (imageId.startsWith("http://") || imageId.startsWith("https://")) {
    return imageId;
  }

  return `https://static.wixstatic.com/media/${ imageId }`;
}

export function mapAlignment(
  alignment?: "AUTO" | "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY" | string,
): string {
  switch (alignment) {
    case "LEFT":
      return "text-left";
    case "CENTER":
      return "text-center";
    case "RIGHT":
      return "text-right";
    case "JUSTIFY":
      return "text-justify";
    default:
      return "";
  }
}

export function mapImageAlignment(
  alignment?: "LEFT" | "CENTER" | "RIGHT" | string,
): string {
  switch (alignment) {
    case "LEFT":
      return "float-left mr-12";
    case "CENTER":
      return "mx-auto";
    case "RIGHT":
      return "float-right ml-12";
    default:
      return "mx-auto";
  }
}

export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
