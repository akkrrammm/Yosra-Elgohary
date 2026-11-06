import type { Locale } from "@/lib/i18n";

/** All interface copy, one object per language. Both must keep the same shape. */
const en = {
  meta: {
    title: "Yosra Elgohary | Social Media Specialist & Creative Strategist",
    description:
      "Yosra Elgohary is a social media specialist and creative strategist in Cairo, working across branding, content and AI. See campaigns, video and brand identity work for real brands.",
  },
  nav: {
    work: "Work",
    about: "About",
    services: "Services",
    process: "Process",
    contact: "Contact",
    cta: "Let's talk",
    menu: "Open menu",
    close: "Close menu",
    skip: "Skip to content",
    home: "Yosra Elgohary, home",
    main: "Main navigation",
    footer: "Footer navigation",
  },
  hero: {
    kicker: "Social Media Specialist & Creative Strategist",
    available: "Available for freelance",
    headlineA: "Building brands",
    headlineB: "people remember.",
    intro:
      "I turn brands into content worth stopping for: the concept, the copy, the camera, the edit and the AI video, all made for the platforms and rooted in what the brand stands for.",
    primary: "Explore My Work",
    secondary: "Let's Work Together",
    ribbon: ["Branding / Content / AI", "Social Media", "Video", "Creative Strategy"],
  },
  about: {
    label: "About",
    statement:
      "I'm Yosra, a social media specialist and creative strategist in Cairo, working where branding, content and AI meet.",
    lead: "I help brands look and sound like themselves everywhere they appear, from the identity system behind them to the video in someone's feed. Depending on the brief, I develop the concept, write the copy, film and edit, generate AI sequences and publish the result.",
    principlesTitle: "How I think",
    principles: [
      {
        title: "Start from what's real.",
        text: "The Spark by Hilton teaser began with the original photo of the building. THE Q and H Mall were filmed before the facade work started, so the transformation has a starting point.",
      },
      {
        title: "Give the idea a system.",
        text: "Al Fisal's guidelines hold strategy, voice, logo rules, color, type and photography in one place, so the brand stays recognizable from a site hoarding to a LinkedIn update.",
      },
      {
        title: "Use AI with intent.",
        text: "AI is a production tool here, in service of the idea. It turned a still 3D render into motion and a building photo into a cinematic demolition sequence.",
      },
    ],
    facts: {
      location: "Based in",
      focus: "Focus",
      focusValue: "Branding / Content / AI",
      availability: "Availability",
      availabilityValue: "Open to freelance",
      tools: "Tools",
    },
  },
  services: {
    label: "Services",
    title: "What I do",
    seenIn: "Seen in",
  },
  work: {
    titleA: "Selected",
    titleB: "Work",
    lead: "Real projects for real brands, in construction, real estate and facades.",
    filterLabel: "Filter projects by category",
    all: "All",
    resultCount: (n: number) => `${n} ${n === 1 ? "project" : "projects"}`,
    playlistTitle: "Filmed and cut for the feed",
    wallTitle: "Pages from the work",
    view: "View project",
    open: "Open",
  },
  process: {
    label: "Process",
    title: "How I work",
    lead: "A loop rather than a line: what I learn from each round feeds the next one.",
    steps: [
      {
        title: "Research & Discovery",
        text: "Understand the brand, the market and what already exists: the building, the product, the story worth telling.",
      },
      {
        title: "Audience Understanding",
        text: "Who needs to see this, what they care about, and what would make them stop scrolling.",
      },
      {
        title: "Strategy & Planning",
        text: "Turn that into a clear idea, the right formats and a plan for what goes out where.",
      },
      {
        title: "Content Creation",
        text: "Concept, copy, camera, edit, AI sequences and design, made to fit the platform and feel like the brand.",
      },
      {
        title: "Publishing & Management",
        text: "Prepare it, publish it and keep the brand consistent across channels.",
      },
      {
        title: "Analysis & Optimization",
        text: "See what worked, learn from it and build it into the next round.",
      },
    ],
  },
  counted: {
    title: "The work, counted.",
    note: "Counted from the published work itself.",
    videos: "videos filmed, edited or generated",
    profilePages: "company profile pages",
    guidelineSlides: "brand guideline slides",
    brands: "brands",
  },
  contact: {
    label: "Contact",
    headlineA: "Let's build a brand",
    headlineB: "people remember.",
    text: "Have a brand, a launch or a campaign in mind? Tell me about it.",
    primary: "Hire me on Behance",
    secondary: "Connect on LinkedIn",
    elsewhere: "Find me on",
    location: "Based in",
    email: "Email",
    phone: "Phone",
  },
  footer: {
    rights: "All rights reserved.",
    top: "Back to top",
    logoAlt: "Yosra Elgohary, Creative Strategist logo",
  },
  project: {
    back: "All work",
    client: "Client",
    role: "My role",
    tools: "Tools",
    deliverables: "Deliverables",
    context: "Brand context",
    objective: "Objective",
    direction: "Creative direction",
    contentStrategy: "Content strategy",
    palette: "Color system",
    system: "The system",
    gallery: "Final visuals",
    viewOnBehance: "View on Behance",
    watchOnBehance: "Watch on Behance",
    video: "Video",
    featured: "Featured",
    relatedVisuals: "Related visuals",
    next: "Next project",
    lightbox: {
      label: "Image viewer",
      close: "Close image viewer",
      prev: "Previous image",
      next: "Next image",
      open: "Open image full screen",
      of: "of",
    },
  },
};

