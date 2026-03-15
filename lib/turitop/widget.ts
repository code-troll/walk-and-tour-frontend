"use client";

export const TURITOP_SCRIPT_ID = "js-turitop";
export const TURITOP_SCRIPT_SRC = "https://app.turitop.com/js/load-turitop.min.js";
export const TURITOP_COMPANY = "W420";
export const TURITOP_BUTTON_COLOR = "green";
export const TURITOP_AFFTAG = "ttafid";
export const TURITOP_EMBED_MODE = "box";

type TuritopWidgetElement = {
  container: HTMLElement;
  embed?: string;
  language: string;
  service: string;
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

export const reloadTuritopScript = () => {
  const existingScript = document.getElementById(TURITOP_SCRIPT_ID);
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.id = TURITOP_SCRIPT_ID;
  script.src = TURITOP_SCRIPT_SRC;
  script.async = true;
  script.dataset.company = TURITOP_COMPANY;
  script.dataset.buttoncolor = TURITOP_BUTTON_COLOR;
  script.dataset.afftag = TURITOP_AFFTAG;
  document.body.appendChild(script);
};

export const mountTuritopWidgets = (widgets: TuritopWidgetElement[]) => {
  const validWidgets = widgets.filter((widget) => widget.service && widget.language && widget.container);

  if (!validWidgets.length) {
    return;
  }

  validWidgets.forEach((widget) => {
    renderTuritopPlaceholder(widget);
  });

  reloadTuritopScript();
};
