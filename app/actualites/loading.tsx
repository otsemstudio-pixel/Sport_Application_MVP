export default function ChargementActualites() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-72" />
      </div>

      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card flex flex-col gap-3 p-4 sm:flex-row">
          <div className="skeleton h-44 w-full shrink-0 sm:h-28 sm:w-40" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