const ar: typeof en = {
  meta: {
    title: "Yosra Elgohary | أخصائية سوشيال ميديا وخبيرة استراتيجيات إبداعية",
    description:
      "أخصائية سوشيال ميديا وخبيرة استراتيجيات إبداعية في القاهرة، تعمل في الهوية والمحتوى والذكاء الاصطناعي. تعرّف على حملات وفيديوهات وهويات بصرية لعلامات حقيقية.",
  },
  nav: {
    work: "الأعمال",
    about: "من أنا",
    services: "الخدمات",
    process: "طريقة العمل",
    contact: "تواصل",
    cta: "لنتحدث",
    menu: "فتح القائمة",
    close: "إغلاق القائمة",
    skip: "الانتقال إلى المحتوى",
    home: "Yosra Elgohary، الصفحة الرئيسية",
    main: "التنقل الرئيسي",
    footer: "روابط التذييل",
  },
  hero: {
    kicker: "أخصائية سوشيال ميديا وخبيرة استراتيجيات إبداعية",
    available: "متاحة للعمل الحر",
    headlineA: "أبني علامات",
    headlineB: "لا تُنسى.",
    intro:
      "أحوّل العلامات التجارية إلى محتوى يستحق التوقف عنده: الفكرة والنص والتصوير والمونتاج وفيديو الذكاء الاصطناعي، كلها مصنوعة للمنصات ومبنية على ما تمثله العلامة.",
    primary: "استكشف أعمالي",
    secondary: "لنعمل معًا",
    ribbon: ["هوية / محتوى / ذكاء اصطناعي", "سوشيال ميديا", "فيديو", "استراتيجية إبداعية"],
  },
  about: {
    label: "من أنا",
    statement:
      "أعمل أخصائية سوشيال ميديا وخبيرة استراتيجيات إبداعية في القاهرة، في النقطة التي تلتقي فيها الهوية والمحتوى والذكاء الاصطناعي.",
    lead: "أساعد العلامات التجارية على أن تبدو وتتحدث بطريقتها الخاصة في كل مكان تظهر فيه، من نظام الهوية خلفها إلى الفيديو الذي يظهر أمام جمهورها. وبحسب طبيعة المشروع، أطوّر الفكرة وأكتب النص وأصوّر وأمنتج وأنشئ مشاهد بالذكاء الاصطناعي ثم أنشر النتيجة.",
    principlesTitle: "كيف أفكر",
    principles: [
      {
        title: "أبدأ من الواقع.",
        text: "بدأت حملة Spark by Hilton التشويقية من الصورة الأصلية للمبنى. وصُوّر THE Q وH Mall قبل بدء أعمال الواجهات، ليكون للتحوّل نقطة بداية واضحة.",
      },
      {
        title: "أمنح الفكرة نظامًا.",
        text: "يجمع دليل الفيصل الاستراتيجية ونبرة الصوت وقواعد الشعار والألوان والخطوط والتصوير في مكان واحد، لتبقى العلامة واضحة من لافتة الموقع إلى منشور على LinkedIn.",
      },
      {
        title: "أستخدم الذكاء الاصطناعي بهدف.",
        text: "الذكاء الاصطناعي هنا أداة إنتاج في خدمة الفكرة: حوّل تصميمًا ثلاثي الأبعاد ثابتًا إلى حركة، وصورة مبنى إلى مشهد هدم سينمائي.",
      },
    ],
    facts: {
      location: "مقر العمل",
      focus: "التخصص",
      focusValue: "هوية / محتوى / ذكاء اصطناعي",
      availability: "الإتاحة",
      availabilityValue: "متاحة للعمل الحر",
      tools: "الأدوات",
    },
  },
  services: {
    label: "الخدمات",
    title: "ماذا أقدّم",
    seenIn: "شاهدها في",
  },
  work: {
    titleA: "أعمال",
    titleB: "مختارة",
    lead: "مشروعات حقيقية لعلامات حقيقية في البناء والعقارات والواجهات.",
    filterLabel: "تصفية المشروعات حسب الفئة",
    all: "الكل",
    resultCount: (n: number) => (n === 1 ? "مشروع واحد" : n === 2 ? "مشروعان" : n <= 10 ? `${n} مشروعات` : `${n} مشروعًا`),
    playlistTitle: "مصوَّرة وممنتجة للمنصات",
    wallTitle: "صفحات من الأعمال",
    view: "عرض المشروع",
    open: "فتح",
  },
  process: {
    label: "طريقة العمل",
    title: "كيف أعمل",
    lead: "دائرة لا خط مستقيم: ما أتعلمه من كل جولة يغذّي الجولة التالية.",
    steps: [
      {
        title: "البحث والاكتشاف",
        text: "أفهم العلامة والسوق وما هو موجود بالفعل: المبنى أو المنتج أو القصة التي تستحق أن تُروى.",
      },
      {
        title: "فهم الجمهور",
        text: "من يحتاج أن يرى هذا المحتوى، وما الذي يهمه، وما الذي يجعله يتوقف عن التمرير.",
      },
      {
        title: "الاستراتيجية والتخطيط",
        text: "أحوّل ذلك إلى فكرة واضحة وصيغ مناسبة وخطة لما سيُنشر وأين.",
      },
      {
        title: "صناعة المحتوى",
        text: "الفكرة والنص والتصوير والمونتاج ومشاهد الذكاء الاصطناعي والتصميم، بما يناسب كل منصة ويشبه العلامة.",
      },
      {
        title: "النشر والإدارة",
        text: "أجهّز المحتوى وأنشره وأحافظ على اتساق العلامة عبر القنوات.",
      },
      {
        title: "التحليل والتحسين",
        text: "أراجع ما نجح، وأتعلم منه، وأبني عليه في الجولة التالية.",
      },
    ],
  },
  counted: {
    title: "الأعمال بالأرقام.",
    note: "محسوبة من الأعمال المنشورة نفسها.",
    videos: "فيديوهات مصوّرة أو ممنتجة أو مولّدة",
    profilePages: "صفحة من الملفات التعريفية",
    guidelineSlides: "شريحة من دليل الهوية",
    brands: "علامات تجارية",
  },
  contact: {
    label: "تواصل",
    headlineA: "لنبنِ علامة",
    headlineB: "لا تُنسى.",
    text: "لديك علامة أو إطلاق أو حملة في ذهنك؟ حدّثني عنها.",
    primary: "وظّفني عبر Behance",
    secondary: "تواصل عبر LinkedIn",
    elsewhere: "تجدني على",
    location: "مقر العمل",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
  },
  footer: {
    rights: "جميع الحقوق محفوظة.",
    top: "إلى الأعلى",
    logoAlt: "شعار Yosra Elgohary، Creative Strategist",
  },
  project: {
    back: "كل الأعمال",
    client: "العميل",
    role: "دوري",
    tools: "الأدوات",
    deliverables: "المخرجات",
    context: "سياق العلامة",
    objective: "الهدف",
    direction: "التوجيه الإبداعي",
    contentStrategy: "استراتيجية المحتوى",
    palette: "نظام الألوان",
    system: "النظام",
    gallery: "التصميمات النهائية",
    viewOnBehance: "عرض على Behance",
    watchOnBehance: "مشاهدة على Behance",
    video: "فيديو",
    featured: "مميز",
    relatedVisuals: "صور ذات صلة",
    next: "المشروع التالي",
    lightbox: {
      label: "عارض الصور",
      close: "إغلاق عارض الصور",
      prev: "الصورة السابقة",
      next: "الصورة التالية",
      open: "فتح الصورة بملء الشاشة",
      of: "من",
    },
  },
};

const dictionaries = { en, ar };

export const getDictionary = (locale: Locale) => dictionaries[locale];
export type Dictionary = typeof en;
