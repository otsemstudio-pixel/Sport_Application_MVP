"use client";

import { useEffect } from "react";

type Preference = "AUTO" | "DEGRADE" | "COMPLET";

const CLE_CACHE = "scoutapp:effets-visuels:v1";
const SEUIL_MS_PAR_FRAME = 16.7; // ~60fps
const NOMBRE_FRAMES = 10;

// Mesure un rendu avec backdrop-filter actif sur un élément hors écran,
// pour ne jamais fier la décision uniquement aux specs déclarées de
// l'appareil (certaines specs déclarées sont optimistes, d'autres absentes
// — Safari/iOS n'expose pas navigator.deviceMemory par exemple).
function mesurerRenduAvecFlou(): Promise<boolean> {
  return new Promise((resolve) => {
    const test = document.createElement("div");
    test.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:80px;height:80px;" +
      "backdrop-filter:blur(16px) saturate(160%);background:rgba(255,255,255,0.3);";
    document.body.appendChild(test);

    let frames = 0;
    let debut = 0;

    function tick(t: number) {
      if (debut === 0) debut = t;
      frames++;
      if (frames < NOMBRE_FRAMES) {
        requestAnimationFrame(tick);
      } else {
        const dureeMoyenne = (t - debut) / frames;
        document.body.removeChild(test);
        resolve(dureeMoyenne <= SEUIL_MS_PAR_FRAME);
      }
    }
    requestAnimationFrame(tick);
  });
}

async function detecterCapacite(): Promise<boolean> {
  const nav = navigator as Navigator & { deviceMemory?: number };

  // Écarte tôt les appareils clairement sous-dimensionnés — mais un signal
  // déclaré favorable ne suffit jamais à lui seul : le benchmark ci-dessous
  // reste la vérification qui tranche dans tous les autres cas.
  if (typeof nav.deviceMemory === "number") {
    if (nav.deviceMemory < 4) return false;
  } else if (typeof navigator.hardwareConcurrency === "number") {
    if (navigator.hardwareConcurrency < 4) return false;
  }

  try {
    return await mesurerRenduAvecFlou();
  } catch {
    // Signal ambigu/indisponible : version dégradée par défaut (fail-safe).
    return false;
  }
}

export default function DetectionEffetsVisuels({ preference }: { preference: Preference }) {
  useEffect(() => {
    if (preference === "DEGRADE") return;

    if (preference === "COMPLET") {
      document.documentElement.setAttribute("data-effets", "complet");
      return;
    }

    const cache = sessionStorage.getItem(CLE_CACHE);
    if (cache === "complet") {
      document.documentElement.setAttribute("data-effets", "complet");
      return;
    }
    if (cache === "degrade") return;

    let annule = false;
    detecterCapacite().then((capable) => {
      if (annule) return;
      sessionStorage.setItem(CLE_CACHE, capable ? "complet" : "degrade");
      if (capable) document.documentElement.setAttribute("data-effets", "complet");
    });

    return () => {
      annule = true;
    };
  }, [preference]);

  return null;
}
