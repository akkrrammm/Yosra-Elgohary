"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { CmsIcon } from "@/components/ui/CmsIcon";
import { Sheet } from "@/components/ui/Sheet";
import type { CmsImage, SiteData } from "@/lib/cms/types";

type Portrait = CmsImage;

const CENTER = 320;
const RADIUS = 296;

function Dial({ count, active, portrait }: { count: number; active: number; portrait: Portrait | null }) {
  const nodes = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <div className="absolute inset-[13%] overflow-hidden rounded-full bg-ink">
        {portrait && (
          <Image
            src={portrait.src}
            alt={portrait.alt}
            fill
            sizes="(min-width: 1024px) 28rem, 74vw"
            quality={85}
            className="object-cover"
            style={{ objectPosition: "50% 22%" }}
          />
        )}
      </div>

      <svg viewBox="0 0 640 640" aria-hidden className="absolute inset-0 size-full overflow-visible">
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="2" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - active / count}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
        {nodes.map((node, index) => {
          const isActive = index === active;
          const done = index < active;
          return (
            <g key={index} style={{ transition: "transform 0.5s", transformOrigin: `${node.x}px ${node.y}px`, transform: isActive ? "scale(1.25)" : "none" }}>
              <circle
                cx={node.x}
                cy={node.y}
                r="28"
                style={{ transition: "fill 0.4s" }}
                fill={isActive ? "var(--color-ink)" : done ? "var(--color-brand)" : "var(--color-soft)"}
                stroke={isActive ? "var(--color-ink)" : done ? "var(--color-brand)" : "rgb(23 21 31 / 0.3)"}
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="19"
                fontWeight="700"
                style={{ transition: "fill 0.4s" }}
                fill={isActive ? "var(--color-lime)" : done ? "var(--color-soft)" : "var(--color-ink)"}
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Process({ data, under = "bg-ink" }: { data: SiteData["process"]; under?: string }) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(stepRefs.current.indexOf(entry.target as HTMLLIElement));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const element of stepRefs.current) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Sheet id="process" under={under} labelledBy="process-title" className="on-light bg-soft pb-24 pt-32 text-ink md:pt-48">
      <div className="mx-auto max-w-[1760px] px-[var(--gutter)]">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-6">
            <div className="lg:sticky lg:top-24">
              <p className="eyebrow text-brand">{data.label}</p>
              <h2 id="process-title" className="display mt-4 text-[clamp(3.25rem,6.5vw,7rem)]">
                {data.title}
              </h2>
              {data.lead && <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/80">{data.lead}</p>}
              <div className="mt-8 max-w-sm lg:max-w-[min(100%,50svh)]">
                <Dial count={data.steps.length} active={active} portrait={data.portrait} />
              </div>
            </div>
          </div>

          <ol className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-[18vh]">
            {data.steps.map((step, index) => (
              <li
                key={step.id}
                ref={(element) => {
                  stepRefs.current[index] = element;
                }}
                className="flex gap-5 border-t border-ink/15 py-10 lg:min-h-[52vh] lg:border-t-0 lg:py-0"
              >
                <div className="w-full">
                  <Reveal>
                    <span aria-hidden className="flex items-center gap-2 text-sm font-semibold tabular-nums text-brand">
                      {String(index + 1).padStart(2, "0")}
                      <CmsIcon name={step.icon} className="size-5" />
                    </span>
                    {step.image && (
                      <span className="relative mt-4 block aspect-[16/9] max-w-md overflow-hidden rounded-2xl">
                        <Image src={step.image.src} alt={step.image.alt} fill sizes="(min-width: 1024px) 28rem, 100vw" quality={85} className="object-cover" />
                      </span>
                    )}
                    <h3
                      className={`display mt-3 text-[clamp(2.25rem,4.4vw,4.5rem)] transition-colors duration-500 ${
                        active === index ? "text-brand" : "lg:text-ink/55"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/80">{step.text}</p>
                  </Reveal>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Sheet>
  );
}
