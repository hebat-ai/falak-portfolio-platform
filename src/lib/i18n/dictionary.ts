import type {
  SubmissionStatus,
  FundingStage,
  CustomerModel,
  RevenueModel,
  Currency,
  VehicleType,
  InvestorType,
} from "@/generated/prisma/client";

export interface Dictionary {
  common: {
    appName: string;
  };
  nav: {
    portfolioOverview: string;
    investorDashboard: string;
    vehicleDashboard: string;
    companyReports: string;
    startupForm: string;
    reviewWorkspace: string;
    access: string;
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
  status: Record<SubmissionStatus, { label: string; description: string }>;
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
      revenueColumn: string;
      statusColumn: string;
      lastUpdatedColumn: string;
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
      createInvestorInviteTitle: string;
      investorLabel: string;
      vehiclesListTitle: string;
      investorsListTitle: string;
      successMessage: string;
      inviteCreatedMessage: string;
      copyLinkAction: string;
      linkCopiedMessage: string;
    };
  };
  companyReport: {
    profileTitle: string;
    revenueModelsLabel: string;
    linkedVehiclesTitle: string;
    noVehiclesLinked: string;
    backToRegister: string;
    backToMyCompanies: string;
    backToPrefix: string;
    narrativeTitle: string;
    historyTitle: string;
    noReportingHistory: string;
    revenueLabel: string;
    revenueGrowthLabel: string;
    revenueGrowthVsPrefix: string;
    revenueGrowthNoPriorPeriod: string;
    revenueGrowthInsufficientData: string;
  };
  vehicleReport: {
    backToDirectory: string;
    profileTitle: string;
    companiesLabel: string;
    companiesTableTitle: string;
    noCompaniesLinked: string;
    investorsTitle: string;
    noInvestorsLinked: string;
  };
  submitReport: {
    formTitle: string;
    openFormLinkLabel: string;
    backToCompanyReport: string;
    lockedMessage: string;
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
    investorSelectLabel: string;
    companiesInScopeLabel: string;
    vehicleExposureTitle: string;
    visibleCompaniesLabel: string;
    companiesTableTitle: string;
    companiesTableCaption: string;
    noApprovedReports: string;
    noOrgAccess: string;
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
    noMembershipsMessage: string;
    willOpenEditableMessage: string;
    willOpenLockedMessage: string;
  };
  notFound: {
    title: string;
    description: string;
    backToHome: string;
  };
  home: {
    title: string;
    subtitle: string;
    openAdmin: string;
    tagline: string;
    signInHeading: string;
    signUpHeading: string;
    signUpPrompt: string;
  };
  signUp: {
    pageTitle: string;
    emailLabel: string;
    roleLabel: string;
    roleOptions: { MANAGEMENT: string; INVESTMENT_PROFESSIONAL: string; INVESTOR: string };
    organizationLabel: string;
    organizationHint: string;
    messageLabel: string;
    submitAction: string;
    submitting: string;
    successMessage: string;
    existingAccountError: string;
    alreadyPendingError: string;
    genericError: string;
  };
  pendingApproval: {
    title: string;
    description: string;
  };
  access: {
    subtitle: string;
    viewOnlyNote: string;
    pendingRequestsTitle: string;
    noPendingRequests: string;
    requestedLabel: string;
    organizationRequestedLabel: string;
    messageLabel: string;
    approveAction: string;
    rejectAction: string;
    approveGrantLabel: string;
    approveOrgLabel: string;
    confirmReject: string;
    companiesTitle: string;
    investorsTitle: string;
    noOrgs: string;
    summaryCounts: string;
    membersLabel: string;
    pendingInvitesLabel: string;
    noMembers: string;
    noInvites: string;
    roles: { ADMIN: string; MEMBER: string };
    joinedLabel: string;
    sentLabel: string;
    expiresLabel: string;
    revokeAction: string;
    cancelInviteAction: string;
    confirmRevoke: string;
    confirmCancelInvite: string;
  };
}

