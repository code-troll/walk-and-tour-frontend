import type { CSSProperties } from "react";
import { styleObjectToString } from "@/lib/blog/inline-style";
import { isBookingWidgetProviderId, type BookingWidgetProviderId } from "@/lib/booking-widgets/providers";

// A booking widget placed in a blog post. The post HTML stores it as an empty
// div whose data attributes say what to mount; the calendar itself is loaded
// by the page. The editor, the sanitizer and the public page all read it here.

export const BLOG_BOOKING_WIDGET_SELECTOR = '[data-blog-booking-widget="true"]';
// Posts saved before the block named its provider. They are always Turitop,
// call the product id `data-service`, and stay readable without a migration:
// the editor rewrites them in the new markup the next time the post is saved.
export const LEGACY_BLOG_TURITOP_SELECTOR = '[data-blog-turitop="true"]';
export const BLOG_BOOKING_WIDGET_ELEMENT_SELECTOR = `${ BLOG_BOOKING_WIDGET_SELECTOR }, ${ LEGACY_BLOG_TURITOP_SELECTOR }`;

export const BLOG_BOOKING_WIDGET_MIN_WIDTH = 320;
export const BLOG_BOOKING_WIDGET_MAX_WIDTH = 960;
export const BLOG_BOOKING_WIDGET_MIN_HEIGHT = 320;
export const BLOG_BOOKING_WIDGET_MAX_HEIGHT = 1400;
export const BLOG_BOOKING_WIDGET_DEFAULT_WIDTH = 720;
export const BLOG_BOOKING_WIDGET_DEFAULT_HEIGHT = 760;

export type BlogBookingWidgetAlignment = "left" | "center" | "right";

export type BlogBookingWidgetFields = {
  provider: string | null;
  productId: string;
  language: string;
  alignment: BlogBookingWidgetAlignment;
  customWidth: number | null;
  customHeight: number | null;
};

export type BlogBookingWidgetBlock = BlogBookingWidgetFields & {
  provider: BookingWidgetProviderId;
};

type AttributeReader = (name: string) => string | null;

export const clampBlogBookingWidgetWidth = (width: number) =>
  Math.min(BLOG_BOOKING_WIDGET_MAX_WIDTH, Math.max(BLOG_BOOKING_WIDGET_MIN_WIDTH, width));

export const clampBlogBookingWidgetHeight = (height: number) =>
  Math.min(BLOG_BOOKING_WIDGET_MAX_HEIGHT, Math.max(BLOG_BOOKING_WIDGET_MIN_HEIGHT, height));

export const toBlogBookingWidgetAlignment = (value: unknown): BlogBookingWidgetAlignment =>
  value === "left" || value === "right" ? value : "center";

const parseDimension = (value: string | null, clamp: (value: number) => number) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isNaN(parsed) ? null : clamp(parsed);
};

// Everything the markup says, complete or not; the editor shows an incomplete
// block as a placeholder until its author fills it in.
export const readBlogBookingWidgetFields = (getAttribute: AttributeReader): BlogBookingWidgetFields => {
  const isLegacy = getAttribute("data-blog-turitop") === "true";

  return {
    provider: isLegacy ? "turitop" : getAttribute("data-provider"),
    productId: (isLegacy ? getAttribute("data-service") : getAttribute("data-product-id"))?.trim() ?? "",
    language: getAttribute("data-lang")?.trim() ?? "",
    alignment: toBlogBookingWidgetAlignment(getAttribute("data-alignment")),
    customWidth: parseDimension(getAttribute("data-custom-width"), clampBlogBookingWidgetWidth),
    customHeight: parseDimension(getAttribute("data-custom-height"), clampBlogBookingWidgetHeight),
  };
};

// Null unless the block names a provider this build knows, a product id and a
// language, which is what mounting a widget needs.
export const readBlogBookingWidgetBlock = (getAttribute: AttributeReader): BlogBookingWidgetBlock | null => {
  const fields = readBlogBookingWidgetFields(getAttribute);

  if (!isBookingWidgetProviderId(fields.provider) || !fields.productId || !fields.language) {
    return null;
  }

  return { ...fields, provider: fields.provider };
};

// Serialised into the stored article, so changing a value here changes
// published posts.
export const getBlogBookingWidgetStyle = (
  alignment: BlogBookingWidgetAlignment,
  customWidth?: number | null,
  customHeight?: number | null,
): CSSProperties => {
  const style: CSSProperties = {
    background: "#fff",
    border: "1px solid #eadfce",
    borderRadius: "1rem",
    display: "block",
    height: `${ customHeight ?? BLOG_BOOKING_WIDGET_DEFAULT_HEIGHT }px`,
    marginBottom: "1.5rem",
    marginTop: "1.5rem",
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    width: `${ customWidth ?? BLOG_BOOKING_WIDGET_DEFAULT_WIDTH }px`,
    WebkitOverflowScrolling: "touch",
  };

  if (alignment === "left") {
    style.float = "left";
    style.marginRight = "1.5rem";
    return style;
  }

  if (alignment === "right") {
    style.float = "right";
    style.marginLeft = "1.5rem";
    return style;
  }

  style.display = "flow-root";
  style.marginLeft = "auto";
  style.marginRight = "auto";
  return style;
};

export const getBlogBookingWidgetAttributes = (block: BlogBookingWidgetFields): Record<string, string> => ({
  "data-blog-booking-widget": "true",
  "data-provider": block.provider ?? "",
  "data-product-id": block.productId,
  "data-lang": block.language,
  "data-alignment": block.alignment,
  "data-custom-width": block.customWidth?.toString() ?? "",
  "data-custom-height": block.customHeight?.toString() ?? "",
  style: styleObjectToString(getBlogBookingWidgetStyle(block.alignment, block.customWidth, block.customHeight)),
});

const escapeAttributeValue = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// The markup the sanitizer lets through: rebuilt from the fields it read, so no
// attribute the author's HTML carried reaches the page unless it is listed here.
export const renderBlogBookingWidgetMarkup = (block: BlogBookingWidgetBlock) => {
  const attributes = Object.entries(getBlogBookingWidgetAttributes(block))
    .map(([name, value]) => `${ name }="${ escapeAttributeValue(value) }"`)
    .join(" ");

  return `<div ${ attributes }></div>`;
};
