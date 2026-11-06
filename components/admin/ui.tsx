"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const BUTTON_VARIANTS = {
  primary: "bg-brand text-white hover:bg-ink",
  secondary: "bg-white text-ink ring-1 ring-ink/15 hover:bg-soft",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-pop text-ink hover:bg-ink hover:text-white",
  lime: "bg-lime text-ink hover:bg-white",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, disabled, children, className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-sm"
      } ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Brings the first highlighted field into view once the messages have rendered. */
export function scrollToFirstError() {
  requestAnimationFrame(() => {
    document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export const inputClass =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/45 focus:border-brand focus:outline-2 focus:outline-brand/30 aria-invalid:border-pop aria-invalid:ring-1 aria-invalid:ring-pop";

export function Card({
  title,
  description,
  actions,
  children,
  id,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5 md:p-7">
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-heading text-xl font-bold tracking-tight">{title}</h2>}
            {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/70">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const BADGE_TONES = {
  neutral: "bg-ink/10 text-ink",
  live: "bg-lime text-ink",
  draft: "bg-soft text-brand ring-1 ring-brand/30",
  warn: "bg-pop/20 text-ink",
  brand: "bg-brand text-white",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/15 px-6 py-12 text-center">
      <p className="font-heading text-lg font-bold">{title}</p>
      {children && <div className="mt-3 text-sm text-ink/70">{children}</div>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  hideLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span
        aria-hidden
        className="relative h-6 w-11 shrink-0 rounded-full bg-ink/25 transition-colors peer-checked:bg-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
      <span className={hideLabel ? "sr-only" : ""}>{label}</span>
    </label>
  );
}
