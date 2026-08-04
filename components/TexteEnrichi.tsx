"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hrefProfil } from "@/lib/routes";

type CompteMentionne = { id: string; type: "ATHLETE" | "ORGANISATEUR"; nom: string };

// #hashtag ou @mention : capturé (groupe) pour que String.split conserve les
// séparateurs dans le résultat, en alternance avec le texte brut autour.
const REGEX_TOKEN = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;

// Rend le texte d'un post/commentaire avec hashtags et mentions cliquables.
// Résout ses propres mentions via un petit appel réseau (une seule requête
// par bloc de texte, pas de plomberie à ajouter dans les routes existantes)
// — un hashtag mène toujours vers /hashtag/[tag] (il existe forcément,
// créé au moment de la publication), une mention seulement si le
// nomUtilisateur correspond à un compte réel, sinon affichée en texte brut.
export default function TexteEnrichi({ texte }: { texte: string }) {
  const [mentionsResolues, setMentionsResolues] = useState<Record<string, CompteMentionne>>({});

  useEffect(() => {
    if (!texte.includes("@")) {
      setMentionsResolues({});
      return;
    }
    const params = new URLSearchParams({ texte });
    fetch(`/api/mentions/resoudre?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then(setMentionsResolues)
      .catch(() => {});
  }, [texte]);

  const segments = texte.split(REGEX_TOKEN);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.startsWith("#") && segment.length > 1) {
          return (
            <Link
              key={index}
              href={`/hashtag/${segment.slice(1).toLowerCase()}`}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              {segment}
            </Link>
          );
        }
        if (segment.startsWith("@") && segment.length > 1) {
          const compte = mentionsResolues[segment.slice(1).toLowerCase()];
          if (compte) {
            return (
              <Link
                key={index}
                href={hrefProfil(compte.type, compte.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ color: "var(--primary)", fontWeight: 600 }}
              >
                {segment}
              </Link>
            );
          }
        }
        return <span key={index}>{segment}</span>;
      })}
    </>
  );
}
