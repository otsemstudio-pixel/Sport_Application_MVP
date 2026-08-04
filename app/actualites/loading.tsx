export default function ChargementActualites() {
  return (
    <div className="flex flex-col gap-5">
      <div className="skeleton h-7 w-32" />

      <div className="skeleton h-11 w-full" />

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-40 w-64 shrink-0" />
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
