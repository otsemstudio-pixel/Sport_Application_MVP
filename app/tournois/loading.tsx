export default function ChargementTournois() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-7 w-28" />

      <div className="card skeleton h-14" />

      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col overflow-hidden">
            <div className="skeleton h-40 w-full rounded-none" />
            <div className="flex flex-col gap-2 p-5">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
