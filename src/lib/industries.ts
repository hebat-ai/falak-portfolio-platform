// Standard industry list for startups. A company stores the chosen
// industry's English and Arabic labels in sectorEn/sectorAr, so every
// existing report, chart and filter keeps working unchanged; "Other"
// lets the user type a custom industry in both languages.

export interface Industry {
  key: string;
  en: string;
  ar: string;
}

export const OTHER_INDUSTRY = "Other";

export const INDUSTRIES: Industry[] = [
  { key: "Fintech", en: "Fintech", ar: "التقنية المالية" },
  { key: "Insurtech", en: "Insurtech", ar: "تقنية التأمين" },
  { key: "ECommerce", en: "E-commerce", ar: "التجارة الإلكترونية" },
  { key: "Marketplace", en: "Marketplaces", ar: "الأسواق الإلكترونية" },
  { key: "Retail", en: "Retail & Consumer Goods", ar: "التجزئة والسلع الاستهلاكية" },
  { key: "SaaS", en: "SaaS & Enterprise Software", ar: "البرمجيات كخدمة وبرمجيات المؤسسات" },
  { key: "AI", en: "Artificial Intelligence & Data", ar: "الذكاء الاصطناعي والبيانات" },
  { key: "Cybersecurity", en: "Cybersecurity", ar: "الأمن السيبراني" },
  { key: "DevTools", en: "Developer Tools & Infrastructure", ar: "أدوات المطورين والبنية التحتية" },
  { key: "Healthtech", en: "Healthtech", ar: "التقنية الصحية" },
  { key: "Biotech", en: "Biotech & Life Sciences", ar: "التقنية الحيوية وعلوم الحياة" },
  { key: "Wellness", en: "Wellness, Beauty & Fitness", ar: "العافية والجمال واللياقة" },
  { key: "Edtech", en: "Edtech", ar: "التقنية التعليمية" },
  { key: "HRTech", en: "HR Tech & Future of Work", ar: "تقنية الموارد البشرية ومستقبل العمل" },
  { key: "Legaltech", en: "Legaltech", ar: "التقنية القانونية" },
  { key: "GovTech", en: "GovTech", ar: "التقنية الحكومية" },
  { key: "Proptech", en: "Proptech & Real Estate", ar: "التقنية العقارية والعقارات" },
  { key: "Construction", en: "Construction Tech", ar: "تقنية البناء والتشييد" },
  { key: "Logistics", en: "Logistics & Supply Chain", ar: "الخدمات اللوجستية وسلاسل الإمداد" },
  { key: "Mobility", en: "Mobility & Transportation", ar: "التنقل والنقل" },
  { key: "Automotive", en: "Automotive", ar: "السيارات" },
  { key: "Foodtech", en: "Foodtech & Restaurants", ar: "تقنية الأغذية والمطاعم" },
  { key: "Agritech", en: "Agritech", ar: "التقنية الزراعية" },
  { key: "Cleantech", en: "Cleantech & Energy", ar: "التقنية النظيفة والطاقة" },
  { key: "Climate", en: "Climate & Sustainability", ar: "المناخ والاستدامة" },
  { key: "Industrial", en: "Industrial & Manufacturing", ar: "الصناعة والتصنيع" },
  { key: "Deeptech", en: "Deep Tech & Robotics", ar: "التقنية العميقة والروبوتات" },
  { key: "Space", en: "Space & Aerospace", ar: "الفضاء والطيران" },
  { key: "Telecom", en: "Telecom & Connectivity", ar: "الاتصالات والربط" },
  { key: "IoT", en: "Internet of Things (IoT)", ar: "إنترنت الأشياء" },
  { key: "Web3", en: "Web3 & Blockchain", ar: "الويب 3 والبلوك تشين" },
  { key: "Media", en: "Media & Entertainment", ar: "الإعلام والترفيه" },
  { key: "Gaming", en: "Gaming & Esports", ar: "الألعاب والرياضات الإلكترونية" },
  { key: "Sports", en: "Sports Tech", ar: "التقنية الرياضية" },
  { key: "Travel", en: "Travel & Hospitality", ar: "السفر والضيافة" },
  { key: "Tourism", en: "Tourism & Events", ar: "السياحة والفعاليات" },
  { key: "Marketing", en: "Marketing & Adtech", ar: "التسويق وتقنية الإعلانات" },
  { key: "SocialImpact", en: "Social Impact & Nonprofit Tech", ar: "الأثر الاجتماعي والتقنية غير الربحية" },
  { key: "Consumer", en: "Consumer Apps & Services", ar: "تطبيقات وخدمات المستهلك" },
  { key: "B2BServices", en: "Business Services", ar: "خدمات الأعمال" },
  { key: OTHER_INDUSTRY, en: "Other", ar: "أخرى" },
];

/** The listed industry whose English label matches, or Other for a custom value. */
export function industryKeyFor(sectorEn: string): string {
  return INDUSTRIES.find((i) => i.key !== OTHER_INDUSTRY && i.en === sectorEn)?.key ?? OTHER_INDUSTRY;
}
