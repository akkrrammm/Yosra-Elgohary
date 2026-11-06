"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type AuthFormState, requestPasswordReset, signIn, updatePassword } from "@/lib/cms/actions/auth";
import { Button, inputClass } from "./ui";

const INITIAL: AuthFormState = {};

function Messages({ state }: { state: AuthFormState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-xl bg-pop/20 px-4 py-3 text-sm font-medium">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-xl bg-lime/40 px-4 py-3 text-sm font-medium">
          {state.message}
        </p>
      )}
    </>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loginState, login, loggingIn] = useActionState(signIn, INITIAL);
  const [resetState, sendReset, sending] = useActionState(requestPasswordReset, INITIAL);

  if (mode === "forgot") {
    return (
      <form action={sendReset} className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm leading-relaxed text-ink/70">Enter your email and we will send you a link to choose a new password.</p>
        <Messages state={resetState} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email</span>
          <input name="email" type="email" required autoComplete="email" dir="ltr" className={inputClass} />
        </label>
        <Button type="submit" loading={sending}>
          {sending ? "Sending..." : "Send reset link"}
        </Button>
        <button type="button" onClick={() => setMode("login")} className="text-sm font-semibold text-brand underline underline-offset-2">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form action={login} className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Sign in to your dashboard</h1>
      <Messages state={loginState} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Email</span>
        <input name="email" type="email" required autoComplete="username" dir="ltr" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Password</span>
        <input name="password" type="password" required autoComplete="current-password" dir="ltr" className={inputClass} />
      </label>
      <Button type="submit" loading={loggingIn}>
        {loggingIn ? "Signing in..." : "Sign in"}
      </Button>
      <button type="button" onClick={() => setMode("forgot")} className="text-sm font-semibold text-brand underline underline-offset-2">
        Forgot your password?
      </button>
    </form>
  );
}

/** Used both after a reset link and on the account page. */
export function NewPasswordForm({ doneHref, doneLabel }: { doneHref: string; doneLabel: string }) {
  const [state, action, saving] = useActionState(updatePassword, INITIAL);

  if (state.message) {
    return (
      <div className="flex flex-col gap-4">
        <Messages state={state} />
        <Link href={doneHref} className="inline-flex w-fit items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
          {doneLabel}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Messages state={state} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">New password</span>
        <input name="password" type="password" required minLength={10} autoComplete="new-password" dir="ltr" className={inputClass} />
        <span className="mt-1.5 block text-xs text-ink/65">At least 10 characters.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Repeat the new password</span>
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" dir="ltr" className={inputClass} />
      </label>
      <Button type="submit" loading={saving} className="w-fit">
        {saving ? "Saving..." : "Save new password"}
      </Button>
    </form>
  );
}
