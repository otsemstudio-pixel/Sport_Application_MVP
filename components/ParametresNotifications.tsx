"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

type Frequence = "DESACTIVE" | "QUOTIDIEN" | "QUELQUES_FOIS_SEMAINE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// La demande de permission (Notification.requestPermission + subscribe)
// n'a lieu qu'ici, au moment où l'athlète choisit explicitement une
// fréquence autre que "désactivé" — jamais au chargement de l'app.
export default function ParametresNotifications({ preferenceInitiale }: { preferenceInitiale: Frequence }) {
  const router = useRouter();
  const t = useTranslations("notifications");
  const [preference, setPreference] = useState<Frequence>(preferenceInitiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function activerAbonnement() {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("non-supporte");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("refuse");

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });
    }
    const json = subscription.toJSON();
    await fetch("/api/notifications/abonnement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
  }

  async function choisir(valeur: Frequence) {
    setErreur(null);
    setChargement(true);
    try {
      if (valeur !== "DESACTIVE") {
        await activerAbonnement();
      } else if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        await subscription?.unsubscribe();
      }
      const res = await fetch("/api/profil/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferenceNotifications: valeur }),
      });
      if (!res.ok) throw new Error("echec");
      setPreference(valeur);
      router.refresh();
    } catch {
      setErreur(t("erreurActivation"));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <h2 className="font-semibold">{t("titre")}</h2>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {t("description")}
      </p>
      <div className="pill-toggle">
        {(["DESACTIVE", "QUELQUES_FOIS_SEMAINE", "QUOTIDIEN"] as const).map((v) => (
          <button
            key={v}
            disabled={chargement}
            onClick={() => choisir(v)}
            className={`pill-toggle-btn ${preference === v ? "active" : ""}`}
          >
            {t(`frequence.${v}`)}
          </button>
        ))}
      </div>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
    </div>
  );
}
