export default function ChargementEntrainement() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-28" />
      </div>

      <section className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col items-center gap-2 py-4">
            <div className="skeleton h-5 w-5 rounded-full" />
            <div className="skeleton h-5 w-8" />
            <div className="skeleton h-3 w-12" />
          </div>
        ))}
      </section>

      <div className="card flex flex-col gap-3 p-5">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton h-48 w-full" />
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="card skeleton h-20" />
        <div className="card skeleton h-20" />
      </section>

      <div className="card flex flex-col gap-4 p-5">
        <div className="skeleton h-5 w-44" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}
