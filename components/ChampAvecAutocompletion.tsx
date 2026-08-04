"use client";

import { useRef, useState } from "react";

type Suggestion = { valeur: string; libelle: string };
type Declencheur = { type: "#" | "@"; debut: number; requete: string };

function detecterDeclencheur(texte: string, positionCurseur: number): Declencheur | null {
  const avant = texte.slice(0, positionCurseur);
  const match = avant.match(/(?:^|\s)([#@])([a-zA-Z0-9_]*)$/);
  if (!match) return null;
  return { type: match[1] as "#" | "@", requete: match[2], debut: positionCurseur - match[2].length - 1 };
}

export default function ChampAvecAutocompletion({
  value,
  onChange,
  placeholder,
  maxLength,
  rows,
  className,
  onKeyDown,
  multiline = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const declencheurRef = useRef<Declencheur | null>(null);

  async function gererChangement(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    const texte = e.target.value;
    onChange(texte);
    const position = e.target.selectionStart ?? texte.length;
    const decl = detecterDeclencheur(texte, position);
    declencheurRef.current = decl;
    if (!decl || decl.requete.length === 0) {
      setSuggestions([]);
      return;
    }
    const url =
      decl.type === "@"
        ? `/api/utilisateurs/recherche?q=${encodeURIComponent(decl.requete)}`
        : `/api/hashtags/recherche?q=${encodeURIComponent(decl.requete)}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    // Le champ peut avoir changé pendant l'attente réseau : on ignore une
    // réponse devenue obsolète.
    if (declencheurRef.current === decl) setSuggestions(data);
  }

  function choisir(suggestion: Suggestion) {
    const decl = declencheurRef.current;
    if (!decl || !ref.current) return;
    const positionCurseur = ref.current.selectionStart ?? value.length;
    const avant = value.slice(0, decl.debut);
    const apres = value.slice(positionCurseur);
    const insere = `${decl.type}${suggestion.valeur} `;
    const nouveauTexte = avant + insere + apres;
    onChange(nouveauTexte);
    setSuggestions([]);
    declencheurRef.current = null;
    requestAnimationFrame(() => {
      const pos = avant.length + insere.length;
      ref.current?.setSelectionRange(pos, pos);
      ref.current?.focus();
    });
  }

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement | null>}
          value={value}
          onChange={gererChangement}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={className}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement | null>}
          value={value}
          onChange={gererChangement}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className={className}
        />
      )}
      {suggestions.length > 0 && (
        <div
          className="card absolute z-20 mt-1 w-full max-w-xs overflow-hidden p-1 shadow-lg"
          style={{ background: "var(--surface)" }}
        >
          {suggestions.map((s) => (
            <button
              key={s.valeur}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choisir(s)}
              className="surface-hover flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm"
            >
              {s.libelle}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
