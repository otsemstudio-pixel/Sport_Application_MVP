import { Flame } from "lucide-react";

export default function SerieAssiduite({
  serieActuelle,
  recordSerie,
  label,
  labelRecord,
}: {
  serieActuelle: number;
  recordSerie: number;
  label: string;
  labelRecord: string;
}) {
  return (
    <div className="stat-card-rich flex flex-col items-center gap-1.5 py-5">
      <div className="badge-icon-circle h-10 w-10">
        <Flame size={18} />
      </div>
      <span className="text-xl font-bold">{serieActuelle}</span>
      <span className="text-[11px]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
        {labelRecord}
      </span>
    </div>
  );
}
