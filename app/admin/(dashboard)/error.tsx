"use client";

import { useEffect } from "react";

export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="font-heading text-2xl font-bold tracking-tight">This page could not be loaded</h1>
      <p className="mt-2 text-ink/75">Your saved content is safe. Please check your connection and try again.</p>
      <button type="button" onClick={() => retry()} className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
