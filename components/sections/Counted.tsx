import { Reveal } from "@/components/ui/Reveal";
import { Sheet } from "@/components/ui/Sheet";
import type { SiteData } from "@/lib/cms/types";

export function Counted({ data, under = "bg-soft" }: { data: SiteData["achievements"]; under?: string }) {
  return (
    <Sheet id="achievements" under={under} labelledBy="counted-title" className="on-light bg-pop py-20 text-ink md:py-28">
      <div className="mx-auto max-w-[1760px] px-[var(--gutter)]">
        <div className="ms-[8vw] flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h2 id="counted-title" className="display text-[clamp(2.25rem,5.5vw,5.5rem)]">
            {data.title}
          </h2>
          {data.note && <p className="font-medium">{data.note}</p>}
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {data.items.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.07} className="flex flex-col border-t-2 border-ink pt-4">
              <dt className="order-2 mt-2 max-w-[14rem] font-medium leading-snug">{item.label}</dt>
              <dd className="display order-1 text-[clamp(4rem,10vw,10rem)] leading-none">{item.value}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </Sheet>
  );
}
