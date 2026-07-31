export default function ChargementProfil() {
  return (
    <div className="flex flex-col gap-6">
      <div className="card flex items-center gap-4 p-6">
        <div className="skeleton h-16 w-16 shrink-0 rounded-2xl" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3.5 w-40" />
        </div>
      </div>

      <div className="card grid grid-cols-5 gap-1 p-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-1">
            <div className="skeleton h-4 w-4 rounded-full" />
            <div className="skeleton h-3.5 w-6" />
            <div className="skeleton h-2 w-8" />
          </div>
        ))}
      </div>

      <div className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="skeleton h-3.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
