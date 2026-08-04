export default function ChargementArticle() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-4 w-32" />

      <div className="card flex flex-col gap-4 overflow-hidden p-0">
        <div className="skeleton h-56 w-full rounded-none sm:h-72" />
        <div className="flex flex-col gap-3 px-5 pb-5">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-3 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>

      <div className="card skeleton h-32" />
    </div>
  );
}
