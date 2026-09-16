import type {
  ReportingStatus,
  FundingStage,
  CustomerModel,
  RevenueModel,
  Currency,
  VehicleType,
  InvestorType,
} from "../mock/types";

export interface Dictionary {
  common: {
    appName: string;
    dataAsOfLabel: string;
    syntheticDataNotice: string;
    viewingAsLabel: string;
    falakAdminRole: string;
    close: string;
  };
  nav: {
    portfolioOverview: string;
    investorDashboard: string;
    vehicleDashboard: string;
    companyReports: string;
    startupForm: string;
    reviewWorkspace: string;
    comingSoonBadge: string;
    openMenu: string;
    closeMenu: string;
  };
  language: {
    ariaSwitchToArabic: string;
    ariaSwitchToEnglish: string;
    buttonLabelAr: string;
    buttonLabelEn: string;
  };
  theme: {
    ariaSwitchToDark: string;
    ariaSwitchToLight: string;
  };
  status: Record<ReportingStatus, { label: string; description: string }>;
  stages: Record<FundingStage, string>;
  customerModels: Record<CustomerModel, string>;
  revenueModels: Record<RevenueModel, string>;
  currencyNames: Record<Currency, string>;
  vehicleTypes: Record<VehicleType, string>;
  investorTypes: Record<InvestorType, string>;
  admin: {
    title: string;
    subtitle: string;
    kpi: {
      companiesLabel: string;
      vehiclesLabel: string;
      investorsLabel: string;
      completionLabel: string;
      completionHint: string;
      overdueLabel: string;
      revenueSectionLabel: string;
      noCrossCurrencyNote: string;
      excludesPrefix: string;
      excludesSuffixSingular: string;
      summaryLabel: string;
    };
    reportingStatusPanel: {
      title: string;
      companyColumn: string;
      statusColumn: string;
      lastUpdatedColumn: string;
      deadlineColumn: string;
      neverSubmitted: string;
      daysOverdueSuffix: string;
      withinDeadline: string;
    };
    filters: {
      title: string;
      scopeNote: string;
      searchLabel: string;
      searchPlaceholder: string;
      clearSearchAriaLabel: string;
      vehicleLabel: string;
      periodLabel: string;
      currencyLabel: string;
      statusLabel: string;
      allOption: string;
      resetFilters: string;
      viewTable: string;
      viewCards: string;
    };
    table: {
      caption: string;
      companyColumn: string;
      sectorColumn: string;
      customerModelColumn: string;
      entryStageColumn: string;
      currentStageColumn: string;
      vehicleColumn: string;
      currencyColumn: string;
      revenueColumn: string;
      statusColumn: string;
      lastUpdatedColumn: string;
      multiVehicleSuffix: string;
      viewCompanyAction: string;
      noDataValue: string;
    };
    emptyState: string;
  };
  stub: {
    vehicleTitle: string;
    companyTitle: string;
    comingInBatch: string;
    backToOverview: string;
  };
  companyReport: {
    profileTitle: string;
    revenueModelsLabel: string;
    linkedVehiclesTitle: string;
    noVehiclesLinked: string;
    historyTitle: string;
    revenueLabel: string;
    revenueGrowthLabel: string;
    revenueGrowthVsPrefix: string;
    revenueGrowthNoPriorPeriod: string;
    revenueGrowthInsufficientData: string;
  };
  vehicleReport: {
    profileTitle: string;
    companiesLabel: string;
    companiesTableTitle: string;
    noCompaniesLinked: string;
    investorsTitle: string;
    noInvestorsLinked: string;
  };
  notFound: {
    title: string;
    description: string;
    backToHome: string;
  };
  home: {
    title: string;
    subtitle: string;
    batch1Label: string;
    availableNow: string;
    comingLater: string;
    openAdmin: string;
  };
}

