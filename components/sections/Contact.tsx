import Image from "next/image";
import { Arrow, ArrowOut } from "@/components/ui/Arrow";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { ParallaxImage } from "@/components/ui/Parallax";
import { Reveal } from "@/components/ui/Reveal";
import { Sheet } from "@/components/ui/Sheet";
import type { SiteData } from "@/lib/cms/types";
import { isExternalHref, localizeHref } from "@/lib/i18n";

export function Contact({ site, under = "bg-pop" }: { site: SiteData; under?: string }) {
  const { contact, settings, socials, lang } = site;
  const { email, phone, whatsapp } = settings;
  const primaryHref = localizeHref(contact.primaryHref, lang);
  const secondaryHref = localizeHref(contact.secondaryHref, lang);
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` : null;

  return (
    <Sheet id="contact" under={under} labelledBy="contact-title" className="relative overflow-clip bg-ink pb-10 pt-28 text-soft md:pt-44">
      {contact.background && (
        <Image src={contact.background.src} alt="" fill sizes="100vw" quality={75} className="absolute inset-0 object-cover opacity-30" />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_30%,rgb(108_59_255/0.3),transparent_70%)] rtl:-scale-x-100"
      />
      <div className="relative mx-auto max-w-[1760px] px-[var(--gutter)]">
        <p className="eyebrow text-lime">{contact.label}</p>
        <h2 id="contact-title" className="display mt-5 text-[12.6vw] lg:text-[min(9vw,10.5rem)]">
          <span className="block text-balance">{contact.headlineA}</span>
          <span className="accent block text-pop">{contact.headlineB}</span>
        </h2>

        <div className="mt-8 grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 lg:col-span-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              {contact.text && (
                <Reveal>
                  <p className="max-w-xl text-lg leading-relaxed text-soft/85 md:text-xl">{contact.text}</p>
                </Reveal>
              )}
              <Reveal delay={0.1} className="mt-10 flex flex-wrap gap-3">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="group inline-flex items-center gap-3 rounded-full bg-lime px-8 py-5 text-lg font-semibold text-ink transition-colors hover:bg-soft"
                  >
                    <bdi>{email}</bdi>
                    <Arrow />
                  </a>
                )}
                {contact.primaryLabel && contact.primaryHref && (
                  <AnchorLink
                    href={primaryHref}
                    className={`group inline-flex items-center gap-3 rounded-full px-8 py-5 text-lg font-semibold transition-colors ${
                      email ? "ring-1 ring-soft/30 hover:bg-soft hover:text-ink" : "bg-lime text-ink hover:bg-soft"
                    }`}
                  >
                    {contact.primaryLabel}
                    {isExternalHref(primaryHref) ? (
                      <ArrowOut className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                    ) : (
                      <Arrow />
                    )}
                  </AnchorLink>
                )}
                {contact.secondaryLabel && contact.secondaryHref && (
                  <AnchorLink
                    href={secondaryHref}
                    className="group inline-flex items-center gap-3 rounded-full px-8 py-5 text-lg font-semibold ring-1 ring-soft/30 transition-colors hover:bg-soft hover:text-ink"
                  >
                    {contact.secondaryLabel}
                    {isExternalHref(secondaryHref) ? (
                      <ArrowOut className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                    ) : (
                      <Arrow />
                    )}
                  </AnchorLink>
                )}
              </Reveal>
            </div>

            <Reveal delay={0.15}>
              <dl className="mt-14 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
                {settings.location && (
                  <div>
                    <dt className="text-sm text-soft/70">{contact.locationLabel}</dt>
                    <dd className="mt-1 font-medium">{settings.location}</dd>
                  </div>
                )}
                {socials.length > 0 && (
                  <div>
                    <dt className="text-sm text-soft/70">{contact.elsewhereLabel}</dt>
                    <dd className="mt-1 flex flex-wrap gap-x-4 font-medium">
                      {socials.map((social) => (
                        <a
                          key={social.href}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-soft/30 underline-offset-4 transition-colors hover:text-lime"
                        >
                          {social.label}
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
                {phone && (
                  <div>
                    <dt className="text-sm text-soft/70">{contact.phoneLabel}</dt>
                    <dd className="mt-1 font-medium">
                      <a href={`tel:${phone}`} dir="ltr" className="transition-colors hover:text-lime">
                        {phone}
                      </a>
                    </dd>
                  </div>
                )}
                {whatsappUrl && (
                  <div>
                    <dt className="text-sm text-soft/70">{contact.whatsappLabel}</dt>
                    <dd className="mt-1 font-medium">
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" dir="ltr" className="transition-colors hover:text-lime">
                        {whatsapp}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </Reveal>
          </div>

          {/* Tucks up beside the headline, where the curve in the frame leaves room for its last letters */}
          {contact.portrait && (
            <div className="col-span-12 sm:col-span-8 sm:col-start-3 lg:col-span-4 lg:col-start-9 lg:-mt-[4vw]">
              <Reveal>
                <div
                  className="fan relative aspect-[3/4] overflow-hidden bg-brand"
                  style={{ "--fan-x": "58%", "--fan-y": "34%" } as React.CSSProperties}
                >
                  <ParallaxImage
                    src={contact.portrait.src}
                    alt={contact.portrait.alt}
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 66vw, 100vw"
                    distance={5}
                    objectPosition="50% 24%"
                  />
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
