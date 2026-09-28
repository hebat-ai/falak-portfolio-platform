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
    manage: {
      sectionTitle: string;
      nameEnLabel: string;
      nameArLabel: string;
      slugLabel: string;
      sectorEnLabel: string;
      sectorArLabel: string;
      customerModelLabel: string;
      revenueModelsLabel: string;
      currencyLabel: string;
      entryStageLabel: string;
      currentStageLabel: string;
      typeLabel: string;
      submitLabel: string;
      archiveAction: string;
      companyLabel: string;
      vehicleLabel: string;
      investedAmountLabel: string;
      ownershipPctLabel: string;
      signedDateLabel: string;
      templateLabel: string;
      periodLabelLabel: string;
      periodStartLabel: string;
      periodEndLabel: string;
      deadlineLabel: string;
      emailLabel: string;
      addMetricAction: string;
      metricKeyLabel: string;
      metricLabelEnLabel: string;
      metricLabelArLabel: string;
      metricDataTypeLabel: string;
      selectPlaceholder: string;
      createCompanyTitle: string;
      createVehicleTitle: string;
      createInvestorTitle: string;
      linkVehicleTitle: string;
      createTemplateTitle: string;
      createCycleTitle: string;
      createInviteTitle: string;
      companiesListTitle: string;
      vehiclesListTitle: string;
      investorsListTitle: string;
      successMessage: string;
      inviteCreatedMessage: string;
      copyLinkAction: string;
      linkCopiedMessage: string;
    };
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
  submitReport: {
    prototypeNotice: string;
    openFormLinkLabel: string;
    backToCompanyReport: string;
    revenueHint: string;
    saveDraftButton: string;
    submitButton: string;
    draftSavedMessage: string;
    submitSuccessMessage: string;
    validationRequired: string;
    validationNegative: string;
    validationInvalid: string;
    lockedMessage: string;
    unsavedChangesConfirm: string;
    noActiveCycleMessage: string;
    metricsNotConfiguredMessage: string;
    metricsIncompleteMessage: string;
  };
  reviewWorkspace: {
    subtitle: string;
    statusActionableOption: string;
    searchPlaceholder: string;
    reviewAction: string;
    actionPanelTitle: string;
    selectPrompt: string;
    startReviewAction: string;
    requestChangesAction: string;
    approveAction: string;
    publishAction: string;
    noActionAvailable: string;
    statusUpdatedPrefix: string;
    removedFromFilterSuffix: string;
    prototypeNotice: string;
    emptyQueueMessage: string;
    queueCaption: string;
    narrativeEnLabel: string;
    narrativeArLabel: string;
    narrativeKinds: {
      operational_update: string;
      quarter_highlights: string;
      investment_review_notes: string;
      management_commentary: string;
    };
  };
  investorDashboard: {
    subtitle: string;
    prototypeNotice: string;
    viewerRoleLabel: string;
    investorSelectLabel: string;
    companiesInScopeLabel: string;
    vehicleExposureTitle: string;
    visibleCompaniesLabel: string;
    companiesTableTitle: string;
    companiesTableCaption: string;
    noApprovedReports: string;
  };
  companyRegister: {
    subtitle: string;
    periodColumnLabel: string;
    overdueColumnLabel: string;
    registerCaption: string;
    emptyRegisterMessage: string;
    searchPlaceholder: string;
  };
  vehicleDirectory: {
    subtitle: string;
    emptyMessage: string;
  };
  submitPortal: {
    subtitle: string;
    prototypeNotice: string;
    viewerRoleLabel: string;
    companySelectLabel: string;
    willOpenEditableMessage: string;
    willOpenLockedMessage: string;
    noCompaniesMessage: string;
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
    manage: {
      sectionTitle: "Manage Portfolio",
      nameEnLabel: "Name (English)",
      nameArLabel: "Name (Arabic)",
      slugLabel: "Slug (used in URLs, e.g. my-company)",
      sectorEnLabel: "Sector (English)",
      sectorArLabel: "Sector (Arabic)",
      customerModelLabel: "Customer Model",
      revenueModelsLabel: "Revenue Models",
      currencyLabel: "Currency",
      entryStageLabel: "Entry Stage",
      currentStageLabel: "Current Stage",
      typeLabel: "Type",
      submitLabel: "Create",
      archiveAction: "Archive",
      companyLabel: "Company",
      vehicleLabel: "Vehicle",
      investedAmountLabel: "Invested Amount",
      ownershipPctLabel: "Ownership % (e.g. 0.10 for 10%)",
      signedDateLabel: "Signed Date",
      templateLabel: "Reporting Template",
      periodLabelLabel: "Period Label (e.g. Q3 2026)",
      periodStartLabel: "Period Start",
      periodEndLabel: "Period End",
      deadlineLabel: "Submission Deadline",
      emailLabel: "Email",
      addMetricAction: "Add another metric",
      metricKeyLabel: "Metric Key (e.g. revenue_b2b)",
      metricLabelEnLabel: "Metric Label (English)",
      metricLabelArLabel: "Metric Label (Arabic)",
      metricDataTypeLabel: "Data Type",
      selectPlaceholder: "Select...",
      createCompanyTitle: "New Company",
      createVehicleTitle: "New Vehicle",
      createInvestorTitle: "New Investor",
      linkVehicleTitle: "Link Vehicle to Company",
      createTemplateTitle: "New Reporting Template",
      createCycleTitle: "New Reporting Cycle",
      createInviteTitle: "Send Company Invite",
      companiesListTitle: "Companies",
      vehiclesListTitle: "Vehicles",
      investorsListTitle: "Investors",
      successMessage: "Saved.",
      inviteCreatedMessage: "Invite created. Copy this link and send it to the company yourself — email delivery isn't wired up yet.",
      copyLinkAction: "Copy link",
      linkCopiedMessage: "Copied.",
    },
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
  submitReport: {
    prototypeNotice:
      "Prototype only — this form has no real authentication or authorization, and nothing entered here is saved to a server. Status-based locking shown in this UI is a design preview, not a security boundary.",
    openFormLinkLabel: "Open Reporting Form",
    backToCompanyReport: "Back to Company Report",
    revenueHint: "Enter 0 if there was no revenue this period. Leave blank only if the figure isn't known yet.",
    saveDraftButton: "Save Draft",
    submitButton: "Submit Report",
    draftSavedMessage: "Draft saved in this preview only. It will reset on reload.",
    submitSuccessMessage: "Submission simulated for this preview. Nothing was sent or saved to a server.",
    validationRequired: "Revenue is required to submit.",
    validationNegative: "Revenue cannot be negative.",
    validationInvalid: "Enter a valid number.",
    lockedMessage: "This report can no longer be edited here.",
    unsavedChangesConfirm: "You have unsaved changes. Discard them?",
    noActiveCycleMessage: "There is no active reporting cycle for this company right now.",
    metricsNotConfiguredMessage:
      "Report data entry is not yet connected — it depends on Falak's reporting template, which has not been defined yet.",
    metricsIncompleteMessage: "This report is missing required information and cannot be submitted yet.",
  },
  reviewWorkspace: {
    subtitle: "Review submitted reports and manage their approval status.",
    statusActionableOption: "Actionable (Submitted + Under Review)",
    searchPlaceholder: "Search company or sector",
    reviewAction: "Review",
    actionPanelTitle: "Review Action",
    selectPrompt: "Select a report from the queue below to review it.",
    startReviewAction: "Start Review",
    requestChangesAction: "Request Changes",
    approveAction: "Approve",
    publishAction: "Publish",
    noActionAvailable: "No review action is available for this status.",
    statusUpdatedPrefix: "Status updated to",
    removedFromFilterSuffix: "This item no longer matches the current filter and has been removed from view.",
    prototypeNotice:
      "Prototype only — actions taken here are simulated in memory for this session and are not sent to or saved on any server, and there is no real authentication or authorization behind them. Reloading this page resets every change, and nothing here affects Company Report, Portfolio Overview, or any other page.",
    emptyQueueMessage: "No reports match the current filters.",
    queueCaption: "Reports in the review workspace, filtered by status and period.",
    narrativeEnLabel: "English",
    narrativeArLabel: "Arabic",
    narrativeKinds: {
      operational_update: "Operational Update",
      quarter_highlights: "Quarter Highlights",
      investment_review_notes: "Investment Review Notes",
      management_commentary: "Management Commentary",
    },
  },
  investorDashboard: {
    subtitle: "A read-only, simulated view of one investor's vehicle exposure.",
    prototypeNotice:
      "Prototype only — there are no real investor accounts. This selector simulates viewing as one of the synthetic investors; it is not a login, and nothing selected here is saved anywhere.",
    viewerRoleLabel: "Investor (demo)",
    investorSelectLabel: "Investor",
    companiesInScopeLabel: "Companies (Approved or Published)",
    vehicleExposureTitle: "Vehicle Exposure",
    visibleCompaniesLabel: "Visible companies this period",
    companiesTableTitle: "Companies",
    companiesTableCaption: "Companies visible to this investor for the selected period, approved or published only",
    noApprovedReports: "No approved or published reports for this period yet.",
  },
  companyRegister: {
    subtitle: "Every company's reporting record across all periods, browsable and filterable.",
    periodColumnLabel: "Period",
    overdueColumnLabel: "Overdue",
    registerCaption: "One row per company and reporting period, ordered by period with the newest first.",
    emptyRegisterMessage: "No reporting records match the current filters.",
    searchPlaceholder: "Search company or sector",
  },
  vehicleDirectory: {
    subtitle: "Browse every Falak investment vehicle and open its dashboard.",
    emptyMessage: "No investment vehicles are available yet.",
  },
  submitPortal: {
    subtitle: "Select a demo company to open its reporting form.",
    prototypeNotice:
      "Prototype only — there are no real startup accounts or authentication. This selector simulates viewing as one of the synthetic companies, and your selections are not saved. In production, a startup would arrive here already signed in as itself.",
    viewerRoleLabel: "Startup (demo)",
    companySelectLabel: "Company",
    willOpenEditableMessage: "This form will open ready to edit.",
    willOpenLockedMessage: "This form will open locked, read-only.",
    noCompaniesMessage: "No companies are available yet.",
  },
  notFound: {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or may have moved.",
    backToHome: "Back to Home",
  },
  home: {
    title: "Falak Portfolio Platform — Prototype",
    subtitle: "Frontend-only MVP prototype with synthetic demo data, for design review.",
    batch1Label: "MVP prototype",
    availableNow: "Available now",
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
    manage: {
      sectionTitle: "إدارة المحفظة",
      nameEnLabel: "الاسم (إنجليزي)",
      nameArLabel: "الاسم (عربي)",
      slugLabel: "المعرّف المختصر (يُستخدم في الروابط، مثال: my-company)",
      sectorEnLabel: "القطاع (إنجليزي)",
      sectorArLabel: "القطاع (عربي)",
      customerModelLabel: "نموذج العملاء",
      revenueModelsLabel: "نماذج الإيرادات",
      currencyLabel: "العملة",
      entryStageLabel: "مرحلة الاستثمار",
      currentStageLabel: "المرحلة الحالية",
      typeLabel: "النوع",
      submitLabel: "إنشاء",
      archiveAction: "أرشفة",
      companyLabel: "الشركة",
      vehicleLabel: "الأداة الاستثمارية",
      investedAmountLabel: "المبلغ المستثمر",
      ownershipPctLabel: "نسبة الملكية (مثال: 0.10 لنسبة 10%)",
      signedDateLabel: "تاريخ التوقيع",
      templateLabel: "قالب التقارير",
      periodLabelLabel: "اسم الفترة (مثال: الربع الثالث 2026)",
      periodStartLabel: "بداية الفترة",
      periodEndLabel: "نهاية الفترة",
      deadlineLabel: "الموعد النهائي للتقديم",
      emailLabel: "البريد الإلكتروني",
      addMetricAction: "إضافة مؤشر آخر",
      metricKeyLabel: "معرّف المؤشر (مثال: revenue_b2b)",
      metricLabelEnLabel: "تسمية المؤشر (إنجليزي)",
      metricLabelArLabel: "تسمية المؤشر (عربي)",
      metricDataTypeLabel: "نوع البيانات",
      selectPlaceholder: "اختر...",
      createCompanyTitle: "شركة جديدة",
      createVehicleTitle: "أداة استثمارية جديدة",
      createInvestorTitle: "مستثمر جديد",
      linkVehicleTitle: "ربط أداة استثمارية بشركة",
      createTemplateTitle: "قالب تقارير جديد",
      createCycleTitle: "دورة تقارير جديدة",
      createInviteTitle: "إرسال دعوة للشركة",
      companiesListTitle: "الشركات",
      vehiclesListTitle: "الأدوات الاستثمارية",
      investorsListTitle: "المستثمرون",
      successMessage: "تم الحفظ.",
      inviteCreatedMessage: "تم إنشاء الدعوة. انسخ هذا الرابط وأرسله إلى الشركة بنفسك — إرسال البريد الإلكتروني التلقائي غير مُفعّل بعد.",
      copyLinkAction: "نسخ الرابط",
      linkCopiedMessage: "تم النسخ.",
    },
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
  submitReport: {
    prototypeNotice:
      "نموذج أولي فقط — لا يتضمن هذا النموذج مصادقة أو تفويضاً حقيقياً، ولا يتم حفظ أي بيانات تُدخل هنا على خادم. القفل المعروض حسب الحالة هو معاينة تصميمية وليس حاجزاً أمنياً.",
    openFormLinkLabel: "فتح نموذج التقرير",
    backToCompanyReport: "العودة إلى تقرير الشركة",
    revenueHint: "أدخل 0 في حال عدم وجود إيرادات لهذه الفترة. اترك الحقل فارغاً فقط إذا كان الرقم غير معروف بعد.",
    saveDraftButton: "حفظ كمسودة",
    submitButton: "إرسال التقرير",
    draftSavedMessage: "تم حفظ المسودة داخل هذه المعاينة فقط، وستُلغى عند إعادة تحميل الصفحة.",
    submitSuccessMessage: "تمت محاكاة إرسال التقرير في هذه المعاينة فقط، ولم يتم إرسال أو حفظ أي بيانات على خادم.",
    validationRequired: "الإيرادات مطلوبة للإرسال.",
    validationNegative: "لا يمكن أن تكون الإيرادات سالبة.",
    validationInvalid: "أدخل رقمًا صالحًا.",
    lockedMessage: "لا يمكن تعديل هذا التقرير هنا بعد الآن.",
    unsavedChangesConfirm: "لديك تغييرات غير محفوظة. هل تريد تجاهلها؟",
    noActiveCycleMessage: "لا توجد دورة تقارير نشطة لهذه الشركة حالياً.",
    metricsNotConfiguredMessage:
      "لم يتم بعد ربط إدخال بيانات التقرير — فهو يعتمد على قالب التقارير الخاص بفلك، والذي لم يُحدَّد بعد.",
    metricsIncompleteMessage: "هذا التقرير يفتقد إلى معلومات مطلوبة ولا يمكن إرساله بعد.",
  },
  reviewWorkspace: {
    subtitle: "مراجعة التقارير المُقدَّمة وإدارة حالة اعتمادها.",
    statusActionableOption: "قابلة للإجراء (تم التقديم + قيد المراجعة)",
    searchPlaceholder: "ابحث عن شركة أو قطاع",
    reviewAction: "مراجعة",
    actionPanelTitle: "إجراء المراجعة",
    selectPrompt: "اختر تقريراً من القائمة أدناه لمراجعته.",
    startReviewAction: "بدء المراجعة",
    requestChangesAction: "طلب إجراء تعديلات",
    approveAction: "اعتماد",
    publishAction: "نشر",
    noActionAvailable: "لا يوجد إجراء مراجعة متاح لهذه الحالة.",
    statusUpdatedPrefix: "تم تحديث الحالة إلى",
    removedFromFilterSuffix: "لم يعد هذا العنصر مطابقاً لعامل التصفية الحالي وتمت إزالته من القائمة المعروضة.",
    prototypeNotice:
      "نموذج أولي فقط — الإجراءات المُتخذة هنا محاكاة داخل الذاكرة لهذه الجلسة فقط، ولا تُرسل أو تُحفظ على أي خادم، ولا تتضمن أي مصادقة أو تفويض حقيقي. تؤدي إعادة تحميل الصفحة إلى إلغاء جميع التغييرات، ولا يؤثر أي شيء هنا على تقرير الشركة أو نظرة عامة على المحفظة أو أي صفحة أخرى.",
    emptyQueueMessage: "لا توجد تقارير مطابقة لعوامل التصفية الحالية.",
    queueCaption: "التقارير في مساحة المراجعة، مُصفّاة حسب الحالة والفترة.",
    narrativeEnLabel: "الإنجليزية",
    narrativeArLabel: "العربية",
    narrativeKinds: {
      operational_update: "التحديث التشغيلي",
      quarter_highlights: "أبرز أحداث الربع",
      investment_review_notes: "ملاحظات مراجعة الاستثمار",
      management_commentary: "تعليق الإدارة",
    },
  },
  investorDashboard: {
    subtitle: "عرض للقراءة فقط يحاكي نطاق اطلاع مستثمر واحد على أدواته الاستثمارية.",
    prototypeNotice:
      "نموذج أولي فقط — لا توجد حسابات مستثمرين حقيقية. يحاكي هذا المحدد العرض كأحد المستثمرين الاصطناعيين، وهو ليس تسجيل دخول، ولا يُحفظ أي اختيار هنا في أي مكان.",
    viewerRoleLabel: "مستثمر (تجريبي)",
    investorSelectLabel: "المستثمر",
    companiesInScopeLabel: "الشركات (المعتمدة أو المنشورة)",
    vehicleExposureTitle: "الأدوات الاستثمارية المرتبطة",
    visibleCompaniesLabel: "الشركات المرئية لهذه الفترة",
    companiesTableTitle: "الشركات",
    companiesTableCaption: "الشركات المرئية لهذا المستثمر للفترة المحددة، المعتمدة أو المنشورة فقط",
    noApprovedReports: "لا توجد تقارير معتمدة أو منشورة لهذه الفترة بعد.",
  },
  companyRegister: {
    subtitle: "سجل تقارير كل شركة عبر جميع الفترات، قابل للتصفح والتصفية.",
    periodColumnLabel: "الفترة",
    overdueColumnLabel: "التأخير",
    registerCaption: "صف واحد لكل شركة وفترة تقرير، مرتب حسب الفترة مع تقديم الأحدث أولاً.",
    emptyRegisterMessage: "لا توجد سجلات تقارير مطابقة لعوامل التصفية الحالية.",
    searchPlaceholder: "ابحث عن شركة أو قطاع",
  },
  vehicleDirectory: {
    subtitle: "تصفح كل أداة استثمارية لدى فلك وافتح لوحتها.",
    emptyMessage: "لا توجد أدوات استثمارية متاحة حالياً.",
  },
  submitPortal: {
    subtitle: "اختر شركة تجريبية لفتح نموذج تقريرها.",
    prototypeNotice:
      "نموذج أولي فقط — لا توجد حسابات أو مصادقة حقيقية للشركات الناشئة. يحاكي هذا المحدد العرض كإحدى الشركات الاصطناعية، ولا يتم حفظ اختياراتك. في الإنتاج، تصل الشركة الناشئة إلى هنا وهي مسجّلة الدخول بالفعل.",
    viewerRoleLabel: "شركة ناشئة (تجريبية)",
    companySelectLabel: "الشركة",
    willOpenEditableMessage: "سيتم فتح هذا النموذج جاهزاً للتعديل.",
    willOpenLockedMessage: "سيتم فتح هذا النموذج مقفلاً للقراءة فقط.",
    noCompaniesMessage: "لا توجد شركات متاحة حالياً.",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    description: "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.",
    backToHome: "العودة إلى الصفحة الرئيسية",
  },
  home: {
    title: "منصة فلك لإدارة المحفظة — نموذج أولي",
    subtitle: "نموذج أولي (MVP) للواجهة الأمامية فقط ببيانات تجريبية اصطناعية، لمراجعة التصميم.",
    batch1Label: "نموذج أولي",
    availableNow: "متاح الآن",
    openAdmin: "فتح نظرة عامة على المحفظة",
  },
} satisfies Dictionary;
