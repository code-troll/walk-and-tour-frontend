import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * The migration backlog is empty.
 *
 * This list held the files that still carried hand-written colours when the
 * brand tokens were introduced. It started at 28, grew to 37 as widening the
 * rule to `components/**` and `components/tour-editor/**` found files nobody
 * was counting, and is now done. It may only ever shrink: a new file has no
 * excuse, because the tokens already exist.
 *
 * If it is ever non-empty again, the backslashes are load-bearing — `[id]` is a
 * character class in a glob, so a dynamic-route path only matches when its
 * brackets are escaped.
 */
const UNMIGRATED_FROM_BRAND_TOKENS = [];

/**
 * Files excluded for good, because their colours are not the interface.
 *
 * This is a different thing from the backlog above, and the distinction matters:
 * these will never be migrated, so counting them as debt would make the number
 * lie forever.
 *
 * `TiptapHtmlEditor` writes inline styles into the HTML that is stored and later
 * published — `getLinkCardStyle`, `getTuritopContainerStyle` and the tour-card
 * node all serialise colours into the article itself, and
 * `DEFAULT_TEXT_COLOR` / `DEFAULT_HIGHLIGHT_COLOR` are applied to the author's
 * text. Of the 83 colour occurrences in that file, 67 are content and 14 were
 * chrome; the chrome is migrated, and the rest must not be touched. Changing
 * them would not be a redesign, it would be editing published articles.
 *
 * Adding anything here needs the same test: does this colour end up in the page
 * a reader sees, rather than in the tool an operator uses?
 */
const RENDERS_PUBLISHED_CONTENT = [
  "components/admin/TiptapHtmlEditor.tsx",
];

/**
 * Tailwind's own palette — `bg-emerald-50`, `text-red-500`, `border-slate-200`.
 *
 * Banning hex was not enough. Twice a colour reached these trees without ever
 * being written as `#rrggbb`: three `emerald-*` classes in the tour editor and
 * two `rgba()` literals in the calendar's hover rules. A rule that catches only
 * one spelling of "a colour I made up" is a rule with a hole in it.
 *
 * This deliberately leaves `white`, `black`, `transparent`, `current` and the
 * shadcn semantic names (`muted-foreground`, `input`, `ring`) alone: those are
 * either absolutes or already part of a system.
 *
 * Still not covered: `rgba()` and `hsl()` in CSS. A selector over class names
 * cannot see a stylesheet. Those live in app/globals.css, which is small enough
 * to review by hand.
 */
const TAILWIND_PALETTE =
  "(bg|text|border|ring|from|via|to|fill|stroke|decoration|outline|accent|caret|divide|placeholder)" +
  "-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue" +
  "|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)";

const NO_TAILWIND_PALETTE =
  "Tailwind palette colour. The backoffice and the hotel portal use the brand " +
  "palette through the tokens in app/design-system.css, and Tailwind's own scale " +
  "is not part of it. If you need a green, the approved one is the teal a " +
  "confirmed booking uses; if you need something that is not there, it is not " +
  "approved.";


const NO_RAW_COLOUR =
  "Raw colour literal. The backoffice and the hotel portal may only use the " +
  "brand palette through the tokens in app/design-system.css — every value " +
  "there comes from the brand identity manual. If the shade you need does not " +
  "exist, it is not approved: take it to the designer, do not write it here.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: [
      "app/admin/**/*.{ts,tsx}",
      "app/hotel-portal/**/*.{ts,tsx}",
      "components/admin/**/*.{ts,tsx}",
      "components/hotel-portal/**/*.{ts,tsx}",
      // The tour editor's actual UI lives here, outside components/admin,
      // and was therefore uncovered while its 2,129-line client file was not.
      "components/tour-editor/**/*.{ts,tsx}",
    ],
    ignores: [...UNMIGRATED_FROM_BRAND_TOKENS, ...RENDERS_PUBLISHED_CONTENT],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // "#fff", "#ffffff", "#ffffffff" — in a className, a style prop, anywhere.
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: NO_RAW_COLOUR,
        },
        {
          // The same, hidden inside a template literal.
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message: NO_RAW_COLOUR,
        },
        {
          selector: `Literal[value=/\\b${TAILWIND_PALETTE}\\b/]`,
          message: NO_TAILWIND_PALETTE,
        },
        {
          selector: `TemplateElement[value.raw=/\\b${TAILWIND_PALETTE}\\b/]`,
          message: NO_TAILWIND_PALETTE,
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
