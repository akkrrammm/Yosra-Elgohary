import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="font-heading text-2xl font-bold tracking-tight">We could not find that page</h1>
      <p className="mt-2 text-ink/75">It may have been deleted, or the address may be wrong.</p>
      <Link href="/admin" className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
        Back to the overview
      </Link>
    </div>
  );
}
