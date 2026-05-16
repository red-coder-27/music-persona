export default function Loading() {
  return (
    <main className="page-shell min-h-screen py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-28 rounded-[2rem] bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="h-96 rounded-[2rem] bg-white/5" />
          <div className="h-96 rounded-[2rem] bg-white/5" />
        </div>
        <div className="h-40 rounded-[2rem] bg-white/5" />
        <div className="h-52 rounded-[2rem] bg-white/5" />
      </div>
    </main>
  );
}
