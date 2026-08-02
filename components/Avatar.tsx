import Image from "next/image";

export default function Avatar({
  url,
  nom,
  taille = 36,
  className = "",
}: {
  url: string | null | undefined;
  nom: string;
  taille?: number;
  className?: string;
}) {
  if (url) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ width: taille, height: taille }}
      >
        <Image src={url} alt="" fill sizes={`${taille}px`} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
      style={{
        width: taille,
        height: taille,
        fontSize: Math.max(11, taille * 0.4),
        background: "var(--primary-soft)",
        color: "var(--primary)",
      }}
    >
      {nom.trim()[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
