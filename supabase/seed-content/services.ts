import type { Localized } from "@/lib/i18n";

type Service = {
  id: string;
  /** Hidden services stay here, ready to switch on once they are confirmed. */
  visible: boolean;
  name: Localized;
  description: Localized;
  /** Slugs of the projects that show this service in action. */
  proof: string[];
};

export const services: Service[] = [
  {
    id: "social-media-management",
    visible: true,
    name: { en: "Social Media Management", ar: "إدارة السوشيال ميديا" },
    description: {
      en: "Producing content and managing its publishing across a company's social media platforms.",
      ar: "إنتاج المحتوى وإدارة نشره عبر منصات التواصل الاجتماعي الخاصة بالشركة.",
    },
    proof: ["ai-teaser-spark-by-hilton"],
  },
  {
    id: "campaign-development",
    visible: true,
    name: { en: "Campaign Development", ar: "تطوير الحملات" },
    description: {
      en: "From the creative concept to the copy to the rollout, as with a teaser built to create anticipation.",
      ar: "من الفكرة الإبداعية إلى النص ثم الإطلاق، مثل حملة تشويقية مصممة لصنع الترقّب.",
    },
    proof: ["ai-teaser-spark-by-hilton"],
  },
  {
    id: "content-creation",
    visible: true,
    name: { en: "Content Creation", ar: "صناعة المحتوى" },
    description: {
      en: "Filming and editing on location for real estate and architecture brands, made for the feed.",
      ar: "تصوير ومونتاج في موقع العمل لعلامات العقارات والعمارة، بصيغ مناسبة للمنصات.",
    },
    proof: [
      "the-q-before-facade-finishing",
      "h-mall-commercial-videography",
      "noble-real-estate-showcase",
      "noble-real-estate-qa",
    ],
  },
  {
    id: "ai-video",
    visible: true,
    name: { en: "AI Video Creation", ar: "إنشاء الفيديو بالذكاء الاصطناعي" },
    description: {
      en: "Turning a building photo or a static 3D render into motion, with tools like Google Flow and Gemini.",
      ar: "تحويل صورة مبنى أو تصميم ثلاثي الأبعاد ثابت إلى حركة، بأدوات مثل Google Flow وGemini.",
    },
    proof: ["3d-visualization-ai-video", "ai-teaser-spark-by-hilton"],
  },
  {
    id: "creative-direction",
    visible: true,
    name: { en: "Creative Direction", ar: "التوجيه الإبداعي" },
    description: {
      en: "Setting the idea and the look: a demolition-style concept for a teaser, a Modern Architectural Luxury direction for an identity.",
      ar: "وضع الفكرة والشكل: مفهوم بأسلوب الهدم لحملة تشويقية، واتجاه Modern Architectural Luxury لهوية بصرية.",
    },
    proof: ["al-fisal-brand-identity", "ai-teaser-spark-by-hilton"],
  },
  {
    id: "copywriting",
    visible: true,
    name: { en: "Copywriting", ar: "كتابة المحتوى الإعلاني" },
    description: {
      en: "Promotional copy written alongside the concept, so the words and the visuals carry the same idea.",
      ar: "نصوص ترويجية تُكتب مع الفكرة نفسها، ليحمل الكلام والصورة المعنى ذاته.",
    },
    proof: ["ai-teaser-spark-by-hilton"],
  },
  {
    id: "brand-identity",
    visible: true,
    name: { en: "Brand Identity & Communication", ar: "الهوية البصرية والتواصل" },
    description: {
      en: "Logo rules, color, type, photography and tone of voice, gathered into guidelines a team can actually follow.",
      ar: "قواعد الشعار والألوان والخطوط والتصوير ونبرة الصوت، في دليل يستطيع الفريق اتباعه فعلًا.",
    },
    proof: ["al-fisal-brand-identity"],
  },
  {
    id: "company-profiles",
    visible: true,
    name: { en: "Company Profiles", ar: "الملفات التعريفية" },
    description: {
      en: "Long-format profiles that present a company, its scope and its projects in one consistent document.",
      ar: "ملفات تعريفية مطوّلة تقدّم الشركة ونطاق عملها ومشروعاتها في مستند واحد متناسق.",
    },
    proof: ["giant-company-profile", "al-fisal-company-profile"],
  },

  /* Requested in the brief, but nothing on Behance shows them yet.
     Set `visible: true` and add proof once each one is confirmed. */
  {
    id: "social-media-strategy",
    visible: false,
    name: { en: "Social Media Strategy", ar: "استراتيجية السوشيال ميديا" },
    description: {
      en: "Deciding what a brand should say on social media, where and why.",
      ar: "تحديد ما يجب أن تقوله العلامة على السوشيال ميديا، وأين، ولماذا.",
    },
    proof: [],
  },
  {
    id: "content-planning",
    visible: false,
    name: { en: "Content Planning", ar: "تخطيط المحتوى" },
    description: {
      en: "Content calendars that keep a brand consistent from one month to the next.",
      ar: "خطط محتوى تحافظ على اتساق العلامة من شهر إلى آخر.",
    },
    proof: [],
  },
  {
    id: "community-management",
    visible: false,
    name: { en: "Community Management", ar: "إدارة المجتمعات" },
    description: {
      en: "Looking after the conversation around a brand and the people in it.",
      ar: "رعاية الحوار حول العلامة والتفاعل مع جمهورها.",
    },
    proof: [],
  },
];
