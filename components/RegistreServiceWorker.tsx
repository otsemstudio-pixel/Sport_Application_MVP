"use client";

import { useEffect } from "react";

// Enregistre le service worker sans jamais demander la permission de
// notification — l'enregistrement seul est inoffensif. La demande de
// permission n'a lieu que dans ParametresNotifications, au moment où
// l'athlète choisit explicitement une fréquence autre que "désactivé".
export default function RegistreServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
