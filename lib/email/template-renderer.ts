import { readFile } from "node:fs/promises";
import path from "node:path";

import { Liquid } from "liquidjs";

const liquidEngine = new Liquid({
  cache: true,
});

const templateDirectory = path.join(process.cwd(), "emails", "templates");

export const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll("\"", "&quot;")
  .replaceAll("'", "&#39;");

export const renderMultilineHtml = (value: string): string => (
  escapeHtml(value).replaceAll("\n", "<br />")
);

export async function renderEmailTemplate(
  templateName: string,
  context: Record<string, unknown>
): Promise<string> {
  const templatePath = path.join(templateDirectory, `${ templateName }.liquid`);
  const templateSource = await readFile(templatePath, "utf8");

  return liquidEngine.parseAndRender(templateSource, context);
}
