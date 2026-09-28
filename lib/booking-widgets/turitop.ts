"use client";

export const TURITOP_SCRIPT_ID = "js-turitop";
export const TURITOP_SCRIPT_SRC = "https://app.turitop.com/js/load-turitop.min.js";
export const TURITOP_EMBED_MODE = "box";

// NEXT_PUBLIC_* values are inlined at build time, so each one must be read by
// its literal name.
const TURITOP_ACCOUNT = {
  company: process.env.NEXT_PUBLIC_TURITOP_COMPANY?.trim() ?? "",
  buttonColor: process.env.NEXT_PUBLIC_TURITOP_BUTTON_COLOR?.trim() ?? "",
  affiliateTag: process.env.NEXT_PUBLIC_TURITOP_AFFILIATE_TAG?.trim() ?? "",
};

type TuritopWidgetElement = {
  container: HTMLElement;
  embed?: string;
  language: string;
  service: string;
};

const turitopContainerObservers = new WeakMap<HTMLElement, MutationObserver>();
const containersAwaitingScript = new Set<HTMLElement>();
let pendingScriptReload: number | null = null;
let hasWarnedMissingAccount = false;

export const isTuritopConfigured = () => {
  if (TURITOP_ACCOUNT.company) {
    return true;
  }

  if (!hasWarnedMissingAccount) {
    hasWarnedMissingAccount = true;
    console.warn("Turitop widgets are disabled: NEXT_PUBLIC_TURITOP_COMPANY is not set.");
  }

  return false;
};

const configureTuritopIframeScrolling = (container: HTMLElement) => {
  const iframe = container.querySelector("iframe");
  if (!iframe) {
    return;
  }

  iframe.setAttribute("scrolling", "yes");
  iframe.style.overflowY = "auto";
  iframe.style.overflowX = "hidden";
};

export const renderTuritopPlaceholder = ({
  container,
  embed = TURITOP_EMBED_MODE,
  language,
  service,
}: TuritopWidgetElement) => {
  container.innerHTML = "";

  const widget = document.createElement("div");
  widget.className = "load-turitop";
  widget.dataset.service = service;
  widget.dataset.lang = language;
  widget.dataset.embed = embed;
  container.appendChild(widget);
};

// The Turitop script picks up `.load-turitop` placeholders when it loads, so
// placeholders added later are rendered by loading the script again.
export const reloadTuritopScript = () => {
  const existingScript = document.getElementById(TURITOP_SCRIPT_ID);
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.id = TURITOP_SCRIPT_ID;
  script.src = TURITOP_SCRIPT_SRC;
  script.async = true;
  script.dataset.company = TURITOP_ACCOUNT.company;
  if (TURITOP_ACCOUNT.buttonColor) {
    script.dataset.buttoncolor = TURITOP_ACCOUNT.buttonColor;
  }
  if (TURITOP_ACCOUNT.affiliateTag) {
    script.dataset.afftag = TURITOP_ACCOUNT.affiliateTag;
  }
  document.body.appendChild(script);
};

// Widgets mounted in the same tick (a blog post with several calendars, or a
// page where several components mount at once) share a single script reload.
const scheduleTuritopScriptReload = (containers: HTMLElement[]) => {
  containers.forEach((container) => containersAwaitingScript.add(container));

  if (pendingScriptReload !== null) {
    return;
  }

  pendingScriptReload = window.setTimeout(() => {
    pendingScriptReload = null;
    reloadTuritopScript();

    containersAwaitingScript.forEach((container) => {
      configureTuritopIframeScrolling(container);
    });
    containersAwaitingScript.clear();
  }, 0);
};

export const mountTuritopWidgets = (widgets: TuritopWidgetElement[]) => {
  const validWidgets = widgets.filter((widget) => widget.service && widget.language && widget.container);

  if (!validWidgets.length || !isTuritopConfigured()) {
    return;
  }

  validWidgets.forEach((widget) => {
    renderTuritopPlaceholder(widget);

    turitopContainerObservers.get(widget.container)?.disconnect();

    const observer = new MutationObserver(() => {
      configureTuritopIframeScrolling(widget.container);
    });

    observer.observe(widget.container, {
      childList: true,
      subtree: true,
    });

    turitopContainerObservers.set(widget.container, observer);
  });

  scheduleTuritopScriptReload(validWidgets.map((widget) => widget.container));
};

export const unmountTuritopWidgets = (containers: HTMLElement[]) => {
  containers.forEach((container) => {
    turitopContainerObservers.get(container)?.disconnect();
    turitopContainerObservers.delete(container);
    containersAwaitingScript.delete(container);
    container.innerHTML = "";
  });
};
