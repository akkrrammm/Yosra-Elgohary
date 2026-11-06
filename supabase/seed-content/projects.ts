import type { Localized } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type CategoryId = "ai-video" | "filming" | "identity" | "profiles";

export const categories: Record<CategoryId, Localized> = {
  "ai-video": { en: "AI Campaigns & Video", ar: "حملات وفيديو بالذكاء الاصطناعي" },
  filming: { en: "Filming & Video Editing", ar: "التصوير والمونتاج" },
  identity: { en: "Brand Identity", ar: "الهوية البصرية" },
  profiles: { en: "Company Profiles", ar: "الملفات التعريفية" },
};

/** How a project appears in the Selected Work section of the home page. */
export type TileStyle =
  | "wide" //   two-thirds width, cover cut with the logo's curve
  | "narrow" // one-third width, tall crop
  | "deck" //   full width, three pages fanned out like a hand of cards
  | "large" //  seven columns
  | "medium" // five columns
  | "row"; //   a line in the "playlist" of filmed work

type Image = { src: string; width: number; height: number; alt: Localized; caption?: Localized };

export type Project = {
  /** Behance project id. */
  id: string;
  /** Used in the URL: /en/work/<slug>. Images live in public/work/<slug>/. */
  slug: string;
  /** Exact title from Behance. Text after " | " is shown as a subtitle. */
  title: string;
  /** Short label used where the full title will not fit. */
  shortName: string;
  description: Localized;
  category: CategoryId;
  client?: string;
  coverImage: Image;
  /** Background behind a logo-only cover, so it can fill any frame. */
  coverBackground?: string;
  gallery: Image[];
  /** Pages of the gallery shown fanned out when tile is "deck". */
  deckPages?: [number, number, number];
  /** Set for video projects. Add `src` (an .mp4 in public/) to play it on the site. */
  video?: { src?: string };
  role?: Localized<string[]>;
  tools: string[];
  deliverables?: Localized<string[]>;
  behanceUrl: string;
  featured: boolean;
  displayOrder: number;
  tile: TileStyle;
  /** Counted in the "The work, counted" strip. */
  counts?: { profilePages?: number; guidelineSlides?: number };
  /** Optional case study blocks. Anything left out simply does not render. */
  caseStudy?: {
    quote?: string;
    context?: Localized;
    objective?: Localized;
    direction?: Localized;
    contentStrategy?: Localized;
    highlights?: { title: Localized; text: Localized }[];
    palette?: { name: string; hex: string; share: string }[];
  };
  /** Set to false to hide a project everywhere without deleting it. */
  published?: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Image helpers                                                             */
/* -------------------------------------------------------------------------- */

const page =
  (slug: string, width: number, height: number) =>
  (file: string, en: string, ar: string): Image => ({
    src: `/work/${slug}/${file}.webp`,
    width,
    height,
    alt: { en, ar },
  });

const cover = (slug: string, width: number, height: number, en: string, ar: string): Image => ({
  src: `/work/${slug}/cover.webp`,
  width,
  height,
  alt: { en, ar },
});

const brandPage = page("al-fisal-brand-identity", 2400, 1349);
const fisalPage = page("al-fisal-company-profile", 2400, 1601);
const giantPage = page("giant-company-profile", 2400, 1714);

const FILMING_ROLE: Localized<string[]> = {
  en: ["Filming", "Video Editing"],
  ar: ["التصوير", "المونتاج"],
};

/* -------------------------------------------------------------------------- */
/*  Projects: add, edit, reorder (displayOrder) or remove freely               */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  {
    id: "258000265",
    slug: "ai-teaser-spark-by-hilton",
    title: "AI-Powered Teaser Campaign | Spark by Hilton Zamalek",
    shortName: "Spark by Hilton",
    description: {
      en: "A teaser campaign announcing the transformation of the former Gezira Youth Hotel in Zamalek into Spark by Hilton, built with AI video from the original photo of the building.",
      ar: "حملة تشويقية تعلن تحوّل فندق شباب الجزيرة السابق في الزمالك إلى Spark by Hilton، صُنعت بفيديو الذكاء الاصطناعي انطلاقًا من الصورة الأصلية للمبنى.",
    },
    category: "ai-video",
    client: "Giant For Facades",
    coverImage: cover(
      "ai-teaser-spark-by-hilton",
      2400,
      1800,
      "The former Gezira Youth Hotel in Zamalek, the original building photo the campaign starts from.",
      "فندق شباب الجزيرة السابق في الزمالك، وهو الصورة الأصلية للمبنى التي انطلقت منها الحملة.",
    ),
    gallery: [],
    video: {},
    role: {
      en: [
        "Creative Concept Development",
        "AI Video Creation",
        "Content Writing",
        "Social Media Content Production & Publishing",
      ],
      ar: [
        "تطوير الفكرة الإبداعية",
        "إنشاء الفيديو بالذكاء الاصطناعي",
        "كتابة المحتوى",
        "إنتاج محتوى السوشيال ميديا ونشره",
      ],
    },
    tools: ["Google Flow", "Google Gemini", "DaVinci Resolve", "CapCut"],
    deliverables: {
      en: ["AI-generated teaser video", "Promotional copy", "Publishing across the company's social platforms"],
      ar: ["فيديو تشويقي بالذكاء الاصطناعي", "نص ترويجي", "النشر عبر منصات التواصل الخاصة بالشركة"],
    },
    behanceUrl: "https://www.behance.net/gallery/258000265/AI-Powered-Teaser-Campaign-Spark-by-Hilton-Zamalek",
    featured: true,
    displayOrder: 1,
    tile: "wide",
    caseStudy: {
      context: {
        en: "Created for Giant For Facades ahead of the redevelopment of the former Gezira Youth Hotel in Zamalek as Spark by Hilton.",
        ar: "لصالح Giant For Facades، قبل إعادة تطوير فندق شباب الجزيرة السابق في الزمالك ليصبح Spark by Hilton.",
      },
      objective: {
        en: "Build anticipation around the upcoming redevelopment.",
        ar: "بناء حالة من الترقّب حول إعادة التطوير القادمة.",
      },
      direction: {
        en: "The original building photo became the source for cinematic, demolition-style video sequences generated with AI tools.",
        ar: "تحوّلت الصورة الأصلية للمبنى إلى مصدر لمشاهد فيديو سينمائية بأسلوب الهدم، أُنشئت بأدوات الذكاء الاصطناعي.",
      },
      contentStrategy: {
        en: "The concept, the promotional copy and the publishing stayed in one pair of hands, and the content went out across the company's social media platforms.",
        ar: "بقيت الفكرة والنص الترويجي والنشر في يد واحدة، ونُشر المحتوى عبر منصات التواصل الاجتماعي الخاصة بالشركة.",
      },
    },
  },
  {
    id: "257999269",
    slug: "3d-visualization-ai-video",
    title: "3D Architectural Visualization | AI Video Creation",
    shortName: "3D Visualization",
    description: {
      en: "A static 3D architectural render of a facade project, turned into a dynamic video with AI tools as visual content for social media.",
      ar: "تحويل تصميم معماري ثلاثي الأبعاد ثابت لواجهة أحد المشروعات إلى فيديو نابض بالحركة باستخدام أدوات الذكاء الاصطناعي، ليصبح محتوى بصريًا للسوشيال ميديا.",
    },
    category: "ai-video",
    client: "Giant For Facades",
    coverImage: cover(
      "3d-visualization-ai-video",
      2000,
      1332,
      "3D architectural render of a curved building among towers and palm trees.",
      "تصميم معماري ثلاثي الأبعاد لمبنى منحني بين الأبراج وأشجار النخيل.",
    ),
    gallery: [],
    video: {},
    role: {
      en: ["AI Video Creation", "Content Production"],
      ar: ["إنشاء الفيديو بالذكاء الاصطناعي", "إنتاج المحتوى"],
    },
    tools: ["CapCut", "DaVinci Resolve", "AI"],
    deliverables: {
      en: ["AI video from a 3D render", "Social media content"],
      ar: ["فيديو بالذكاء الاصطناعي من تصميم ثلاثي الأبعاد", "محتوى للسوشيال ميديا"],
    },
    behanceUrl: "https://www.behance.net/gallery/257999269/3D-Architectural-Visualization-AI-Video-Creation",
    featured: false,
    displayOrder: 2,
    tile: "narrow",
  },
  {
    id: "257932915",
    slug: "al-fisal-brand-identity",
    title: "AL FISAL FOR CONSTRUCTION Brand Identity & Guidelines",
    shortName: "Al Fisal Identity",
    description: {
      en: "A visual identity and brand guidelines for a construction company working across construction, interior and exterior finishing, and marble, in a direction called Modern Architectural Luxury.",
      ar: "هوية بصرية ودليل استخدام، باتجاه Modern Architectural Luxury، لشركة مقاولات تعمل في الإنشاءات والتشطيبات الداخلية والخارجية وتطبيقات الرخام.",
    },
    category: "identity",
    client: "Al Fisal For Construction",
    coverImage: brandPage(
      "01",
      "Cover of the Al Fisal brand identity guidelines: white logo and gold title on black beside a dark architectural photo.",
      "غلاف دليل هوية الفيصل: شعار أبيض وعنوان ذهبي على خلفية سوداء بجوار صورة معمارية داكنة.",
    ),
    gallery: [
      brandPage("01", "Guidelines cover with the Al Fisal logo.", "غلاف الدليل مع شعار الفيصل."),
      brandPage("02", "Contents page titled Built for Consistency.", "صفحة المحتويات بعنوان Built for Consistency."),
      brandPage("03", "Brand page titled The Weight of Trust.", "صفحة العلامة بعنوان The Weight of Trust."),
      brandPage("04", "Purpose, vision and values.", "الغاية والرؤية والقيم."),
      brandPage("05", "Positioning page titled A Partner for Complex Builds.", "صفحة التموضع بعنوان A Partner for Complex Builds."),
      brandPage("06", "Tone of voice page titled Confident. Clear. Precise.", "صفحة نبرة الصوت بعنوان Confident. Clear. Precise."),
      brandPage("07", "Logo system page titled One Mark. Distinct Uses.", "صفحة نظام الشعار بعنوان One Mark. Distinct Uses."),
      brandPage("09", "Color palette page titled Grounded in Structure.", "صفحة الألوان بعنوان Grounded in Structure."),
      brandPage("10", "Typography page titled Engineered to Be Read, with Cairo and Tajawal.", "صفحة الخطوط بعنوان Engineered to Be Read، بخطي Cairo وTajawal."),
      brandPage("11", "Photography page titled Show the Work. Not Just the Look.", "صفحة التصوير بعنوان Show the Work. Not Just the Look."),
      brandPage("13", "Graphic language drawn from the logo's symbol.", "لغة جرافيكية مستمدة من رمز الشعار."),
      brandPage("14", "Mockups of site hoardings and a branded safety helmet.", "نماذج للافتات المواقع وخوذة سلامة تحمل العلامة."),
      brandPage("15", "Business card and proposal cover designs.", "تصميمات بطاقة العمل وغلاف العروض."),
      brandPage("16", "Digital and material details for social and print use.", "تفاصيل رقمية ومادية للنشر والطباعة."),
      brandPage("18", "Closing page reading Built on Trust.", "الصفحة الختامية بعبارة Built on Trust."),
    ],
    deckPages: [7, 9, 0],
    role: {
      en: ["Brand Identity", "Art Direction", "Brand Guidelines"],
      ar: ["الهوية البصرية", "التوجيه الفني", "دليل العلامة"],
    },
    tools: ["Adobe Photoshop", "Microsoft PowerPoint", "Canva"],
    deliverables: {
      en: [
        "Brand strategy and voice",
        "Logo system and protection rules",
        "Color and typography",
        "Photography and visual language",
        "Applications and rollout",
      ],
      ar: [
        "استراتيجية العلامة ونبرة صوتها",
        "نظام الشعار وقواعد حمايته",
        "الألوان والخطوط",
        "التصوير واللغة البصرية",
        "التطبيقات وخطة التنفيذ",
      ],
    },
    behanceUrl: "https://www.behance.net/gallery/257932915/AL-FISAL-FOR-CONSTRUCTION-Brand-Identity-Guidelines",
    featured: true,
    displayOrder: 3,
    tile: "deck",
    counts: { guidelineSlides: 18 },
    caseStudy: {
      quote: "Building Trust. Executing with Precision.",
      context: {
        en: "Al Fisal specializes in construction works, interior and exterior finishing, and marble applications. The guidelines speak to the engineers, developers, landowners and project owners the name has to win over.",
        ar: "تتخصص الفيصل في أعمال البناء والتشطيبات الداخلية والخارجية وتطبيقات الرخام. ويخاطب الدليل المهندسين والمطورين وملاك الأراضي وأصحاب المشروعات الذين تتوجه إليهم العلامة.",
      },
      objective: {
        en: "Create a strong, sophisticated and professional brand presence that reflects the company's engineering mindset, construction expertise and commitment to quality.",
        ar: "بناء حضور قوي وراقٍ واحترافي يعكس العقلية الهندسية للشركة وخبرتها في البناء والتزامها بالجودة.",
      },
      direction: {
        en: "Inspired by architectural geometry, structural forms and the precision of modern construction. Bold geometric elements, minimal compositions and refined details balance engineering strength with premium craftsmanship.",
        ar: "مستوحى من الهندسة المعمارية والأشكال الإنشائية ودقة البناء الحديث. عناصر هندسية جريئة وتكوينات بسيطة وتفاصيل راقية تحقق التوازن بين القوة الهندسية وإتقان الحِرفة.",
      },
      highlights: [
        {
          title: { en: "Positioning", ar: "التموضع" },
          text: {
            en: "Engineering-led construction. Detail-driven finishing.",
            ar: "إنشاءات بقيادة هندسية. وتشطيبات تحكمها التفاصيل.",
          },
        },
        {
          title: { en: "Voice", ar: "نبرة الصوت" },
          text: {
            en: "Confident, not boastful. Specific, not vague. Calm, not promotional.",
            ar: "واثقة دون تفاخر، ومحددة دون غموض، وهادئة دون مبالغة ترويجية.",
          },
        },
        {
          title: { en: "Type", ar: "الخطوط" },
          text: {
            en: "Cairo for headlines and Tajawal for long-form Arabic.",
            ar: "خط Cairo للعناوين وخط Tajawal للنصوص العربية الطويلة.",
          },
        },
        {
          title: { en: "Photography", ar: "التصوير" },
          text: {
            en: "Show the work, not just the look: scale, material and technical control.",
            ar: "إظهار العمل لا الشكل فقط: الحجم والخامة والتحكم التقني.",
          },
        },
      ],
      palette: [
        { name: "Architectural Black", hex: "#151515", share: "35%" },
        { name: "Engineering Gray", hex: "#52565A", share: "15%" },
        { name: "Stone Ivory", hex: "#F5F3EE", share: "45%" },
        { name: "Muted Gold", hex: "#C6A34A", share: "5%" },
      ],
    },
  },
  {
    id: "257731569",
    slug: "giant-company-profile",
    title: "Giant Fabrication Company Profile",
    shortName: "Giant Profile",
    description: {
      en: "A 91-page company profile in navy and gold for a facades specialist, in Arabic and English, organized around scope, mega projects, commercial and residential builds, and engineering solutions.",
      ar: "ملف تعريفي من 91 صفحة بالكحلي والذهبي لشركة متخصصة في الواجهات، بالعربية والإنجليزية، منظم حول نطاق العمل والمشروعات الكبرى والمباني التجارية والسكنية والحلول الهندسية.",
    },
    category: "profiles",
    client: "Giant For Facades",
    coverImage: giantPage(
      "01",
      "Cover of the Giant For Facades company profile with a glass and stone building corner.",
      "غلاف الملف التعريفي لشركة Giant For Facades مع ركن مبنى من الزجاج والحجر.",
    ),
    gallery: [
      giantPage("01", "Company profile cover.", "غلاف الملف التعريفي."),
      giantPage("10", "Dejoya 1 project page.", "صفحة مشروع Dejoya 1."),
      giantPage("09", "Taj Misr Developments project overview.", "نظرة عامة على مشروعات تاج مصر للتطوير."),
      giantPage("06", "Our Scope page listing facade services.", "صفحة نطاق العمل وخدمات الواجهات."),
      giantPage("21", "Mehwar Plaza project page.", "صفحة مشروع Mehwar Plaza."),
      giantPage("14", "Three Square project page.", "صفحة مشروع Three Square."),
      giantPage("16", "Silicon Valley International School project page.", "صفحة مشروع مدرسة Silicon Valley الدولية."),
      giantPage("31", "OBO Mall project page.", "صفحة مشروع OBO Mall."),
      giantPage("25", "The Q Mall project page.", "صفحة مشروع The Q Mall."),
      giantPage("07", "Why Giant page with six reasons, in Arabic and English.", "صفحة لماذا Giant بستة أسباب، بالعربية والإنجليزية."),
      giantPage("49", "Diamond Tower project page.", "صفحة مشروع Diamond Tower."),
      giantPage("46", "Bridgestone headquarters project page.", "صفحة مشروع المقر الرئيسي لشركة Bridgestone."),
      giantPage("63", "Lamirada New Mostaqbal project page.", "صفحة مشروع Lamirada في المستقبل الجديد."),
      giantPage("91", "Closing thank-you page.", "صفحة الشكر الختامية."),
    ],
    tools: ["Canva", "Adobe Photoshop"],
    deliverables: {
      en: ["91-page company profile", "Arabic and English content"],
      ar: ["ملف تعريفي من 91 صفحة", "محتوى بالعربية والإنجليزية"],
    },
    behanceUrl: "https://www.behance.net/gallery/257731569/Giant-Fabrication-Company-Profile",
    featured: false,
    displayOrder: 4,
    tile: "large",
    counts: { profilePages: 91 },
    caseStudy: { quote: "Born Giant. Built to Last." },
  },
  {
    id: "257714541",
    slug: "al-fisal-company-profile",
    title: "AL Fisal For Construction Company Profile",
    shortName: "Al Fisal Profile",
    description: {
      en: "A 19-page company profile in black and gold, walking through the company and its work on projects such as OIA Towers, OIA Compound, Ashgar City and 6ixty Heliopolis Mall, with the scope of work for each.",
      ar: "ملف تعريفي من 19 صفحة بالأسود والذهبي، يعرض الشركة وأعمالها في مشروعات مثل OIA Towers وOIA Compound وAshgar City و6ixty Heliopolis Mall، مع نطاق العمل في كل مشروع.",
    },
    category: "profiles",
    client: "Al Fisal For Construction",
    coverImage: fisalPage(
      "01",
      "Cover of the Al Fisal company profile with a dark angular tower.",
      "غلاف الملف التعريفي للفيصل مع برج داكن بزوايا حادة.",
    ),
    gallery: [
      fisalPage("01", "Company profile cover.", "غلاف الملف التعريفي."),
      fisalPage("04", "OIA Towers project page.", "صفحة مشروع OIA Towers."),
      fisalPage("06", "OIA Compound project page.", "صفحة مشروع OIA Compound."),
      fisalPage("07", "OIA Compound stages, from construction to final result.", "مراحل OIA Compound من الإنشاء إلى النتيجة النهائية."),
      fisalPage("08", "Social club project page in Knowledge City.", "صفحة مشروع النادي الاجتماعي بمدينة المعرفة."),
      fisalPage("10", "Ashgar City project page.", "صفحة مشروع Ashgar City."),
      fisalPage("12", "6ixty Heliopolis Mall project page.", "صفحة مشروع 6ixty Heliopolis Mall."),
      fisalPage("19", "Closing thank-you page.", "صفحة الشكر الختامية."),
    ],
    tools: ["Canva"],
    deliverables: {
      en: ["19-page company profile"],
      ar: ["ملف تعريفي من 19 صفحة"],
    },
    behanceUrl: "https://www.behance.net/gallery/257714541/AL-Fisal-For-Construction-Company-Profile",
    featured: false,
    displayOrder: 5,
    tile: "medium",
    counts: { profilePages: 19 },
    caseStudy: { quote: "Building Today. Creating Tomorrow." },
  },
  {
    id: "258004751",
    slug: "the-q-before-facade-finishing",
    title: "THE Q | Before Exterior Facade Finishing",
    shortName: "THE Q",
    description: {
      en: "A documentation video showing THE Q before its exterior facade finishing began, part of a before-and-after series that sets up the transformation to come.",
      ar: "فيديو توثيقي يعرض مشروع THE Q قبل بدء أعمال تشطيب الواجهات الخارجية، ضمن سلسلة «قبل وبعد» تمهّد للتحوّل القادم.",
    },
    category: "filming",
    client: "Giant For Facades",
    coverImage: cover(
      "the-q-before-facade-finishing",
      808,
      632,
      "Giant For Facades logo in white on navy, the cover of this video.",
      "شعار Giant For Facades باللون الأبيض على الكحلي، وهو غلاف هذا الفيديو.",
    ),
    coverBackground: "#1B3259",
    gallery: [
      {
        ...giantPage("25", "The Q Mall page from the Giant company profile.", "صفحة The Q Mall من الملف التعريفي لشركة Giant."),
        caption: {
          en: "The same project, from the Giant company profile.",
          ar: "المشروع نفسه، من الملف التعريفي لشركة Giant.",
        },
      },
    ],
    video: {},
    role: FILMING_ROLE,
    tools: ["iPhone", "Tripod"],
    deliverables: {
      en: ["Architectural documentation video", "Before-and-after content"],
      ar: ["فيديو توثيق معماري", "محتوى قبل وبعد"],
    },
    behanceUrl: "https://www.behance.net/gallery/258004751/THE-Q-Before-Exterior-Facade-Finishing",
    featured: false,
    displayOrder: 6,
    tile: "row",
  },
  {
    id: "258004365",
    slug: "h-mall-commercial-videography",
    title: "Commercial Videography | H Mall",
    shortName: "H Mall",
    description: {
      en: "A real estate and architectural documentation video of H Mall before its exterior facade finishing, part of a before-and-after record of the facade's transformation.",
      ar: "فيديو عقاري وتوثيق معماري لـ H Mall قبل تشطيب الواجهات الخارجية، ضمن توثيق بصري «قبل وبعد» لرحلة تحوّل الواجهة.",
    },
    category: "filming",
    client: "Giant For Facades",
    coverImage: cover(
      "h-mall-commercial-videography",
      808,
      632,
      "Giant For Facades logo in navy on white, the cover of this video.",
      "شعار Giant For Facades باللون الكحلي على الأبيض، وهو غلاف هذا الفيديو.",
    ),
    coverBackground: "#FFFFFF",
    gallery: [],
    video: {},
    role: FILMING_ROLE,
    tools: ["iPhone", "Tripod"],
    deliverables: {
      en: ["Architectural documentation video", "Before-and-after content"],
      ar: ["فيديو توثيق معماري", "محتوى قبل وبعد"],
    },
    behanceUrl: "https://www.behance.net/gallery/258004365/Commercial-Videography-H-Mall",
    featured: false,
    displayOrder: 7,
    tile: "row",
  },
  {
    id: "257996555",
    slug: "noble-real-estate-showcase",
    title: "Real Estate Project Showcase | Filming & Video Editing",
    shortName: "Noble Showcase",
    description: {
      en: "A promotional real estate video for Noble Investment that presents one of the company's projects and its key features through visual storytelling.",
      ar: "فيديو ترويجي عقاري لشركة Noble Investment يقدّم أحد مشروعاتها ويبرز أهم مميزاته من خلال سرد بصري جذاب.",
    },
    category: "filming",
    client: "Noble Investment",
    coverImage: cover(
      "noble-real-estate-showcase",
      808,
      632,
      "Noble Investment logo in navy on white, the cover of this video.",
      "شعار Noble Investment باللون الكحلي على الأبيض، وهو غلاف هذا الفيديو.",
    ),
    coverBackground: "#FFFFFF",
    gallery: [],
    video: {},
    role: FILMING_ROLE,
    tools: ["iPhone", "Tripod"],
    deliverables: {
      en: ["Real estate project presentation video"],
      ar: ["فيديو لعرض مشروع عقاري"],
    },
    behanceUrl: "https://www.behance.net/gallery/257996555/Real-Estate-Project-Showcase-Filming-Video-Editing",
    featured: false,
    displayOrder: 8,
    tile: "row",
  },
  {
    id: "257987503",
    slug: "noble-real-estate-qa",
    title: "Filming & Video Editing | Original Projects",
    shortName: "Noble Q&A",
    description: {
      en: "A real estate video for Noble Investment in a Q&A format, designed to deliver information in an engaging, professional way.",
      ar: "فيديو عقاري لشركة Noble Investment بأسلوب السؤال والجواب، مصمم لتقديم المعلومة بطريقة جذابة واحترافية.",
    },
    category: "filming",
    client: "Noble Investment",
    coverImage: cover(
      "noble-real-estate-qa",
      808,
      632,
      "Noble Investment logo in navy on white, the cover of this video.",
      "شعار Noble Investment باللون الكحلي على الأبيض، وهو غلاف هذا الفيديو.",
    ),
    coverBackground: "#FFFFFF",
    gallery: [],
    video: {},
    role: FILMING_ROLE,
    tools: ["iPhone", "Tripod"],
    deliverables: {
      en: ["Real estate Q&A video"],
      ar: ["فيديو عقاري بأسلوب السؤال والجواب"],
    },
    behanceUrl: "https://www.behance.net/gallery/257987503/Filming-Video-Editing-Original-Projects",
    featured: false,
    displayOrder: 9,
    tile: "row",
  },
];

/** Pages drifting across the "Pages from the work" wall. Must exist in that project's gallery. */
export const wallPages: { slug: string; file: string }[][] = [
  [
    { slug: "giant-company-profile", file: "10" },
    { slug: "al-fisal-brand-identity", file: "03" },
    { slug: "giant-company-profile", file: "21" },
    { slug: "al-fisal-company-profile", file: "04" },
    { slug: "giant-company-profile", file: "49" },
    { slug: "al-fisal-brand-identity", file: "05" },
  ],
  [
    { slug: "al-fisal-company-profile", file: "08" },
    { slug: "giant-company-profile", file: "31" },
    { slug: "al-fisal-brand-identity", file: "11" },
    { slug: "giant-company-profile", file: "63" },
    { slug: "al-fisal-company-profile", file: "12" },
    { slug: "al-fisal-brand-identity", file: "14" },
  ],
];