export const en = {
  common: {
    appName: "Falak Portfolio Platform",
    dataAsOfLabel: "Data as of",
    syntheticDataNotice: "Synthetic demo data — for design review only",
    viewingAsLabel: "Viewing as",
    falakAdminRole: "Falak Admin (demo)",
    close: "Close",
  },
  nav: {
    portfolioOverview: "Portfolio Overview",
    investorDashboard: "Investor Dashboard",
    vehicleDashboard: "Vehicle Dashboard",
    companyReports: "Company Reports",
    startupForm: "Startup Reporting Form",
    reviewWorkspace: "Review & Approval",
    comingSoonBadge: "Coming soon",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  language: {
    ariaSwitchToArabic: "Switch to Arabic",
    ariaSwitchToEnglish: "Switch to English",
    buttonLabelAr: "العربية",
    buttonLabelEn: "English",
  },
  theme: {
    ariaSwitchToDark: "Switch to dark theme",
    ariaSwitchToLight: "Switch to light theme",
  },
  status: {
    draft: { label: "Draft", description: "Not yet submitted by the company" },
    submitted: { label: "Submitted", description: "Awaiting Falak review" },
    under_review: { label: "Under Review", description: "Falak is reviewing the submission" },
    changes_requested: { label: "Changes Requested", description: "Falak requested corrections from the company" },
    approved: { label: "Approved", description: "Approved, pending publication" },
    published: { label: "Published", description: "Visible to authorized investors" },
  },
  stages: {
    PreSeed: "Pre-Seed",
    Seed: "Seed",
    SeriesA: "Series A",
    SeriesB: "Series B",
    Later: "Later Stage",
  },
  customerModels: {
    B2B: "Business-to-Business (B2B)",
    B2C: "Business-to-Consumer (B2C)",
    B2B_B2C: "B2B & B2C",
  },
  revenueModels: {
    SaaS: "SaaS",
    Marketplace: "Marketplace",
    ECommerce: "E-Commerce",
    TransactionBased: "Transaction-Based",
    Subscription: "Subscription",
    Other: "Other",
  },
  currencyNames: {
    SAR: "Saudi Riyal (SAR)",
    USD: "US Dollar (USD)",
  },
  vehicleTypes: {
    Fund: "Fund",
    SPV: "SPV",
  },
  investorTypes: {
    Institutional: "Institutional",
    FamilyOffice: "Family Office",
    Individual: "Individual",
  },
  admin: {
    title: "Falak Admin — Portfolio Overview",
    subtitle: "Org-wide visibility across all portfolio companies, vehicles, and reporting cycles.",
    kpi: {
      companiesLabel: "Portfolio Companies",
      vehiclesLabel: "Investment Vehicles",
      investorsLabel: "Investors",
      completionLabel: "Reporting Completion",
      completionHint: "Approved or Published for the selected period",
      overdueLabel: "Overdue Submissions",
      revenueSectionLabel: "Total Reported Revenue",
      noCrossCurrencyNote: "Shown separately per currency — never combined",
      excludesPrefix: "Excludes",
      excludesSuffixSingular: "company with no data submitted this period",
      summaryLabel: "Portfolio Summary",
    },
    reportingStatusPanel: {
      title: "Reporting Status",
      companyColumn: "Company",
      statusColumn: "Status",
      lastUpdatedColumn: "Last Updated",
      deadlineColumn: "Deadline",
      neverSubmitted: "Not yet submitted",
      daysOverdueSuffix: "days overdue",
      withinDeadline: "Within deadline",
    },
    filters: {
      title: "Company List Filters",
      scopeNote: "Filters apply to the company list below; portfolio summary remains portfolio-wide.",
      searchLabel: "Search",
      searchPlaceholder: "Search company, sector, or vehicle",
      clearSearchAriaLabel: "Clear search",
      vehicleLabel: "Vehicle",
      periodLabel: "Reporting Period",
      currencyLabel: "Currency",
      statusLabel: "Status",
      allOption: "All",
      resetFilters: "Reset filters",
      viewTable: "Table view",
      viewCards: "Card view",
    },
    table: {
      caption: "Portfolio companies with their reporting status, vehicle, and latest reported revenue",
      companyColumn: "Company",
      sectorColumn: "Sector",
      customerModelColumn: "Customer Model",
      entryStageColumn: "Entry Stage",
      currentStageColumn: "Current Stage",
      vehicleColumn: "Vehicle",
      currencyColumn: "Currency",
      revenueColumn: "Revenue",
      statusColumn: "Status",
      lastUpdatedColumn: "Last Updated",
      multiVehicleSuffix: "vehicles",
      viewCompanyAction: "View report",
      noDataValue: "No data submitted",
    },
    emptyState: "No companies match the selected filters.",
  },
  stub: {
    vehicleTitle: "Vehicle Dashboard",
    companyTitle: "Company Performance Report",
    comingInBatch: "Full detail view coming in a later prototype batch.",
    backToOverview: "Back to Portfolio Overview",
  },
  companyReport: {
    profileTitle: "Company Profile",
    revenueModelsLabel: "Revenue Models",
    linkedVehiclesTitle: "Linked Investment Vehicles",
    noVehiclesLinked: "No investment vehicle linked",
    historyTitle: "Reporting History",
    revenueLabel: "Revenue",
    revenueGrowthLabel: "Revenue Growth",
    revenueGrowthVsPrefix: "vs.",
    revenueGrowthNoPriorPeriod: "No prior period to compare",
    revenueGrowthInsufficientData: "Insufficient comparable revenue data",
  },
  vehicleReport: {
    profileTitle: "Vehicle Profile",
    companiesLabel: "Companies",
    companiesTableTitle: "Companies in this Vehicle",
    noCompaniesLinked: "No companies currently linked to this vehicle.",
    investorsTitle: "Investors",
    noInvestorsLinked: "No investor currently linked",
  },
  notFound: {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or may have moved.",
    backToHome: "Back to Home",
  },
  home: {
    title: "Falak Portfolio Platform — Prototype",
    subtitle: "Phase 1 frontend visual prototype, built with synthetic demo data for design review.",
    batch1Label: "Batch 1",
    availableNow: "Available now",
    comingLater: "Coming in later batches",
    openAdmin: "Open Portfolio Overview",
  },
} satisfies Dictionary;

export const ar = {
  common: {
    appName: "منصة فلك لإدارة المحفظة",
    dataAsOfLabel: "البيانات كما في",
    syntheticDataNotice: "بيانات تجريبية اصطناعية — لأغراض مراجعة التصميم فقط",
    viewingAsLabel: "العرض بصفتك",
    falakAdminRole: "مسؤول فلك (تجريبي)",
    close: "إغلاق",
  },
  nav: {
    portfolioOverview: "نظرة عامة على المحفظة",
    investorDashboard: "لوحة المستثمر",
    vehicleDashboard: "لوحة الأداة الاستثمارية",
    companyReports: "تقارير الشركات",
    startupForm: "نموذج تقرير الشركة الناشئة",
    reviewWorkspace: "المراجعة والاعتماد",
    comingSoonBadge: "قريباً",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
  },
  language: {
    ariaSwitchToArabic: "التبديل إلى العربية",
    ariaSwitchToEnglish: "التبديل إلى الإنجليزية",
    buttonLabelAr: "العربية",
    buttonLabelEn: "English",
  },
  theme: {
    ariaSwitchToDark: "التبديل إلى الوضع الداكن",
    ariaSwitchToLight: "التبديل إلى الوضع الفاتح",
  },
  status: {
    draft: { label: "مسودة", description: "لم تقدمها الشركة بعد" },
    submitted: { label: "تم التقديم", description: "بانتظار مراجعة فلك" },
    under_review: { label: "قيد المراجعة", description: "يقوم فريق فلك بمراجعة التقرير" },
    changes_requested: { label: "طُلب إجراء تعديلات", description: "طلب فلك من الشركة إجراء تعديلات" },
    approved: { label: "تمت الموافقة", description: "تمت الموافقة، بانتظار النشر" },
    published: { label: "تم النشر", description: "متاح للمستثمرين المخوّلين" },
  },
  stages: {
    PreSeed: "مرحلة ما قبل البذرة",
    Seed: "المرحلة البذرية",
    SeriesA: "السلسلة أ",
    SeriesB: "السلسلة ب",
    Later: "مرحلة لاحقة",
  },
  customerModels: {
    B2B: "أعمال إلى أعمال",
    B2C: "أعمال إلى مستهلك",
    B2B_B2C: "أعمال إلى أعمال ومستهلكين",
  },
  revenueModels: {
    SaaS: "برمجيات كخدمة (SaaS)",
    Marketplace: "سوق إلكتروني",
    ECommerce: "تجارة إلكترونية",
    TransactionBased: "قائم على المعاملات",
    Subscription: "اشتراك",
    Other: "أخرى",
  },
  currencyNames: {
    SAR: "ريال سعودي (SAR)",
    USD: "دولار أمريكي (USD)",
  },
  vehicleTypes: {
    Fund: "صندوق",
    SPV: "كيان استثماري خاص (SPV)",
  },
  investorTypes: {
    Institutional: "مستثمر مؤسسي",
    FamilyOffice: "مكتب عائلي",
    Individual: "مستثمر فردي",
  },
  admin: {
    title: "إدارة فلك — نظرة عامة على المحفظة",
    subtitle: "رؤية شاملة على مستوى المؤسسة لجميع شركات المحفظة والأدوات الاستثمارية ودورات التقارير.",
    kpi: {
      companiesLabel: "شركات المحفظة",
      vehiclesLabel: "الأدوات الاستثمارية",
      investorsLabel: "المستثمرون",
      completionLabel: "نسبة اكتمال التقارير",
      completionHint: "معتمدة أو منشورة للفترة المحددة",
      overdueLabel: "تقارير متأخرة عن التقديم",
      revenueSectionLabel: "إجمالي الإيرادات المُبلّغ عنها",
      noCrossCurrencyNote: "تُعرض كل عملة على حدة — لا يتم دمجها",
      excludesPrefix: "لا يشمل",
      excludesSuffixSingular: "شركة لم تقدم بيانات لهذه الفترة",
      summaryLabel: "ملخص المحفظة",
    },
    reportingStatusPanel: {
      title: "حالة التقارير",
      companyColumn: "الشركة",
      statusColumn: "الحالة",
      lastUpdatedColumn: "آخر تحديث",
      deadlineColumn: "الموعد النهائي",
      neverSubmitted: "لم يتم التقديم بعد",
      daysOverdueSuffix: "يوم تأخير",
      withinDeadline: "ضمن الموعد النهائي",
    },
    filters: {
      title: "تصفية قائمة الشركات",
      scopeNote: "تُطبق عوامل التصفية على قائمة الشركات أدناه، بينما يظل ملخص المحفظة شاملاً.",
      searchLabel: "بحث",
      searchPlaceholder: "ابحث عن شركة أو قطاع أو أداة استثمارية",
      clearSearchAriaLabel: "مسح البحث",
      vehicleLabel: "الأداة الاستثمارية",
      periodLabel: "فترة التقرير",
      currencyLabel: "العملة",
      statusLabel: "الحالة",
      allOption: "الكل",
      resetFilters: "إعادة تعيين عوامل التصفية",
      viewTable: "عرض الجدول",
      viewCards: "عرض البطاقات",
    },
    table: {
      caption: "شركات المحفظة مع حالة التقارير والأداة الاستثمارية وآخر إيرادات مُبلّغ عنها",
      companyColumn: "الشركة",
      sectorColumn: "القطاع",
      customerModelColumn: "نموذج العملاء",
      entryStageColumn: "مرحلة الاستثمار",
      currentStageColumn: "المرحلة الحالية",
      vehicleColumn: "الأداة الاستثمارية",
      currencyColumn: "العملة",
      revenueColumn: "الإيرادات",
      statusColumn: "الحالة",
      lastUpdatedColumn: "آخر تحديث",
      multiVehicleSuffix: "أدوات استثمارية",
      viewCompanyAction: "عرض التقرير",
      noDataValue: "لا توجد بيانات مُقدَّمة",
    },
    emptyState: "لا توجد شركات مطابقة لعوامل التصفية المحددة.",
  },
  stub: {
    vehicleTitle: "لوحة الأداة الاستثمارية",
    companyTitle: "تقرير أداء الشركة",
    comingInBatch: "العرض التفصيلي الكامل سيتوفر في دفعة لاحقة من النموذج الأولي.",
    backToOverview: "العودة إلى نظرة عامة على المحفظة",
  },
  companyReport: {
    profileTitle: "الملف التعريفي للشركة",
    revenueModelsLabel: "نماذج الإيرادات",
    linkedVehiclesTitle: "الأدوات الاستثمارية المرتبطة",
    noVehiclesLinked: "لا توجد أداة استثمارية مرتبطة",
    historyTitle: "سجل التقارير",
    revenueLabel: "الإيرادات",
    revenueGrowthLabel: "نمو الإيرادات",
    revenueGrowthVsPrefix: "مقارنة بـ",
    revenueGrowthNoPriorPeriod: "لا توجد فترة سابقة للمقارنة",
    revenueGrowthInsufficientData: "بيانات إيرادات غير كافية للمقارنة",
  },
  vehicleReport: {
    profileTitle: "الملف التعريفي للأداة الاستثمارية",
    companiesLabel: "الشركات",
    companiesTableTitle: "الشركات ضمن هذه الأداة الاستثمارية",
    noCompaniesLinked: "لا توجد شركات مرتبطة بهذه الأداة الاستثمارية حالياً.",
    investorsTitle: "المستثمرون",
    noInvestorsLinked: "لا يوجد مستثمر مرتبط حالياً",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    description: "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.",
    backToHome: "العودة إلى الصفحة الرئيسية",
  },
  home: {
    title: "منصة فلك لإدارة المحفظة — نموذج أولي",
    subtitle: "نموذج أولي مرئي للواجهة الأمامية (المرحلة الأولى)، مبني ببيانات تجريبية اصطناعية لمراجعة التصميم.",
    batch1Label: "الدفعة الأولى",
    availableNow: "متاح الآن",
    comingLater: "قادم في دفعات لاحقة",
    openAdmin: "فتح نظرة عامة على المحفظة",
  },
} satisfies Dictionary;
