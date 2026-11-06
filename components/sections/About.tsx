import Image from "next/image";
import { ParallaxImage } from "@/components/ui/Parallax";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollWords } from "@/components/ui/ScrollWords";
import { Sheet } from "@/components/ui/Sheet";
import type { SiteData } from "@/lib/cms/types";

export function About({ data, under = "bg-ink" }: { data: SiteData["about"]; under?: string }) {
  return (
    <Sheet id="about" under={under} labelledBy="about-title" className="on-light bg-soft pb-28 pt-32 text-ink md:pb-40 md:pt-48">
      <div className="mx-auto max-w-[1760px] px-[var(--gutter)]">
        <h2 id="about-title" className="eyebrow text-brand">
          {data.label}
        </h2>

        <ScrollWords
          text={data.statement}
          className="display mt-6 max-w-[17ch] text-[clamp(2.5rem,7.2vw,8rem)] rtl:max-w-[20ch]"
        />

        <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-14 md:mt-32">
          <div className="col-span-12 lg:col-span-7">
            {data.portrait && (
              <Reveal>
                <div className="fan relative aspect-[16/9] overflow-hidden bg-ink" style={{ "--fan-x": "30%", "--fan-y": "44%" } as React.CSSProperties}>
                  <ParallaxImage src={data.portrait.src} alt={data.portrait.alt} sizes="(min-width: 1024px) 58vw, 100vw" distance={6} />
                </div>
              </Reveal>
            )}
            {data.additional.length > 0 && (
              <Reveal delay={0.05}>
                <ul className="mt-4 grid grid-cols-3 gap-4">
                  {data.additional.map((image) => (
                    <li key={image.src} className="relative aspect-square overflow-hidden rounded-2xl bg-ink">
                      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 19vw, 33vw" quality={85} className="object-cover" />
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            {data.facts.length > 0 && (
              <Reveal delay={0.1}>
                <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  {data.facts.map((fact) => (
                    <div key={fact.label} className="border-t border-ink/15 pt-3">
                      <dt className="text-sm text-ink/70">{fact.label}</dt>
                      <dd className="mt-1 font-medium">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </div>

          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <Reveal>
              <p className="text-lg leading-relaxed md:text-xl">{data.lead}</p>
            </Reveal>

            {data.principles.length > 0 && (
              <>
                <Reveal delay={0.1}>
                  <h3 className="eyebrow mt-14 text-brand">{data.principlesTitle}</h3>
                </Reveal>
                <ol className="mt-5">
                  {data.principles.map((principle, index) => (
                    <li key={principle.title} className="border-t border-ink/15 py-6">
                      <Reveal delay={index * 0.06}>
                        <p className="display text-3xl">{principle.title}</p>
                        <p className="mt-3 leading-relaxed text-ink/80">{principle.text}</p>
                      </Reveal>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
