"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui";

/* -------------------------------------------------------------------------- */
/*  Toasts                                                                    */
/* -------------------------------------------------------------------------- */

type Toast = { id: number; tone: "success" | "error"; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast needs AdminProviders");
  return context;
}

/* -------------------------------------------------------------------------- */
/*  Confirmation dialog                                                       */
/* -------------------------------------------------------------------------- */

type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; danger?: boolean };
type PendingConfirm = ConfirmOptions & { resolve: (confirmed: boolean) => void };

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm needs AdminProviders");
  return context;
}

function ConfirmDialog({ pending, onClose }: { pending: PendingConfirm | null; onClose: (confirmed: boolean) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending && !dialog.open) dialog.showModal();
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose(false);
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-ink shadow-2xl"
    >
      {pending && (
        <>
          <h2 id="confirm-title" className="font-heading text-xl font-bold tracking-tight">
            {pending.title}
          </h2>
          {pending.message && <p className="mt-2 text-sm leading-relaxed text-ink/75">{pending.message}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onClose(false)} autoFocus>
              Cancel
            </Button>
            <Button variant={pending.danger ? "danger" : "primary"} onClick={() => onClose(true)}>
              {pending.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Unsaved changes                                                           */
/* -------------------------------------------------------------------------- */

const UnsavedContext = createContext<((id: string, dirty: boolean) => void) | null>(null);

/** Warns before leaving the page while this form has changes that have not been saved. */
export function useUnsavedChanges(id: string, dirty: boolean) {
  const report = useContext(UnsavedContext);
  if (!report) throw new Error("useUnsavedChanges needs AdminProviders");
  useEffect(() => {
    report(id, dirty);
    return () => report(id, false);
  }, [id, dirty, report]);
}

const LeaveGuardContext = createContext<(() => Promise<boolean>) | null>(null);

/** Asks before an action that leaves the page, such as signing out. True means carry on. */
export function useLeaveGuard() {
  const context = useContext(LeaveGuardContext);
  if (!context) throw new Error("useLeaveGuard needs AdminProviders");
  return context;
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

export function AdminProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const nextId = useRef(1);
  const dirtyForms = useRef(new Set<string>());

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (tone: Toast["tone"], message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      // Errors stay until they are dismissed or replaced: they may need reading twice.
      if (tone === "success") setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const toastApi = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
    }),
    [show],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const closeConfirm = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  const reportDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyForms.current.add(id);
    else dirtyForms.current.delete(id);
  }, []);

  const confirmLeave = useCallback(async () => {
    if (dirtyForms.current.size === 0) return true;
    const leave = await confirm({
      title: "Leave without saving?",
      message: "You have changes on this page that have not been saved.",
      confirmLabel: "Leave without saving",
      danger: true,
    });
    if (leave) dirtyForms.current.clear();
    return leave;
  }, [confirm]);

  // Closing or reloading the tab.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyForms.current.size > 0) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Following a link inside the dashboard.
  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      if (dirtyForms.current.size === 0 || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      if (await confirmLeave()) router.push(url.pathname + url.search);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [confirmLeave, router]);

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirm}>
        <UnsavedContext.Provider value={reportDirty}>
          <LeaveGuardContext.Provider value={confirmLeave}>{children}</LeaveGuardContext.Provider>
          <ConfirmDialog pending={pending} onClose={closeConfirm} />
          <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role={toast.tone === "error" ? "alert" : "status"}
                className={`pointer-events-auto flex max-w-xl items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-xl ${
                  toast.tone === "success" ? "bg-ink text-white" : "bg-pop text-ink"
                }`}
              >
                {toast.tone === "success" ? (
                  <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" />
                ) : (
                  <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                )}
                <span className="min-w-0">{toast.message}</span>
                <button type="button" aria-label="Dismiss" onClick={() => dismiss(toast.id)} className="-mr-1 shrink-0 rounded-full p-0.5 hover:bg-black/10">
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </UnsavedContext.Provider>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
