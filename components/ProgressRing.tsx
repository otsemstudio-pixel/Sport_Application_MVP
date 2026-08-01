export default function ProgressRing({
  pourcentage,
  taille = 88,
  epaisseur = 8,
  children,
}: {
  pourcentage: number;
  taille?: number;
  epaisseur?: number;
  children?: React.ReactNode;
}) {
  const rayon = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * rayon;
  const valeur = Math.min(100, Math.max(0, pourcentage));
  const decalage = circonference * (1 - valeur / 100);

  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} className="-rotate-90">
        <circle cx={taille / 2} cy={taille / 2} r={rayon} fill="none" stroke="var(--surface-hover)" strokeWidth={epaisseur} />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={decalage}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
