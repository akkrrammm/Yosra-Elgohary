import Image from "next/image";
import { ArrowOut, PlayGlyph } from "@/components/ui/Arrow";
import { Reveal } from "@/components/ui/Reveal";
import type { ResolvedProject } from "@/lib/cms/types";

/**
 * Plays the video here when a file has been uploaded in the CMS. Behance's player
 * cannot be embedded on other sites, so without a file the frame links out to Behance.
 */
export function VideoBlock({ project, watchLabel }: { project: ResolvedProject; watchLabel: string }) {
  const { coverImage: cover, coverBackground: background, video, behanceUrl } = project;

  if (video?.src) {
    return (
      <Reveal>
        <video
          controls
          playsInline
          preload="metadata"
          poster={cover.src}
          className="aspect-video w-full rounded-[clamp(1rem,2vw,2rem)] bg-ink"
        >
          <source src={video.src} />
        </video>
      </Reveal>
    );
  }

  const frameClass = "group relative block aspect-[4/3] overflow-hidden rounded-[clamp(1rem,2vw,2rem)] md:aspect-[16/9]";
  const poster = (
    <Image
      src={cover.src}
      alt={cover.alt}
      fill
      sizes="(min-width: 1760px) 1700px, 96vw"
      quality={85}
      className={`transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.03] ${
        background ? "object-contain" : "object-cover"
      }`}
    />
  );

  if (!behanceUrl) {
    return (
      <Reveal>
        <div className={frameClass} style={{ background }}>
          {poster}
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <a href={behanceUrl} target="_blank" rel="noopener noreferrer" className={frameClass} style={{ background }}>
        {poster}
        <span className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-ink/70 to-transparent p-6 pt-24 md:p-10 md:pt-32">
          <span className="inline-flex items-center gap-3 rounded-full bg-lime px-6 py-4 font-semibold text-ink transition-colors group-hover:bg-soft">
            <PlayGlyph className="text-lg" />
            {watchLabel}
            <ArrowOut />
          </span>
        </span>
      </a>
    </Reveal>
  );
}
