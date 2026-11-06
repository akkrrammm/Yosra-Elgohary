import Link from "next/link";
import { Arrow, ArrowOut } from "@/components/ui/Arrow";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { Sheet } from "@/components/ui/Sheet";
import { TitleText } from "@/components/ui/TitleText";
import { splitTitle } from "@/lib/cms/titles";
import type { ProjectLabels, ResolvedProject } from "@/lib/cms/types";
import { dirOf, hasArabic, type Locale } from "@/lib/i18n";
import { Gallery } from "./Gallery";
import { VideoBlock } from "./VideoBlock";

type Props = { project: ResolvedProject; next: ResolvedProject; lang: Locale; labels: ProjectLabels };

/** Renders whatever a project has. Sections with no source material simply do not appear. */
export function CaseStudy({ project, next, lang, labels }: Props) {
  const { main, sub } = splitTitle(project.title);
  const study = project.caseStudy;
  const nextTitle = splitTitle(next.title);

  const narrative = [
    { label: labels.overview, text: study.overview },
    { label: labels.context, text: study.context },
    { label: labels.objective, text: study.objective },
    { label: labels.direction, text: study.direction },
    { label: labels.contentStrategy, text: study.strategy },
  ].filter((item): item is { label: string; text: string } => Boolean(item.text));

  const meta = [
    project.client ? { label: labels.client, values: [project.client] } : null,
    project.role ? { label: labels.role, values: project.role } : null,
    project.tools.length ? { label: labels.tools, values: project.tools } : null,
    project.deliverables ? { label: labels.deliverables, values: project.deliverables } : null,
  ].filter((item): item is { label: string; values: string[] } => item !== null);

  // The lead visual already shows the cover, so the gallery starts from the next page.
  const gallery = project.gallery.filter((image) => project.video || image.src !== project.coverImage.src);

  const hasStudy = narrative.length > 0 || study.highlights.length > 0 || study.palette.length > 0;

  return (
    <article>
      {/* Header */}
      <header className="relative overflow-clip bg-ink px-[var(--gutter)] pb-12 pt-32 text-soft md:pb-16 md:pt-40">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(55%_70%_at_80%_10%,rgb(108_59_255/0.25),transparent_70%)] rtl:-scale-x-100" />
        <div className="relative mx-auto max-w-[1760px]">
          <Link href={`/${lang}#work`} className="group inline-flex items-center gap-2 text-sm font-medium text-soft/80 transition-colors hover:text-lime">
            <Arrow className="rotate-180 transition-transform duration-300 group-hover:translate-x-[calc(var(--dir)*-3px)]" />
            {labels.back}
          </Link>

          <p className="eyebrow fade-up mt-10 flex flex-wrap items-center gap-3 text-pop">
            {project.categoryLabel}
            {project.draft && <span className="rounded-full bg-lime px-3 py-1 text-ink">{labels.draftBadge}</span>}
          </p>
          <h1 className="display mt-4 max-w-[20ch] text-[clamp(2.75rem,8vw,9rem)]">
            <TitleText text={project.title}>
              <span className="mask">
                <span className="rise">{main}</span>
              </span>
              {sub && (
                <span className="mask">
                  <span className="rise accent text-pop" style={{ "--i": 1 } as React.CSSProperties}>
                    {sub}
                  </span>
                </span>
              )}
            </TitleText>
          </h1>

          <div className="mt-10 grid grid-cols-12 items-end gap-x-6 gap-y-8">
            <p className="fade-up col-span-12 max-w-3xl text-lg leading-relaxed text-soft/85 md:text-xl lg:col-span-8">{project.description}</p>
            <div className="col-span-12 lg:col-span-4 lg:justify-self-end">
              {project.behanceUrl && (
                <a
                  href={project.behanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-semibold ring-1 ring-soft/30 transition-colors hover:bg-lime hover:text-ink hover:ring-lime"
                >
                  {labels.viewOnBehance}
                  <ArrowOut className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Lead visual */}
      <div className="bg-ink px-[var(--gutter)] pb-20 md:pb-28">
        <div className="mx-auto max-w-[1760px]">
          {project.video ? (
            <VideoBlock project={project} watchLabel={labels.watchOnBehance} />
          ) : (
            <ImageReveal
              src={project.coverImage.src}
              alt={project.coverImage.alt}
              sizes="(min-width: 1760px) 1700px, 96vw"
              quality={85}
              className="w-full rounded-[clamp(1rem,2vw,2rem)]"
              style={{ aspectRatio: `${project.coverImage.width} / ${project.coverImage.height}` }}
            />
          )}
        </div>
      </div>

      {/* Details */}
      <Sheet under="bg-ink" className="on-light bg-soft pb-24 pt-24 text-ink md:pb-32 md:pt-36">
        <div className="mx-auto max-w-[1760px] px-[var(--gutter)]">
          {study.quote && (
            <Reveal>
              <p
                dir={hasArabic(study.quote) ? "rtl" : "ltr"}
                className="display accent ms-[6vw] text-[clamp(2.5rem,6.5vw,7rem)] text-brand rtl:text-right"
              >
                “{study.quote}”
              </p>
            </Reveal>
          )}

          <div className={`grid grid-cols-12 gap-x-6 gap-y-14 ${study.quote ? "mt-20" : ""}`}>
            <dl className={`col-span-12 ${hasStudy ? "lg:sticky lg:top-24 lg:col-span-4 lg:self-start" : "lg:col-span-12 lg:grid lg:grid-cols-4 lg:gap-6"}`}>
              {meta.map((item) => (
                <div key={item.label} className="border-t border-ink/15 py-5">
                  <dt className="text-sm text-ink/70">{item.label}</dt>
                  <dd className="mt-2">
                    <ul className="space-y-1 font-medium">
                      {item.values.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>

            {hasStudy && (
              <div className="col-span-12 lg:col-span-7 lg:col-start-6">
                {narrative.map((item, index) => (
                  <Reveal key={item.label} delay={index * 0.04} className="border-t border-ink/15 py-7">
                    <h2 className="eyebrow text-brand">{item.label}</h2>
                    <p className="mt-3 text-xl leading-relaxed md:text-2xl">{item.text}</p>
                  </Reveal>
                ))}

                {study.highlights.length > 0 && (
                  <Reveal className="border-t border-ink/15 py-7">
                    <h2 className="eyebrow text-brand">{labels.system}</h2>
                    <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                      {study.highlights.map((item) => (
                        <div key={item.title}>
                          <dt className="display text-2xl">{item.title}</dt>
                          <dd className="mt-2 leading-relaxed text-ink/80">{item.text}</dd>
                        </div>
                      ))}
                    </dl>
                  </Reveal>
                )}

                {study.palette.length > 0 && (
                  <Reveal className="border-t border-ink/15 py-7">
                    <h2 className="eyebrow text-brand">{labels.palette}</h2>
                    <ul dir="ltr" className="mt-5 flex h-48 overflow-hidden rounded-2xl ring-1 ring-ink/10">
                      {study.palette.map((color) => (
                        <li key={color.hex} className="min-w-16" style={{ background: color.hex, flexGrow: parseInt(color.share, 10) }}>
                          <span className="sr-only">
                            {color.name}, {color.hex}, {color.share}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <ul dir="ltr" className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 rtl:text-right" aria-hidden>
                      {study.palette.map((color) => (
                        <li key={color.hex}>
                          <span className="block font-medium">{color.name}</span>
                          <span className="text-ink/70">
                            {color.hex} · {color.share}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                )}
              </div>
            )}
          </div>
        </div>
      </Sheet>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section aria-labelledby="gallery-title" className="bg-soft">
          <div className="sheet bg-ink px-[var(--gutter)] pb-20 pt-24 text-soft md:pt-36">
            <div className="mx-auto max-w-[1760px]">
              <h2 id="gallery-title" className="display mb-10 ms-[8vw] text-[clamp(2.25rem,5.5vw,5.5rem)] md:mb-16">
                {project.video ? labels.relatedVisuals : labels.gallery}
              </h2>
              <Gallery images={gallery} labels={labels.lightbox} isRtl={dirOf(lang) === "rtl"} />
            </div>
          </div>
        </section>
      )}

      {/* Next project */}
      <div className={gallery.length > 0 ? "bg-ink" : "bg-soft"}>
        <Link
          href={`/${lang}/work/${next.slug}`}
          className="sheet group block bg-brand px-[var(--gutter)] pb-16 pt-20 text-soft md:pb-24 md:pt-32"
        >
          <span className="mx-auto block max-w-[1760px]">
            <span className="eyebrow ms-[8vw] flex items-center gap-3 text-lime">
              {labels.next}
              <Arrow className="transition-transform duration-500 group-hover:translate-x-[calc(var(--dir)*8px)]" />
            </span>
            <TitleText text={next.title} className="display mt-4 block text-[clamp(2.5rem,8vw,9rem)]">
              {nextTitle.main}
              {nextTitle.sub && <span className="accent block text-[0.7em] text-lime">{nextTitle.sub}</span>}
            </TitleText>
          </span>
        </Link>
      </div>
    </article>
  );
}
