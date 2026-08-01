type CategoriePerformance =
  | "EXPLOSIVITE_PUISSANCE"
  | "ENDURANCE"
  | "COLLECTIF_TACTIQUE"
  | "COMBAT"
  | "RENFORCEMENT_GENERAL";

// Personnage simple en SVG inline (pas de fichier image, pas de photo) :
// même forme de base, un accessoire différent selon la catégorie de sport.
function MascotteSvg({ categorie, taille }: { categorie?: CategoriePerformance | null; taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" className="anim-pop-in shrink-0" aria-hidden="true">
      <circle cx="32" cy="36" r="20" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
      <circle cx="25" cy="34" r="2.6" fill="var(--foreground)" />
      <circle cx="39" cy="34" r="2.6" fill="var(--foreground)" />
      <path d="M23 43 Q32 50 41 43" stroke="var(--foreground)" strokeWidth="2.25" fill="none" strokeLinecap="round" />

      {categorie === "EXPLOSIVITE_PUISSANCE" && (
        <path d="M35 4 L23 26 L31 26 L27 46 L45 20 L34 20 Z" fill="var(--gold)" />
      )}
      {categorie === "ENDURANCE" && <rect x="11" y="21" width="42" height="6" rx="3" fill="var(--primary)" />}
      {categorie === "COLLECTIF_TACTIQUE" && (
        <>
          <circle cx="50" cy="15" r="7" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
          <path d="M46 12 L54 18 M54 12 L46 18" stroke="var(--primary)" strokeWidth="1.2" />
        </>
      )}
      {categorie === "COMBAT" && (
        <>
          <rect x="11" y="19" width="42" height="6" rx="3" fill="var(--primary)" />
          <circle cx="47" cy="22" r="4" fill="var(--primary-hover)" />
        </>
      )}
      {categorie === "RENFORCEMENT_GENERAL" && (
        <g>
          <rect x="7" y="32" width="8" height="8" rx="1.5" fill="var(--primary)" />
          <rect x="49" y="32" width="8" height="8" rx="1.5" fill="var(--primary)" />
          <rect x="15" y="35" width="34" height="2.5" fill="var(--primary)" />
        </g>
      )}
    </svg>
  );
}

export default function Mascotte({
  categorie,
  message,
  taille = 52,
  className,
  children,
}: {
  categorie?: CategoriePerformance | null;
  message: string;
  taille?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <MascotteSvg categorie={categorie} taille={taille} />
      <div className="flex-1">
        <div
          className="card rounded-tl-none px-3.5 py-2.5 text-sm leading-relaxed"
          style={{ borderColor: "var(--primary)" }}
        >
          {message}
        </div>
        {children}
      </div>
    </div>
  );
}
