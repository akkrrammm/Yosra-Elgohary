import Image from "next/image";
import type { ReactNode } from "react";

/** The plain branded page around sign-in and other screens outside the dashboard. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-4 py-10">
      <div className="w-full max-w-md">
        <Image src="/brand/logo-lockup.png" alt="Yosra Elgohary" width={400} height={120} className="mx-auto mb-8 h-12 w-auto" />
        <div className="rounded-2xl bg-white p-6 text-ink shadow-2xl md:p-8">{children}</div>
      </div>
    </main>
  );
}

export function NotConnectedMessage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-2xl font-bold tracking-tight">The dashboard is not connected yet</h1>
      <p className="text-sm leading-relaxed text-ink/75">
        The website is showing its original content. To turn on editing, connect the Supabase project and run the setup commands described in the README, then reload this page.
      </p>
    </div>
  );
}
