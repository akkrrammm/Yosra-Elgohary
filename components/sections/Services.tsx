"use client";

import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CmsIcon } from "@/components/ui/CmsIcon";
import { Sheet } from "@/components/ui/Sheet";
import type { SiteData } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n";

export function Services({ lang, data, under = "bg-soft" }: { lang: Locale; data: SiteData["services"]; under?: string }) {
  const [active, setActive] = useState(0);
  const preview = data.items[active]?.preview;

  return (
    <Sheet id="services" under={under} labelledBy="services-title" className="bg-brand pb-28 pt-28 text-soft md:pb-36 md:pt-44">
      <div className="mx-auto grid max-w-[1760px] grid-cols-12 gap-x-6 gap-y-12 px-[var(--gutter)]">
        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow text-lime">{data.label}</p>
            <h2 id="services-title" className="display mt-4 text-[clamp(3.25rem,8vw,8.5rem)]">
              {data.title}
            </h2>

            {/* The work behind whichever service is in focus */}
            <div className="fan relative mt-10 hidden aspect-[4/3] max-w-[34rem] overflow-hidden bg-ink lg:block" style={{ "--fan-x": "34%", "--fan-y": "40%" } as React.CSSProperties}>
              <AnimatePresence initial={false}>
                {preview && (
                  <m.div
                    key={preview.key}
                    className="absolute inset-0"
                    style={{ background: preview.background }}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src={preview.image.src}
                      alt=""
                      fill
                      sizes="34rem"
                      quality={85}
                      className={preview.background ? "object-contain" : "object-cover"}
                    />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <ul className="col-span-12 lg:col-span-7">
          {data.items.map((service, index) => (
            <li
              key={service.id}
              onMouseEnter={() => setActive(index)}
              onFocusCapture={() => setActive(index)}
              className="group border-t border-soft/25 py-7 last:border-b md:py-9"
            >
              <div className="flex items-baseline gap-4 md:gap-6">
                <span aria-hidden className="w-7 shrink-0 text-sm tabular-nums text-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`display flex items-center gap-3 text-[clamp(2rem,4vw,3.75rem)] transition-all duration-500 ease-[var(--ease-expo)] ${
                      active === index ? "lg:translate-x-[calc(var(--dir)*0.75rem)] lg:text-lime" : ""
                    }`}
                  >
                    <CmsIcon name={service.icon} className="size-[0.8em] shrink-0" />
                    {service.name}
                  </h3>
                  {service.description && <p className="mt-3 max-w-2xl leading-relaxed text-soft">{service.description}</p>}
                  {service.proof.length > 0 && (
                    <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className="me-1 text-soft">{data.seenIn}</span>
                      {service.proof.map((proof) => (
                        <Link
                          key={proof.slug}
                          href={`/${lang}/work/${proof.slug}`}
                          className="rounded-full px-3 py-1 font-medium ring-1 ring-soft/40 transition-colors hover:bg-lime hover:text-ink hover:ring-lime"
                        >
                          <bdi>{proof.label}</bdi>
                        </Link>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
