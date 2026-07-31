export default function ChargementOrganisateur() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-3.5 w-28" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
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

      <section className="grid grid-cols-2 gap-3">
        <div className="card skeleton h-20" />
        <div className="card skeleton h-20" />
      </section>

      <div className="card skeleton h-64" />

      <div className="flex flex-col gap-3">
        <div className="skeleton h-5 w-32" />
        {[0, 1].map((i) => (
          <div key={i} className="card skeleton h-16" />
        ))}
      </div>
    </div>
  );
}