export const en = {
  common: {
    appName: "Falak Portfolio Platform",
  },
  nav: {
    portfolioOverview: "Portfolio Overview",
    investorDashboard: "Investor Dashboard",
    vehicleDashboard: "Vehicle Dashboard",
    companyReports: "Company Reports",
    startupForm: "My Companies",
    reviewWorkspace: "Review & Approval",
    access: "Access Management",
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
      completionHint: "Approved for the selected period",
      overdueLabel: "Overdue Submissions",
      revenueSectionLabel: "Total Reported Revenue",
      noCrossCurrencyNote: "Shown separately per currency — never combined",
      excludesPrefix: "Excludes",
      excludesSuffixSingular: "company with no data submitted this period",
      summaryLabel: "Portfolio Summary",
    },
    reportingStatusPanel: {
      title: "Reporting Status",
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
      revenueColumn: "Revenue",
      statusColumn: "Status",
      lastUpdatedColumn: "Last Updated",
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
      createInvestorInviteTitle: "Send Investor Invite",
      investorLabel: "Investor",
      vehiclesListTitle: "Vehicles",
      investorsListTitle: "Investors",
      successMessage: "Saved.",
      inviteCreatedMessage: "Invite created. Copy this link and send it to the company yourself — email delivery isn't wired up yet.",
      copyLinkAction: "Copy link",
      linkCopiedMessage: "Copied.",
    },
  },
  companyReport: {
    profileTitle: "Company Profile",
    revenueModelsLabel: "Revenue Models",
    linkedVehiclesTitle: "Linked Investment Vehicles",
    noVehiclesLinked: "No investment vehicle linked",
    backToRegister: "Back to Company Reports",
    backToMyCompanies: "Back to My Companies",
    backToPrefix: "Back to",
    narrativeTitle: "Narrative",
    historyTitle: "Reporting History",
    noReportingHistory: "No reporting cycles have been created for this company yet.",
    revenueLabel: "Revenue",
    revenueGrowthLabel: "Revenue Growth",
    revenueGrowthVsPrefix: "vs.",
    revenueGrowthNoPriorPeriod: "No prior period to compare",
    revenueGrowthInsufficientData: "Insufficient comparable revenue data",
  },
  vehicleReport: {
    backToDirectory: "Back to Vehicles",
    profileTitle: "Vehicle Profile",
    companiesLabel: "Companies",
    companiesTableTitle: "Companies in this Vehicle",
    noCompaniesLinked: "No companies currently linked to this vehicle.",
    investorsTitle: "Investors",
    noInvestorsLinked: "No investor currently linked",
  },
  submitReport: {
    formTitle: "Reporting Form",
    openFormLinkLabel: "Open Reporting Form",
    backToCompanyReport: "Back to Company Report",
    lockedMessage: "This report can no longer be edited here.",
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
    subtitle: "Vehicle exposure and published company reports visible to your investor organization.",
    investorSelectLabel: "Investor",
    companiesInScopeLabel: "Companies (Approved)",
    vehicleExposureTitle: "Vehicle Exposure",
    visibleCompaniesLabel: "Visible companies this period",
    companiesTableTitle: "Companies",
    companiesTableCaption: "Companies visible to this investor for the selected period, approved only",
    noApprovedReports: "No published reports for this organization and period yet.",
    noOrgAccess: "You don't have access to any investor organization yet.",
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
    subtitle: "Your companies and where each one's current report stands.",
    noMembershipsMessage: "You aren't a member of any company yet. Company members are added by invitation.",
    willOpenEditableMessage: "This report is open for editing.",
    willOpenLockedMessage: "This report is locked while it's in review or approved.",
  },
  notFound: {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or may have moved.",
    backToHome: "Back to Home",
  },
  home: {
    title: "Falak Portfolio Platform",
    subtitle: "Portfolio reporting for Falak, its portfolio companies, and investors.",
    openAdmin: "Open Portfolio Overview",
    tagline: "Quarterly reporting, review, and investor access for Falak's portfolio — in one place.",
    signInHeading: "Sign in",
    signUpHeading: "Request access",
    signUpPrompt: "New here? Submit a request and Falak will grant access once it's approved.",
  },
  signUp: {
    pageTitle: "Request access",
    emailLabel: "Email",
    roleLabel: "I am a...",
    roleOptions: {
      MANAGEMENT: "Falak Management",
      INVESTMENT_PROFESSIONAL: "Falak Investment Professional",
      INVESTOR: "Investor",
    },
    organizationLabel: "Investor organization",
    organizationHint: "The fund, SPV, or firm you represent.",
    messageLabel: "Message (optional)",
    submitAction: "Submit request",
    submitting: "Submitting...",
    successMessage: "Your request has been received. Falak will email you once it's approved.",
    existingAccountError: "An account already exists for this email. Sign in instead.",
    alreadyPendingError: "A request for this email is already pending review.",
    genericError: "Something went wrong. Try again in a moment.",
  },
  pendingApproval: {
    title: "Pending approval",
    description: "Your access request is still under review. Falak will email you once it's approved.",
  },
  access: {
    subtitle: "Who can access each company and investor organization, plus invites that haven't been used yet.",
    viewOnlyNote: "View only — only Falak Admins can revoke access or cancel invites.",
    pendingRequestsTitle: "Pending Sign-Up Requests",
    noPendingRequests: "No pending requests.",
    requestedLabel: "Requested",
    organizationRequestedLabel: "Organization",
    messageLabel: "Message",
    approveAction: "Approve",
    rejectAction: "Reject",
    approveGrantLabel: "Grant role",
    approveOrgLabel: "Investor organization",
    confirmReject: "Reject the access request from {email}?",
    companiesTitle: "Companies",
    investorsTitle: "Investor Organizations",
    noOrgs: "No organizations yet.",
    summaryCounts: "{members} members · {invites} pending invites",
    membersLabel: "Members",
    pendingInvitesLabel: "Pending invites",
    noMembers: "No active members.",
    noInvites: "No pending invites.",
    roles: { ADMIN: "Admin", MEMBER: "Member" },
    joinedLabel: "Joined",
    sentLabel: "Sent",
    expiresLabel: "Expires",
    revokeAction: "Revoke",
    cancelInviteAction: "Cancel invite",
    confirmRevoke: "Revoke access for {email}? They lose access on their next page load.",
    confirmCancelInvite: "Cancel the invite sent to {email}? Its link will stop working.",
  },
} satisfies Dictionary;

