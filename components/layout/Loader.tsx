import Image from "next/image";
import type { CmsImage } from "@/lib/cms/types";

/** First-visit curtain. Runs on CSS alone and is skipped for the rest of the session. */
export function Loader({ logo }: { logo: CmsImage | null }) {
  return (
    <div className="loader" aria-hidden>
      {logo && <Image src={logo.src} alt="" width={76} height={80} className="loader__mark h-20 w-auto" />}
    </div>
  );
}
