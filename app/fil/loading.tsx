export default function ChargementFil() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-7 w-24" />

      <div className="card skeleton h-24" />

      <div className="pill-toggle">
        <div className="pill-toggle-btn skeleton h-8" />
        <div className="pill-toggle-btn skeleton h-8" />
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="card flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2.5">
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <div className="skeleton h-3.5 w-28" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
