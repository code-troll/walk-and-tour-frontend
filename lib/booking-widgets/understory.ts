"use client";

export const UNDERSTORY_SCRIPT_ID = "js-understory";
export const UNDERSTORY_SCRIPT_SRC = "https://widgets.understory.io/widgets/understory-booking-widget.js";
const UNDERSTORY_WIDGET_CLASS = "understory-booking-widget";

type UnderstoryWidgetElement = {
  container: HTMLElement;
  companyId: string;
  storefrontId: string;
  language: string;
};

// Loaded once: the widget watches the page for `.understory-booking-widget`
// elements added later and mounts each one itself.
const ensureUnderstoryScript = () => {
  if (document.getElementById(UNDERSTORY_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = UNDERSTORY_SCRIPT_ID;
  script.src = UNDERSTORY_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
};

// Returns the cleanup. Each mount gets a new element, because the widget skips
// an element it has already attached its shadow root to.
export const mountUnderstoryWidget = ({
  container,
  companyId,
  storefrontId,
  language,
}: UnderstoryWidgetElement) => {
  const widget = document.createElement("div");
  widget.className = UNDERSTORY_WIDGET_CLASS;
  widget.dataset.companyId = companyId;
  widget.dataset.storefrontId = storefrontId;
  widget.dataset.language = language;

  container.replaceChildren(widget);
  ensureUnderstoryScript();

  return () => widget.remove();
};
