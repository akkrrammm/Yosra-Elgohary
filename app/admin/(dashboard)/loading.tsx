import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <p role="status" className="flex items-center gap-3 py-16 text-ink/70">
      <LoaderCircle aria-hidden className="size-5 animate-spin" />
      Loading...
    </p>
  );
}
