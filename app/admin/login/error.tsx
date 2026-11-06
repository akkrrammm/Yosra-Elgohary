"use client";

import { AuthFrame } from "@/components/admin/AuthFrame";

/** A lost connection while signing in, shown on the same plain page as the form. */
export default function LoginError({ retry }: { retry: () => void }) {
  return (
    <AuthFrame>
      <div role="alert" className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Could not sign in</h1>
        <p className="text-sm leading-relaxed text-ink/75">Please check your connection and try again.</p>
        <button type="button" onClick={() => retry()} className="w-fit rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    </AuthFrame>
  );
}
