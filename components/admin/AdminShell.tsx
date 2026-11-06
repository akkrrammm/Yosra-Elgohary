"use client";

import {
  BarChart3,
  ExternalLink,
  FolderKanban,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  Mail,
  Menu,
  Navigation,
  Search,
  Settings,
  Share2,
  Tags,
  User,
  UserCog,
  Workflow,
  X,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { signOut } from "@/lib/cms/actions/auth";
import { AdminProviders, useLeaveGuard } from "./providers";

type NavLink = { href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: { title?: string; links: NavLink[] }[] = [
  { links: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }] },
  {
    title: "Website content",
    links: [
      { href: "/admin/homepage", label: "Homepage", icon: Home },
      { href: "/admin/about", label: "About me", icon: User },
      { href: "/admin/services", label: "Services", icon: Layers },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/categories", label: "Project categories", icon: Tags },
      { href: "/admin/process", label: "Work process", icon: Workflow },
      { href: "/admin/achievements", label: "Results & achievements", icon: BarChart3 },
      { href: "/admin/contact", label: "Contact information", icon: Mail },
    ],
  },
  {
    title: "Website setup",
    links: [
      { href: "/admin/social", label: "Social media links", icon: Share2 },
      { href: "/admin/navigation", label: "Navigation & footer", icon: Navigation },
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/settings", label: "Website settings", icon: Settings },
      { href: "/admin/media", label: "Media library", icon: ImageIcon },
    ],
  },
  { title: "Your account", links: [{ href: "/admin/account", label: "Password", icon: UserCog }] },
];

function Sidebar({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const confirmLeave = useLeaveGuard();

  const onSignOut = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await confirmLeave()) await signOut();
  };

  return (
    <nav aria-label="Dashboard" className="on-dark flex h-full flex-col gap-5 bg-ink px-3 py-5 text-white">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 rounded-xl px-3 py-1">
        <NextImage src="/brand/logo-mark.png" alt="" width={30} height={32} className="h-8 w-auto" />
        <span className="font-heading text-lg font-bold tracking-tight">Dashboard</span>
      </Link>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1">
        {NAV_GROUPS.map((group, index) => (
          <div key={group.title ?? index}>
            {group.title && <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">{group.title}</p>}
            <ul className="flex flex-col gap-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-brand text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon aria-hidden className={`size-4 shrink-0 ${active ? "text-lime" : ""}`} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 border-t border-white/15 pt-4">
        <a
          href="/en"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-lime transition-colors hover:bg-white/10"
        >
          <ExternalLink aria-hidden className="size-4" />
          View website
        </a>
        <p className="truncate px-3 pt-2 text-xs text-white/60" title={email}>
          {email}
        </p>
        <form action={signOut} onSubmit={onSignOut}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white">
            <LogOut aria-hidden className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AdminProviders>
      <a href="#admin-main" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-lime px-5 py-3 font-semibold text-ink focus:translate-y-0">
        Skip to content
      </a>

      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar email={email} />
      </div>

      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <span className="font-heading font-bold">Dashboard</span>
        <button type="button" aria-label="Open dashboard menu" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full bg-white/10">
          <Menu aria-hidden className="size-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close dashboard menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/60" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <Sidebar email={email} onNavigate={() => setOpen(false)} />
            <button type="button" aria-label="Close dashboard menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-white">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      )}

      <main id="admin-main" tabIndex={-1} className="min-h-svh px-4 pb-28 pt-6 outline-none md:px-8 md:pt-10 lg:ml-64 lg:px-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </AdminProviders>
  );
}
