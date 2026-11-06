import Image from "next/image";
import type { CSSProperties } from "react";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { Arrow, ArrowOut } from "@/components/ui/Arrow";
import { ParallaxImage } from "@/components/ui/Parallax";
import type { CmsImage, SiteData } from "@/lib/cms/types";
import { hasArabic, isExternalHref, localizeHref } from "@/lib/i18n";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function Seal({ text, logo }: { text: string; logo: CmsImage | null }) {
  return (
    <div aria-hidden className="relative grid size-28 place-items-center rounded-full bg-ink ring-1 ring-soft/15 md:size-36 short:size-28">
      <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0">
        <defs>
          <path id="seal-path" d="M60 60m-47 0a47 47 0 1 1 94 0a47 47 0 1 1-94 0" />
        </defs>
        <text className="fill-lime font-sans text-[11px] font-semibold" direction="ltr">
          <textPath href="#seal-path" textLength={287} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      {logo && <Image src={logo.src} alt="" width={61} height={64} className="h-9 w-auto md:h-11 short:h-9" />}
    </div>
  );
}

export function Hero({ site }: { site: SiteData }) {
  const { hero, settings, lang } = site;
  const nameIsArabic = hasArabic(`${hero.firstName}${hero.lastName}`);
  const nameType = nameIsArabic ? "leading-[1.2]" : "leading-[0.82] !tracking-[-0.05em]";
  const primaryHref = localizeHref(hero.primaryHref, lang);
  const secondaryHref = localizeHref(hero.secondaryHref, lang);
  const showAvailable = settings.availableForFreelance && hero.available;

  return (
    <section
      id="top"
      tabIndex={-1}
      aria-labelledby="hero-name"
      className="relative isolate overflow-clip bg-ink pb-16 outline-none lg:flex lg:min-h-[max(100svh,40rem)] lg:flex-col lg:pb-0"
    >
      {hero.background && (
        <Image src={hero.background.src} alt="" fill sizes="100vw" quality={75} className="absolute inset-0 -z-20 object-cover opacity-30" />
      )}

      {/* Soft brand light behind the composition */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_75%_30%,rgb(108_59_255/0.28),transparent_70%),radial-gradient(40%_50%_at_15%_90%,rgb(255_92_138/0.12),transparent_70%)] rtl:-scale-x-100"
      />

      {/* Portrait, framed by the curve in the logo with its arcs stacked behind */}
      <div className="relative z-10 aspect-[5/6] w-full lg:absolute lg:inset-y-0 lg:end-0 lg:aspect-auto lg:w-[48vw] xl:w-[46vw]">
        <div aria-hidden className="fan portrait-in absolute inset-0 bg-brand" style={{ translate: "calc(var(--dir) * -2.6vw) 0" }} />
        <div aria-hidden className="fan portrait-in absolute inset-0 bg-pop" style={{ translate: "calc(var(--dir) * -1.3vw) 0" }} />
        <div className="fan portrait-in absolute inset-0 overflow-hidden">
          {hero.portrait && (
            <ParallaxImage
              src={hero.portrait.src}
              alt={hero.portrait.alt}
              sizes="(min-width: 1024px) 48vw, 100vw"
              preload
              distance={5}
              objectPosition="60% 18%"
            />
          )}
        </div>
        {hero.showSeal && hero.sealText && (
          <div className="fade-up absolute bottom-6 end-5 z-20 lg:bottom-auto lg:end-auto lg:start-[-3rem] lg:top-[58%] short:top-[50%]" style={stagger(8)}>
            <Seal text={hero.sealText} logo={hero.logo} />
          </div>
        )}
      </div>

      {/* Name: solid behind the portrait, outlined where it crosses in front */}
      <h1
        id="hero-name"
        dir={nameIsArabic ? "rtl" : "ltr"}
        className={`display relative z-20 -mt-[17vw] px-[var(--gutter)] text-[22vw] text-soft rtl:text-right lg:absolute lg:inset-x-0 lg:bottom-[3.6vw] lg:z-0 lg:mt-0 lg:whitespace-nowrap lg:text-[14vw] ${nameType}`}
      >
        <span className="mask lg:inline-block">
          <span className="rise" style={stagger(1)}>
            {hero.firstName}
          </span>
        </span>
        <span className="lg:inline"> </span>
        <span className="mask lg:inline-block">
          <span className="rise" style={stagger(2)}>
            {hero.lastName}
          </span>
        </span>
      </h1>
      <div
        aria-hidden
        dir={nameIsArabic ? "rtl" : "ltr"}
        className={`display outline-text absolute inset-x-0 bottom-[3.6vw] z-20 hidden whitespace-nowrap px-[var(--gutter)] text-[14vw] rtl:text-right lg:block ${nameType}`}
      >
        <span className="mask lg:inline-block">
          <span className="rise" style={stagger(1)}>
            {hero.firstName}
          </span>
        </span>{" "}
        <span className="mask lg:inline-block">
          <span className="rise" style={stagger(2)}>
            {hero.lastName}
          </span>
        </span>
      </div>

      {/* Message */}
      <div className="relative z-30 mt-10 px-[var(--gutter)] lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:pb-[19vw] lg:pt-28 short:pb-[16vw] short:pt-20">
        <div className="max-w-[44rem] lg:max-w-[46vw] xl:max-w-[44vw]">
          <p className="fade-up flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-soft/80" style={stagger(3)}>
            {showAvailable && (
              <span className="inline-flex items-center gap-2 text-lime">
                <span aria-hidden className="size-2 rounded-full bg-lime" />
                {hero.available}
              </span>
            )}
            {showAvailable && settings.location && (
              <span aria-hidden className="text-soft/30">
                /
              </span>
            )}
            <span>{settings.location}</span>
          </p>

          {hero.kicker && (
            <p className="eyebrow fade-up mt-6 text-pop short:mt-3" style={stagger(4)}>
              {hero.kicker}
            </p>
          )}

          <p className="display mt-4 text-[clamp(2.5rem,5vw,5.5rem)] short:mt-2 short:text-[4.4vw]">
            <span className="mask">
              <span className="rise" style={stagger(4)}>
                {hero.headlineA}
              </span>
            </span>
            <span className="mask">
              <span className="rise accent text-pop" style={stagger(5)}>
                {hero.headlineB}
              </span>
            </span>
          </p>

          {hero.intro && (
            <p className="fade-up mt-6 max-w-xl text-base leading-relaxed text-soft/80 short:mt-3 md:text-lg" style={stagger(6)}>
              {hero.intro}
            </p>
          )}

          <div className="fade-up mt-8 flex flex-wrap gap-3 short:mt-5" style={stagger(7)}>
            {hero.primaryLabel && hero.primaryHref && (
              <AnchorLink
                href={primaryHref}
                className="group inline-flex items-center gap-3 rounded-full bg-lime px-7 py-4 font-semibold text-ink transition-colors hover:bg-soft"
              >
                {hero.primaryLabel}
                {isExternalHref(primaryHref) ? (
                  <ArrowOut />
                ) : (
                  <Arrow className="transition-transform duration-300 group-hover:translate-x-[calc(var(--dir)*4px)]" />
                )}
              </AnchorLink>
            )}
            {hero.secondaryLabel && hero.secondaryHref && (
              <AnchorLink
                href={secondaryHref}
                className="inline-flex items-center gap-3 rounded-full px-7 py-4 font-semibold text-soft ring-1 ring-soft/30 transition-colors hover:bg-soft hover:text-ink"
              >
                {hero.secondaryLabel}
              </AnchorLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
