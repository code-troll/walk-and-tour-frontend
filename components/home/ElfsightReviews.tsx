"use client";

import { useEffect } from "react";

const ELFSIGHT_SCRIPT_ID = "elfsight-platform-script";
const ELFSIGHT_SCRIPT_SRC = "https://elfsightcdn.com/platform.js";

export default function ElfsightReviews() {
  useEffect(() => {
    const existingScript = document.getElementById(ELFSIGHT_SCRIPT_ID);

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = ELFSIGHT_SCRIPT_ID;
    script.src = ELFSIGHT_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className="elfsight-app-c976affe-b00e-4af3-b550-53dd2fb36e1b"
      data-elfsight-app-lazy="true"
    />
  );
}