export const ar = {
  common: {
    appName: "منصة فلك لإدارة المحفظة",
  },
  nav: {
    portfolioOverview: "نظرة عامة على المحفظة",
    investorDashboard: "لوحة المستثمر",
    vehicleDashboard: "لوحة الأداة الاستثمارية",
    companyReports: "تقارير الشركات",
    startupForm: "شركاتي",
    reviewWorkspace: "المراجعة والاعتماد",
    access: "إدارة الوصول",
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
      completionHint: "معتمدة للفترة المحددة",
      overdueLabel: "تقارير متأخرة عن التقديم",
      revenueSectionLabel: "إجمالي الإيرادات المُبلّغ عنها",
      noCrossCurrencyNote: "تُعرض كل عملة على حدة — لا يتم دمجها",
      excludesPrefix: "لا يشمل",
      excludesSuffixSingular: "شركة لم تقدم بيانات لهذه الفترة",
      summaryLabel: "ملخص المحفظة",
    },
    reportingStatusPanel: {
      title: "حالة التقارير",
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
      revenueColumn: "الإيرادات",
      statusColumn: "الحالة",
      lastUpdatedColumn: "آخر تحديث",
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
      createInvestorInviteTitle: "إرسال دعوة للمستثمر",
      investorLabel: "المستثمر",
      vehiclesListTitle: "الأدوات الاستثمارية",
      investorsListTitle: "المستثمرون",
      successMessage: "تم الحفظ.",
      inviteCreatedMessage: "تم إنشاء الدعوة. انسخ هذا الرابط وأرسله إلى الشركة بنفسك — إرسال البريد الإلكتروني التلقائي غير مُفعّل بعد.",
      copyLinkAction: "نسخ الرابط",
      linkCopiedMessage: "تم النسخ.",
    },
  },
  companyReport: {
    profileTitle: "الملف التعريفي للشركة",
    revenueModelsLabel: "نماذج الإيرادات",
    linkedVehiclesTitle: "الأدوات الاستثمارية المرتبطة",
    noVehiclesLinked: "لا توجد أداة استثمارية مرتبطة",
    backToRegister: "العودة إلى تقارير الشركات",
    backToMyCompanies: "العودة إلى شركاتي",
    backToPrefix: "العودة إلى",
    narrativeTitle: "السرد",
    historyTitle: "سجل التقارير",
    noReportingHistory: "لم يتم إنشاء أي دورات تقارير لهذه الشركة بعد.",
    revenueLabel: "الإيرادات",
    revenueGrowthLabel: "نمو الإيرادات",
    revenueGrowthVsPrefix: "مقارنة بـ",
    revenueGrowthNoPriorPeriod: "لا توجد فترة سابقة للمقارنة",
    revenueGrowthInsufficientData: "بيانات إيرادات غير كافية للمقارنة",
  },
  vehicleReport: {
    backToDirectory: "العودة إلى الأدوات الاستثمارية",
    profileTitle: "الملف التعريفي للأداة الاستثمارية",
    companiesLabel: "الشركات",
    companiesTableTitle: "الشركات ضمن هذه الأداة الاستثمارية",
    noCompaniesLinked: "لا توجد شركات مرتبطة بهذه الأداة الاستثمارية حالياً.",
    investorsTitle: "المستثمرون",
    noInvestorsLinked: "لا يوجد مستثمر مرتبط حالياً",
  },
  submitReport: {
    formTitle: "نموذج التقرير",
    openFormLinkLabel: "فتح نموذج التقرير",
    backToCompanyReport: "العودة إلى تقرير الشركة",
    lockedMessage: "لا يمكن تعديل هذا التقرير هنا بعد الآن.",
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
    subtitle: "الأدوات الاستثمارية المرتبطة وتقارير الشركات المنشورة المرئية لمؤسستك الاستثمارية.",
    investorSelectLabel: "المستثمر",
    companiesInScopeLabel: "الشركات (المعتمدة)",
    vehicleExposureTitle: "الأدوات الاستثمارية المرتبطة",
    visibleCompaniesLabel: "الشركات المرئية لهذه الفترة",
    companiesTableTitle: "الشركات",
    companiesTableCaption: "الشركات المرئية لهذا المستثمر للفترة المحددة، المعتمدة فقط",
    noApprovedReports: "لا توجد تقارير منشورة لهذه المؤسسة والفترة بعد.",
    noOrgAccess: "ليس لديك وصول إلى أي مؤسسة استثمارية بعد.",
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
    subtitle: "شركاتك والوضع الحالي لتقرير كل منها.",
    noMembershipsMessage: "لست عضواً في أي شركة بعد. تتم إضافة أعضاء الشركات عبر دعوة.",
    willOpenEditableMessage: "هذا التقرير متاح للتعديل.",
    willOpenLockedMessage: "هذا التقرير مقفل أثناء المراجعة أو بعد الاعتماد.",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    description: "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.",
    backToHome: "العودة إلى الصفحة الرئيسية",
  },
  home: {
    title: "منصة فلك لإدارة المحفظة",
    subtitle: "تقارير المحفظة لفلك وشركات محفظتها ومستثمريها.",
    openAdmin: "فتح نظرة عامة على المحفظة",
    tagline: "التقارير الفصلية والمراجعة ووصول المستثمرين لمحفظة فلك — في مكان واحد.",
    signInHeading: "تسجيل الدخول",
    signUpHeading: "طلب الوصول",
    signUpPrompt: "جديد هنا؟ أرسل طلبًا وستمنحك فلك الوصول بعد الموافقة عليه.",
  },
  signUp: {
    pageTitle: "طلب الوصول",
    emailLabel: "البريد الإلكتروني",
    roleLabel: "أنا...",
    roleOptions: {
      MANAGEMENT: "إدارة فلك",
      INVESTMENT_PROFESSIONAL: "أخصائي استثمار في فلك",
      INVESTOR: "مستثمر",
    },
    organizationLabel: "المؤسسة الاستثمارية",
    organizationHint: "الصندوق أو الأداة الاستثمارية أو الجهة التي تمثلها.",
    messageLabel: "رسالة (اختياري)",
    submitAction: "إرسال الطلب",
    submitting: "جارٍ الإرسال...",
    successMessage: "تم استلام طلبك. ستُرسل لك فلك بريدًا إلكترونيًا عند الموافقة عليه.",
    existingAccountError: "يوجد حساب بالفعل لهذا البريد الإلكتروني. سجّل الدخول بدلاً من ذلك.",
    alreadyPendingError: "يوجد طلب معلّق بالفعل لهذا البريد الإلكتروني.",
    genericError: "حدث خطأ ما. حاول مرة أخرى بعد قليل.",
  },
  pendingApproval: {
    title: "بانتظار الموافقة",
    description: "لا يزال طلب الوصول الخاص بك قيد المراجعة. ستُرسل لك فلك بريدًا إلكترونيًا عند الموافقة عليه.",
  },
  access: {
    subtitle: "من يمكنه الوصول إلى كل شركة ومؤسسة استثمارية، إضافة إلى الدعوات التي لم تُستخدم بعد.",
    viewOnlyNote: "للعرض فقط — يمكن لمسؤولي فلك فقط إلغاء الوصول أو إلغاء الدعوات.",
    pendingRequestsTitle: "طلبات التسجيل المعلّقة",
    noPendingRequests: "لا توجد طلبات معلّقة.",
    requestedLabel: "الطلب",
    organizationRequestedLabel: "المؤسسة",
    messageLabel: "الرسالة",
    approveAction: "موافقة",
    rejectAction: "رفض",
    approveGrantLabel: "منح الدور",
    approveOrgLabel: "المؤسسة الاستثمارية",
    confirmReject: "رفض طلب الوصول من {email}؟",
    companiesTitle: "الشركات",
    investorsTitle: "المؤسسات الاستثمارية",
    noOrgs: "لا توجد مؤسسات بعد.",
    summaryCounts: "{members} أعضاء · {invites} دعوات معلّقة",
    membersLabel: "الأعضاء",
    pendingInvitesLabel: "الدعوات المعلّقة",
    noMembers: "لا يوجد أعضاء نشطون.",
    noInvites: "لا توجد دعوات معلّقة.",
    roles: { ADMIN: "مسؤول", MEMBER: "عضو" },
    joinedLabel: "انضم في",
    sentLabel: "أُرسلت في",
    expiresLabel: "تنتهي في",
    revokeAction: "إلغاء الوصول",
    cancelInviteAction: "إلغاء الدعوة",
    confirmRevoke: "إلغاء وصول {email}؟ سيفقد الوصول عند تحميل الصفحة التالية.",
    confirmCancelInvite: "إلغاء الدعوة المرسلة إلى {email}؟ سيتوقف رابطها عن العمل.",
  },
} satisfies Dictionary;
