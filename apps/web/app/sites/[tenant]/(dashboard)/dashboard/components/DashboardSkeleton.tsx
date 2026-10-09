const Block = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-xl border border-[#ece9e2] bg-[#f5f4f0] ${className}`} />
);

const DashboardSkeleton = () => (
  <div aria-busy="true" aria-label="Loading dashboard">
    <div className="mb-5 space-y-2">
      <div className="h-6 w-56 animate-pulse rounded bg-[#ece9e2]" />
      <div className="h-3 w-72 animate-pulse rounded bg-[#f1efe9]" />
    </div>
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Block key={i} className="h-[92px]" />
      ))}
    </section>
    <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.65fr_0.95fr]">
      <Block className="h-56" />
      <Block className="h-56" />
    </section>
    <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
      <Block className="h-44" />
      <Block className="h-44" />
      <Block className="h-44" />
    </section>
  </div>
);

export default DashboardSkeleton;
