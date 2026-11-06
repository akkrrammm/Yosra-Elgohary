import type { Localized } from "@/lib/i18n";

/**
 * Who this site is about and how to get in touch.
 * Everything here comes from the logo and the Behance profile.
 * Contact details left as null stay hidden until they are filled in.
 */
export const site = {
  /** Spelling used on the official logo. */
  name: "Yosra Elgohary",
  /** Spelling used on the Behance profile. */
  fullName: "Yosra Saeed El Gohary",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  location: { en: "Cairo, Egypt", ar: "القاهرة، مصر" } satisfies Localized,
  availableForFreelance: true,
  behanceUrl: "https://www.behance.net/yosrasaeed1",
  linkedinUrl: "https://www.linkedin.com/in/yosra-elgohary-19821330b",
  contact: {
    email: null as string | null,
    phone: null as string | null,
  },
  /** Shown in the contact section, in this order. Add Instagram, TikTok and so on here. */
  socials: [
    { label: "Behance", url: "https://www.behance.net/yosrasaeed1" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/yosra-elgohary-19821330b" },
  ],
  tools: ["DaVinci Resolve", "CapCut", "Photoshop", "Canva", "Google Flow", "Gemini"],
  /** Client and brand names shown in the moving ribbon. */
  brands: ["Giant For Facades", "Noble Investment", "Al Fisal For Construction"],
  portraits: {
    hero: {
      src: "/portraits/portrait-black-hijab.webp",
      width: 1122,
      height: 1402,
      alt: {
        en: "Yosra Elgohary in a black hijab and dark denim shirt, one hand raised to the lips, against a purple and pink graphic background.",
        ar: "Yosra Elgohary بحجاب أسود وقميص جينز داكن، ويدها مرفوعة قرب شفتيها، على خلفية جرافيكية بالبنفسجي والوردي.",
      },
    },
    about: {
      src: "/portraits/portrait-denim-studio.webp",
      width: 1672,
      height: 941,
      alt: {
        en: "Yosra Elgohary in a beige hijab and denim jacket at a laptop, surrounded by a megaphone, social media icons, a growth chart and a calendar.",
        ar: "Yosra Elgohary بحجاب بيج وجاكيت جينز أمام اللابتوب، تحيط بها أيقونات مكبر صوت ومنصات التواصل ورسم بياني وتقويم.",
      },
    },
    process: {
      src: "/portraits/portrait-on-location.webp",
      width: 1024,
      height: 1536,
      alt: {
        en: "Yosra Elgohary in sunglasses and a gray hijab making a peace sign while holding a camera gimbal and power bank.",
        ar: "Yosra Elgohary بنظارة شمسية وحجاب رمادي تشير بعلامة السلام وتحمل مثبت كاميرا وبطارية متنقلة.",
      },
    },
    contact: {
      src: "/portraits/portrait-waving.webp",
      width: 1024,
      height: 1536,
      alt: {
        en: "Yosra Elgohary in a gray hijab and denim jacket, smiling and waving hello.",
        ar: "Yosra Elgohary بحجاب رمادي وجاكيت جينز، تبتسم وتلوّح بيدها للتحية.",
      },
    },
  },
} as const;
