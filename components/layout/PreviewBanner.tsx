import { exitPreview } from "@/lib/cms/preview-actions";

/** Shown only to an administrator previewing unpublished content. */
export function PreviewBanner({ exitPath }: { exitPath: string }) {
  return (
    <aside
      role="status"
      dir="ltr"
      className="fixed inset-x-0 bottom-4 z-[95] mx-auto flex w-fit items-center gap-4 rounded-full bg-lime py-2 pe-2 ps-5 text-sm font-semibold text-ink shadow-xl"
    >
      Preview: visitors cannot see unpublished content
      <form action={exitPreview.bind(null, exitPath)}>
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-soft">
          Exit preview
        </button>
      </form>
    </aside>
  );
}
