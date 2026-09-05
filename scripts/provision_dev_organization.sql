-- ====================================================
-- REP TRACK: Initial Organization Provisioning (STEP 11)
-- Database: rep-track-dev
-- ====================================================

-- 1. Positions
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('MR', 'Medical Representative', 'مندوب دعاية طبية', 1);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('DM', 'District Manager', 'مدير منطقة', 2);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('AM', 'Area Manager', 'مدير إقليمي', 3);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('OM', 'Operations Manager', 'مدير عمليات', 3);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('BUM', 'Business Unit Manager', 'مدير وحدة أعمال', 4);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('PM', 'Product Manager', 'مدير منتج', 4);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('MM', 'Marketing Manager', 'مدير تسويق', 5);
INSERT OR REPLACE INTO `positions` (`code`, `title_en`, `title_ar`, `hierarchy_level`) VALUES ('SMD', 'Senior Managing Director', 'رئيس مجلس الإدارة التنفيذي', 6);

-- 2. Visit Objectives
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mr-01', 'MR', 'SCIENTIFIC_PROMOTION', 'الترويج العلمي / للمنتج', 'Scientific / Product Promotion', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mr-02', 'MR', 'DOCTOR_FOLLOW_UP', 'متابعة طبيب', 'Doctor Follow-up', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mr-03', 'MR', 'PHARMACY_STOCK_CHECK', 'فحص المخزون والتوفر بالصيدلية', 'Pharmacy Stock & Availability Check', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mr-04', 'MR', 'PRODUCT_AVAILABILITY_SURVEY', 'حصر توفر المنتجات بالمستشفيات', 'Hospital Product Availability Survey', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mr-05', 'MR', 'DISTRIBUTION_ORDER_COLLECTION', 'متابعة وتجميع طلبيات الموزعين', 'Distribution Order Follow-up', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mr-06', 'MR', 'KEY_OPINION_LEADER_ENGAGEMENT', 'التواصل مع كبار الأطباء والعملاء', 'Key Opinion Leader (KOL) Engagement', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-dm-01', 'DM', 'FIELD_COACHING_DOUBLE_VISIT', 'زيارة مرافقة وتدريب ميداني', 'Field Coaching / Double Visit', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-dm-02', 'DM', 'REP_PERFORMANCE_AUDIT', 'تقييم أداء المندوبين والميدان', 'Representative Performance Audit', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-dm-03', 'DM', 'DISTRICT_KEY_ACCOUNT_VISIT', 'زيارة كبار عملاء المنطقة والمستشفيات', 'District Key Account & Hospital Visit', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-dm-04', 'DM', 'DISTRIBUTOR_STOCK_AUDIT', 'مراجعة مخزون وتغطية فروع التوزيع', 'Distributor Branch Stock & Coverage Audit', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-dm-05', 'DM', 'TERRITORY_SALES_REVIEW', 'مراجعة المبيعات وتحقيق المستهدفات', 'Territory Sales Target Review', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-dm-06', 'DM', 'COMPETITIVE_THREAT_ANALYSIS', 'تحليل الأنشطة التنافسية بالمنطقة', 'Regional Competitive Threat Analysis', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-am-01', 'AM', 'REGIONAL_STRATEGY_ALIGNMENT', 'مواءمة الاستراتيجية الإقليمية', 'Regional Strategy Alignment', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-am-02', 'AM', 'TERRITORY_EXPANSION_ASSESSMENT', 'تقييم توسيع رقعة التغطية الإقليمية', 'Territory Expansion & Coverage Assessment', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-am-03', 'AM', 'INSTITUTIONAL_CONTRACT_FOLLOW_UP', 'متابعة عقود المستشفيات والمؤسسات الكبرى', 'Institutional Contract & Tender Follow-up', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-am-04', 'AM', 'CROSS_DISTRICT_PERFORMANCE_AUDIT', 'مراجعة الأداء عبر مختلف المناطق', 'Cross-District Performance Audit', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-am-05', 'AM', 'MANAGEMENT_COACHING', 'تدريب وتوجيه مديري المناطق (DMs)', 'District Manager Coaching & Supervision', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-am-06', 'AM', 'REGIONAL_MARKET_INTELLIGENCE', 'استخبارات السوق والقطاع الصحي الإقليمي', 'Regional Market Intelligence Review', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-om-01', 'OM', 'SUPPLY_CHAIN_BOTTLENECK_AUDIT', 'مراجعة تدفق التوريدات وسلاسل الإمداد', 'Supply Chain & Inventory Flow Audit', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-om-02', 'OM', 'DISTRIBUTION_EFFICIENCY_REVIEW', 'تقييم كفاءة وموثوقية شركات التوزيع', 'Distribution Efficiency & Delivery Review', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-om-03', 'OM', 'HOSPITAL_STOCKOUT_INTERVENTION', 'التدخل لحل نواقص المستشفيات الكبرى', 'Hospital Stockout Emergency Intervention', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-om-04', 'OM', 'FIELD_OPERATION_COMPLIANCE', 'التدقيق التشغيلي والامتثال الميداني', 'Field Operations Compliance Audit', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-om-05', 'OM', 'RESOURCE_ALLOCATION_AUDIT', 'مراجعة تخصيص الموارد والعينات الطبية', 'Resource Allocation & Sample Auditing', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-om-06', 'OM', 'BRANCH_LOGISTICS_OPTIMIZATION', 'تحسين المسارات اللوجستية وتغطية الفروع', 'Branch Logistics & Territory Route Optimization', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-bum-01', 'BUM', 'BU_PORTFOLIO_PERFORMANCE_AUDIT', 'مراجعة أداء محفظة وحدة الأعمال', 'Business Unit Portfolio Performance Audit', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-bum-02', 'BUM', 'NATIONAL_KEY_ACCOUNT_MANAGEMENT', 'إدارة وتفاوض الحسابات الاستراتيجية القومية', 'National Key Account Engagement', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-bum-03', 'BUM', 'MARKET_PENETRATION_STRATEGY', 'تقييم خطط النفاذ والتوسع السوقي للمنتجات', 'Market Penetration & Growth Strategy Review', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-bum-04', 'BUM', 'TENDER_FULFILLMENT_SUPERVISION', 'الإشراف على توريدات المناقصات الحكومية والجامعية', 'Government & University Tender Supervision', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-bum-05', 'BUM', 'MULTI_REGIONAL_FIELD_INSPECTION', 'جولة تفتيش ميدانية شاملة متعددة الأقاليم', 'Multi-Regional Field Leadership Tour', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-bum-06', 'BUM', 'CROSS_FUNCTIONAL_KPI_REVIEW', 'تقييم مؤشرات الأداء مع التسويق والعمليات', 'Cross-Functional Commercial KPI Review', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-pm-01', 'PM', 'PRODUCT_CAMPAIGN_FEEDBACK', 'استطلاع رأي الأطباء حول الحملة التسويقية', 'Marketing Campaign Effectiveness Survey', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-pm-02', 'PM', 'SCIENTIFIC_CONTENT_EVALUATION', 'تقييم استيعاب الرسالة العلمية والمواد الترويجية', 'Scientific Message Delivery Evaluation', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-pm-03', 'PM', 'KOL_ADVISORY_ENGAGEMENT', 'جلسة استشارية علمية مع قادة الرأي الطبي', 'KOL Advisory Board & Engagement', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-pm-04', 'PM', 'NEW_LAUNCH_FIELD_MONITORING', 'متابعة ميدانية مكثفة لإطلاق منتج جديد', 'New Product Launch Field Monitoring', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-pm-05', 'PM', 'COMPETITOR_MESSAGING_ANALYSIS', 'رصد رسائل المنافسين والبدائل العلاجية', 'Competitor Scientific Messaging Analysis', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-pm-06', 'PM', 'PATIENT_JOURNEY_INSIGHTS', 'دراسة مسار المريض وبروتوكولات العلاج بالمستشفيات', 'Patient Treatment Journey Field Insights', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mm-01', 'MM', 'MARKETING_STRATEGY_VALIDATION', 'التحقق الميداني من فاعلية الخطة التسويقية', 'Marketing Strategy Field Validation', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mm-02', 'MM', 'NATIONAL_MEDICAL_SOCIETY_MEETING', 'التنسيق مع الجمعيات الطبية والمؤتمرات القومية', 'National Medical Society Partnership Meeting', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mm-03', 'MM', 'BRAND_EQUITY_AUDIT', 'تقييم القيمة السوقية والصورة الذهنية للعلامات', 'Brand Equity & Health System Reputation Audit', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mm-04', 'MM', 'PORTFOLIO_SYNERGY_INSPECTION', 'مراجعة تكامل وترويج باقات المنتجات المشتركة', 'Cross-Portfolio Synergy & Promotion Review', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mm-05', 'MM', 'PM_TEAM_FIELD_EVALUATION', 'مرافقة وتقييم أداء مديري المنتجات ميدانياً', 'Product Management Team Field Supervision', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-mm-06', 'MM', 'ANNUAL_MARKETING_PLAN_AUDIT', 'مراجعة وتحديث أهداف المخطط التسويقي السنوي', 'Annual Commercial Marketing Plan Review', 6, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-smd-01', 'SMD', 'EXECUTIVE_FIELD_OVERSIGHT', 'جولة الرقابة التنفيذية العليا للإدارة', 'Executive Field Oversight & Governance', 1, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-smd-02', 'SMD', 'STRATEGIC_HEALTHCARE_PARTNERSHIPS', 'شراكات استراتيجية مع كبرى الهيئات الصحية', 'Strategic Healthcare Leadership Partnership', 2, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-smd-03', 'SMD', 'ORGANIZATIONAL_CULTURE_REVIEW', 'تعزيز ثقافة التميز والنزاهة المهنية ميدانياً', 'Organizational Culture & Field Integrity Review', 3, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-smd-04', 'SMD', 'NATIONWIDE_COMMERCIAL_AUDIT', 'التدقيق التجاري الشامل للعمليات على مستوى الجمهورية', 'Nationwide Commercial Operations Audit', 4, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-smd-05', 'SMD', 'KEY_HEALTHCARE_POLICY_ENGAGEMENT', 'متابعة السياسات والتشريعات الدوائية المؤثرة', 'Healthcare Policy & Sector Governance Review', 5, 1);
INSERT OR REPLACE INTO `visit_objectives` (`id`, `position_code`, `objective_code`, `name_ar`, `name_en`, `display_order`, `is_active`) VALUES ('obj-smd-06', 'SMD', 'SHAREHOLDER_VALUE_EXPANSION', 'استكشاف فرص التوسع الاستراتيجي الكبرى', 'Strategic Enterprise Growth & Expansion Review', 6, 1);

-- 3. Areas
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-001', 'Alex', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-002', 'Alex 1', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-003', 'Assuit', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-004', 'Behira/Kafr el shiekh', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-005', 'Cairo East', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-006', 'Doki/Mohandseen', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-007', 'Down Town', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-008', 'Down Town / Maadi', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-009', 'Down Town, Maadi/Helwan', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-010', 'Eman Alex 1', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-011', 'Fayoum/Benisuef', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-012', 'Gharbia / Menofya, Tanta / Menofya', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-013', 'Giza', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-014', 'Giza / Behira / Kafr el sheikh / Delta 1', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-015', 'Haram/Faisal', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-016', 'Imbaba', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-017', 'Maadi/Helwan', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-018', 'Mansoura', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-019', 'Masr El Gedida / Nasr City / Shobra', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-020', 'Masr El gedida', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-021', 'Masr El gedida / Nasr City', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-022', 'Menofya /Qalubia', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-023', 'Menofya/Qalubia', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-024', 'Mina , Assuit, Minya / Assuit', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-025', 'Minya', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-026', 'Nasr city', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-027', 'National', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-028', 'October', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-029', 'Qena /Red Sea', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-030', 'Sharkia /Mansoura, Mansoura /Sharkia', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-031', 'Sharkya /Portsaid', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-032', 'Shobra /Shobra el Khema', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-033', 'Sohag', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-034', 'Sohag , Qena , Red Sea, Sohag, Qena , Red Sea', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-035', 'Tanta', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-036', 'Unassigned', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-037', 'Vacant Alex 2', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-038', 'Vacant Behira', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-039', 'Vacant Cairo East', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-040', 'Vacant Haram faisyal', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-041', 'Vacant Maadi/Helwan', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-042', 'Vacant Nasr city', 1);
INSERT OR REPLACE INTO `areas` (`id`, `name`, `is_active`) VALUES ('area-043', 'sharkya', 1);

-- 4. Representatives
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr1', 'Awad Tmsah', 'Nasr city', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr2', 'Christena Roshdy', 'October', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr3', 'Peter Emad', 'Shobra /Shobra el Khema', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr4', 'shady Gamal', 'Fayoum/Benisuef', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr5', 'Kirollos Girgis', 'Minya', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr6', 'Yasser Yosry', 'Alex 1', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr7', 'Eman -Alex', 'Eman Alex 1', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr8', 'Ayman Younes', 'Mansoura', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr9', 'Sameh', 'sharkya', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr10', 'Philip Nayer', 'Masr El gedida', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr11', 'Fawzy Nasser', 'Cairo East', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr12', 'Esraa shehata', 'Down Town', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr13', 'Engy Hosny', 'Shobra /Shobra el Khema', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr14', 'Sara Adel', 'Doki/Mohandseen', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr15', 'Mostafa Ahmed', 'October', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr16', 'Mohamed Baiomy', 'Haram/Faisal', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr17', 'Amanda Medhat', 'Fayoum/Benisuef', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr18', 'Helana Alex 1', 'Alex 1', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr19', 'Marina Sameh', 'Tanta', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr20', 'Ahmed Hassan', 'Menofya/Qalubia', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr21', 'Ahmed el Mesalamy', 'Sharkya /Portsaid', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr22', 'Emad Latif', 'Mansoura', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr23', 'Katrin Hosny', 'Fayoum/Benisuef', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr24', 'Martina Micheel', 'Masr El gedida', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr25', 'Silvia Medhat', 'Maadi/Helwan', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr26', 'Yara', 'Imbaba', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr27', 'Ahmed el Behiry', 'Haram/Faisal', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr28', 'Mohamed Ezzat', 'Alex 1', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr29', 'Mina Nabil', 'Mansoura', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr30', 'Peter william', 'Tanta', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr31', 'John Amin', 'Assuit', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr32', 'Randa Magdy', 'Qena /Red Sea', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr33', 'Kirollos Adel', 'Sohag', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr34', 'Neven', 'Doki/Mohandseen', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr35', 'Fady Kamal', 'Shobra /Shobra el Khema', 1);
INSERT OR REPLACE INTO `representatives` (`id`, `name`, `area`, `is_active`) VALUES ('rep-mr36', 'Ahmed El Kot', 'Behira/Kafr el shiekh', 1);

-- 5. Users
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr1', 'MR1', 1, 'Awad Tmsah', '$2b$10$MmskhtNjbuXEOPXIzk0xguyZYLCbHyypC0eT9t1tgw4XrAb2WfgdC',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr1', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm1', 'DM1', 1, 'Azza Karim', '$2b$10$D3ZBPwE1dOJJKlqCUp0iguT1ybhQuT0N4hrEzPIO7GZHk4UT/rQQu',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm2', 'DM2', 2, 'Kirollos Rizk', '$2b$10$1KPrXj6j1vX4./35BnysOOqiBmx9RcLbLjVWFtSs8pD2sA4YfE4.2',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr2', 'MR2', 2, 'Christena Roshdy', '$2b$10$tyDR9zqokZOjZwulHdhwQ.AQ8ELlNcChD5LXExJqXslIAGB9.Izd.',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr2', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr3', 'MR3', 3, 'Peter Emad', '$2b$10$choaDM.SKAYHW.4bXrv.ueCVKMPg8AoO7EXQlRV78Su3gDAFrD.Ya',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr3', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm3', 'DM3', 3, 'Esraa el shimy', '$2b$10$VRoukMHwjtUyG8D5Hcr0QeJqISBvbkjcZfPDBo1FCz07vrxZlTVpK',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr4', 'MR4', 4, 'shady Gamal', '$2b$10$fpAp3l6njsXGCIWkBC2nkegW3PiRPSkv6xNP3h6tDr/8DQO5hafhm',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr4', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr5', 'MR5', 5, 'Kirollos Girgis', '$2b$10$haRWAR/GM/.0sPs.rsaai.g0woGVWCBIgSiBDcvkp5P0tmjsSmmkK',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr5', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr6', 'MR6', 6, 'Yasser Yosry', '$2b$10$/zwqgFQCFff8/3BwDAI6KOrc0JOKSIEmihRdvLZV8JmrgkPFEVXVy',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr6', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr7', 'MR7', 7, 'Eman -Alex', '$2b$10$3QA1b1c8RMXVoSWE1O8rWeYpibsFhaF7Wra58Zr.lIeurka1qsZx.',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr7', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr8', 'MR8', 8, 'Ayman Younes', '$2b$10$ihf/QCUgZmgEkdM9niZOMe74uB29ztipQwu2zyE8HEHUw/NmFD1xa',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr8', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr9', 'MR9', 9, 'Sameh', '$2b$10$obCbhyMAzQw52nJJQj8aN.M26a8r99E9dfpfjwALuHQ079o.adEE2',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr9', 1,
    1, 'MR1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr10', 'MR10', 10, 'Philip Nayer', '$2b$10$ely13h8E4rv7AKa6FuJem.V2gd5.urG4hzYBxBo6sB92jSUvGZh0y',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr10', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr11', 'MR11', 11, 'Fawzy Nasser', '$2b$10$fITEc2FN/ge/4Z0xKg3zAe50yhf0O3nRTZF7Oa.CrPsKt05FrIu8y',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr11', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr12', 'MR12', 12, 'Esraa shehata', '$2b$10$Bhb4MOgdHO7kcDodwp5ojOmSHUr2evATZ.rCVelTeZpYsf7.WvdSm',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr12', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr13', 'MR13', 13, 'Engy Hosny', '$2b$10$Nmpu5gBeaeRONHNm8Fgd1eb9Pwu3QpV6vUy8pz47PAjhqkayBOUaq',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr13', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr14', 'MR14', 14, 'Sara Adel', '$2b$10$n72QeV5XW4yrrCh5MPtRkuwKU4BEa/cc.4iTpWIexrxr6jRCREGBG',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr14', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr15', 'MR15', 15, 'Mostafa Ahmed', '$2b$10$hchpX4xDHRUqCdr2I17Qfe2jRZu9su6dUfXo9Vb1FCAvOtjRenUX.',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr15', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr16', 'MR16', 16, 'Mohamed Baiomy', '$2b$10$wKdDXSLKwcUztARqOKHJkupNNTxz0UnqiHSib0BbJT.97MTLpu.D6',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr16', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr17', 'MR17', 17, 'Amanda Medhat', '$2b$10$KZrvNiGH4xzCYv0HhVcYOOu8YuLj.ES/ucP0.0HqihDV30ZhKVl6e',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr17', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr18', 'MR18', 18, 'Helana Alex 1', '$2b$10$r6waGTxZO9Eo0YzHOWDCAeNS/qztK/Vt.wlxK/tfp4NfEVEFswrj.',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr18', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr19', 'MR19', 19, 'Marina Sameh', '$2b$10$R/vAuSpDylAICo.zKJwCu.fpREg7FbkyjmZIZWcqk2gIgbg/G7okW',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr19', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr20', 'MR20', 20, 'Ahmed Hassan', '$2b$10$6QeNq9zu0japuC5hWTsN7eWxEBYRuCIr08V6eiJ.W83Wga3I97Ydq',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr20', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr21', 'MR21', 21, 'Ahmed el Mesalamy', '$2b$10$p78o7WzBrJboCyKfSO3TcOZddxcX2U0WOWv6Oo0R0GTp29jt6rHNq',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr21', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr22', 'MR22', 22, 'Emad Latif', '$2b$10$ei67/4gBOulRmPiC6ZLq4Oe.cptv0rOIkmQCRtXzM6RP9o9BMyhO2',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr22', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr23', 'MR23', 23, 'Katrin Hosny', '$2b$10$DZ300FWA43SBLBLtA1LRFuG0jnnk6bZyTiEPm.dp8lEYdfZP3FroK',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr23', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr24', 'MR24', 24, 'Martina Micheel', '$2b$10$QHpEYzbJiXvTPlO5ht5.ie09tVCJsTzrChsL2rq0hZwNlo./VUBuC',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr24', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr25', 'MR25', 25, 'Silvia Medhat', '$2b$10$Nfrt5/etC0w4LeZH.7RsyOiDu87eaaoZwaprhBTrWR.99PM8xLybm',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr25', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr26', 'MR26', 26, 'Yara', '$2b$10$NdXFcX9LGdiU4g7r4rG36uuOqrT8V.u2hRLH9lEEFoeqZRr1wHBpu',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr26', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr27', 'MR27', 27, 'Ahmed el Behiry', '$2b$10$jafTRGa2yojH1l8TEQ./OO1IAQRS2XzSIyA.AGlAMEf5GmlnbhIKm',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr27', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr28', 'MR28', 28, 'Mohamed Ezzat', '$2b$10$3hCUn/itxBCEqVgmeGxDeuxtF8IG.eyrF0UuhJcQ09ZMMMeP4ubyK',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr28', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr29', 'MR29', 29, 'Mina Nabil', '$2b$10$y6GVHL7JYQIrf9SVzxknLu4yi7iLm5q5qBxIyM5.lr8AkmosQd49u',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr29', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr30', 'MR30', 30, 'Peter william', '$2b$10$kIAymxNf56v7tBxCDFjCmOTnmOi5b4HS4XJfCr5bnVdcpcn0KnJcK',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr30', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr31', 'MR31', 31, 'John Amin', '$2b$10$K7SDVui0QiNhGZb2/u5EcOZ4GEh9YMZ/jdenHSMP8crFKwUvX.j/W',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr31', 1,
    1, 'MR 1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr32', 'MR32', 32, 'Randa Magdy', '$2b$10$PfBJnHKzlvrIDS/kPZHoOO9olGpunVgLaHuhxRbCm6RIJemnQUQLW',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr32', 1,
    1, 'MR'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr33', 'MR33', 33, 'Kirollos Adel', '$2b$10$TBt583NlKTCQhGVFcqNIcueZ5kGViCEi0XUrmIOYBPf9vAHzy4wF.',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr33', 1,
    1, 'MR'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-bum1', 'BUM1', 1, 'Fady Nassif', '$2b$10$v3OfCMrqohtH/BeDB2ParexRL6YK93BWuulUrNSvPm7Hg8vyqBxBy',
    'BUM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'BUM1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-bum2', 'BUM2', 2, 'Osama Bert', '$2b$10$v5T9as3DCgOhcPxnIsmGkeMlo8c5AFJ8xXrLxR/ZG3fOUyOdmJAHy',
    'BUM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'BUM2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-bum3', 'BUM3', 3, 'Noha samir', '$2b$10$SgwTseWXgvVSAjbcWLV/duRg4eLjILLQiswXZU1rChaAOsUlFm68y',
    'BUM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'BUM3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-am1', 'AM1', 1, 'Michael Raafat', '$2b$10$wmw24TegLM9iGhueIA0a0.OApAu3cXEnSkgpYgd0Xq/clqY9UWT9q',
    'AM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'AM1'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-am2', 'AM2', 2, 'Michael Antonyo', '$2b$10$G0Du1gtKTPbzNU2.jc12R.fTwXN2khjslM0PNjRs5OtFD90c.fh5y',
    'AM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'AM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm4', 'DM4', 4, 'Rafik Maged', '$2b$10$XMtZDbEl5V.DyCJtNLfPmOZRJ.u1oPIEO5tdV2L.BCPLaagPafu4a',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm5', 'DM5', 5, 'Peter Basily', '$2b$10$gBhhktHZ4wkIj5cKFPztsO0TqDzuymVZ2MTWjhDXFVA/Nw9Q6f0EG',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-om1', 'OM1', 1, 'Peter Abdel Nour', '$2b$10$zXNIZgTSZP5K5GuQFgO/AO3kx.jibQm6F7xIOQQ5GLPrUFpAIVi/O',
    'OM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'OM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-om2', 'OM2', 2, 'Mina Michel', '$2b$10$z1mX8./oV3JL7S9e6gTKd.Dw9JeXlawwezJNGd1THbQTLEyijCQuC',
    'OM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'OM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm6', 'DM6', 6, 'Ashraf Shawky', '$2b$10$tHc3qs4KWnSJwTrnAc6xI./IrCpLBUblDLTPm949kkr5s8jQ/LuJy',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-om3', 'OM3', 3, 'Wael Atef', '$2b$10$KKgi5rwOhqMJPzyaiOGSde6w.8Ol./CQWwqcpQ.SXJU/GNcx7tDPu',
    'OM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'OM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm7', 'DM7', 7, 'Bassem Hanna', '$2b$10$JI6FwldBKIUNw1vsZKrx3.WtZz8HISrn9ap0P079EuIZ2YCBrFwtq',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM 2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm8', 'DM8', 8, 'Marwa shaaban', '$2b$10$HxB8q0YoaWHqVKa33tWpDuP6cGhTjvy250CwcS/qV7qGx0VBAw/N2',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm9', 'DM9', 9, 'Ramy Yousef', '$2b$10$x.w1S7vC2thi./0JJ93gbupnGCWdbwcwC3gLBc3XohNpWj5.gBvHq',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm10', 'DM10', 10, 'Naguib Mahfouz', '$2b$10$kFQELxNRu4y14XXhiSuyoe43p1riavC/vxa1GeFcjcbDMGvgYE8Pe',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm11', 'DM11', 11, 'Marian Adel', '$2b$10$X4Yhi0.owTiZC7/ZB2EzB.DLv5TQdYGk5IB6lQvruI7rH8me232Zu',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm12', 'DM12', 12, 'Milad Mikhaeel', '$2b$10$ga/aDD7nDWfYMRS1hngBE.QPkuQ5/0NqitXz/1o6PeIjxuXdVJZWW',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm13', 'DM13', 13, 'Maher Khamis', '$2b$10$zR2iJ.e6wwUnQDIS12skt.jKr.6tGC.i2II0bGhxqAQ8/yc3XD1WG',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-dm14', 'DM14', 14, 'Beshoy Samy', '$2b$10$XEcQ59hmpTGLh0nCvojWKuUoqc8l/EEDJZ/fTha8nbJ363omI3Xtq',
    'DM', 'MANAGER', 'MANAGER', NULL, 1,
    1, 'DM3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr34', 'MR34', 34, 'Neven', '$2b$10$ZZGNdLUNbS6/BrcJyPKBfOrQmzvTWCvVcgCjg9BDuRJ3rQAXT9SQK',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr34', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr35', 'MR35', 35, 'Fady Kamal', '$2b$10$kqDJS3g1gjENP0LNWw7h6e5cReU9d1nvs3.N8xChf42vl.oqrRmHa',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr35', 1,
    1, 'MR3'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mr36', 'MR36', 36, 'Ahmed El Kot', '$2b$10$SYHetsDsPflcqygK6WgtUuxMe0BPfWEGHklsrhBq99f6fnNFqFGcC',
    'MR', 'USER', 'REPRESENTATIVE', 'rep-mr36', 1,
    1, 'MR2'
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-pm1', 'PM1', 1, 'Mario Nader', '$2b$10$2XIybO19zLVUxHE4HXF8CO6QBOoA9IvkbXd0aOckJunmck.SZLLB.',
    'PM', 'MANAGER', 'MANAGER', NULL, 1,
    1, NULL
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-pm2', 'PM2', 2, 'Wael Morad', '$2b$10$wJ0TLdbm6AnPC2rhajakCu6tHmdSGBuyTgrwpSI8i5RWCIQcK9si2',
    'PM', 'MANAGER', 'MANAGER', NULL, 1,
    1, NULL
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-pm3', 'PM3', 3, 'Amr El Hoseny', '$2b$10$SJp3aXIDZ4uWQhwqSZlZ3.TBNZJs491nJKHzy9ud/yfnBRz3yUZyO',
    'PM', 'MANAGER', 'MANAGER', NULL, 1,
    1, NULL
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-mm1', 'MM1', 1, 'Magdy Nassif', '$2b$10$1bz7loiRfUAQqKDRudiWOO9AkbMO7GmO1NzINgVoMvcWB6d/kXBKO',
    'MM', 'MANAGER', 'MANAGER', NULL, 1,
    1, NULL
  );
INSERT OR REPLACE INTO `users` (
    `id`, `username`, `username_number`, `name`, `password_hash`,
    `position_code`, `system_role`, `role`, `rep_id`, `is_active`,
    `must_change_password`, `legacy_title_raw`
  ) VALUES (
    'u-smd1', 'SMD1', 1, 'Maged Raouf', '$2b$10$OnlJxX6rJWSjaG4jgOSSYO9YTS1SaSfau08T./3GXBOrO9J4d68dS',
    'SMD', 'ADMIN', 'MANAGER', NULL, 1,
    1, NULL
  );

-- 6. Manager Rep Scopes
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-001', 'u-dm1', 'rep-mr1');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-002', 'u-am1', 'rep-mr1');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-003', 'u-bum1', 'rep-mr1');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-004', 'u-am2', 'rep-mr2');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-005', 'u-bum1', 'rep-mr2');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-006', 'u-am1', 'rep-mr3');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-007', 'u-bum1', 'rep-mr3');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-008', 'u-dm4', 'rep-mr4');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-009', 'u-am2', 'rep-mr4');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-010', 'u-bum1', 'rep-mr4');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-011', 'u-om3', 'rep-mr5');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-012', 'u-bum1', 'rep-mr5');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-013', 'u-om2', 'rep-mr6');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-014', 'u-bum1', 'rep-mr6');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-015', 'u-om2', 'rep-mr7');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-016', 'u-bum1', 'rep-mr7');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-017', 'u-dm5', 'rep-mr8');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-018', 'u-am2', 'rep-mr8');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-019', 'u-bum1', 'rep-mr8');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-020', 'u-dm5', 'rep-mr9');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-021', 'u-am2', 'rep-mr9');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-022', 'u-bum1', 'rep-mr9');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-023', 'u-bum2', 'rep-mr10');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-024', 'u-bum2', 'rep-mr11');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-025', 'u-dm8', 'rep-mr12');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-026', 'u-bum2', 'rep-mr12');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-027', 'u-bum2', 'rep-mr13');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-028', 'u-dm7', 'rep-mr14');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-029', 'u-bum2', 'rep-mr14');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-030', 'u-dm7', 'rep-mr15');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-031', 'u-bum2', 'rep-mr15');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-032', 'u-dm7', 'rep-mr16');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-033', 'u-bum2', 'rep-mr16');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-034', 'u-dm4', 'rep-mr17');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-035', 'u-bum2', 'rep-mr17');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-036', 'u-om2', 'rep-mr18');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-037', 'u-bum2', 'rep-mr18');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-038', 'u-om1', 'rep-mr19');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-039', 'u-bum2', 'rep-mr19');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-040', 'u-dm11', 'rep-mr20');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-041', 'u-om1', 'rep-mr20');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-042', 'u-bum2', 'rep-mr20');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-043', 'u-dm5', 'rep-mr21');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-044', 'u-am2', 'rep-mr21');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-045', 'u-bum2', 'rep-mr21');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-046', 'u-bum3', 'rep-mr21');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-047', 'u-dm5', 'rep-mr22');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-048', 'u-am2', 'rep-mr22');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-049', 'u-bum2', 'rep-mr22');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-050', 'u-dm4', 'rep-mr23');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-051', 'u-bum3', 'rep-mr23');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-052', 'u-dm9', 'rep-mr24');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-053', 'u-bum3', 'rep-mr24');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-054', 'u-dm9', 'rep-mr25');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-055', 'u-bum3', 'rep-mr25');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-056', 'u-dm10', 'rep-mr26');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-057', 'u-bum3', 'rep-mr26');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-058', 'u-dm10', 'rep-mr27');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-059', 'u-bum3', 'rep-mr27');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-060', 'u-dm12', 'rep-mr28');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-061', 'u-bum3', 'rep-mr28');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-062', 'u-dm5', 'rep-mr29');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-063', 'u-am2', 'rep-mr29');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-064', 'u-bum3', 'rep-mr29');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-065', 'u-om1', 'rep-mr30');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-066', 'u-bum3', 'rep-mr30');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-067', 'u-om3', 'rep-mr31');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-068', 'u-bum1', 'rep-mr31');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-069', 'u-bum2', 'rep-mr31');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-070', 'u-bum3', 'rep-mr31');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-071', 'u-dm6', 'rep-mr32');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-072', 'u-bum1', 'rep-mr32');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-073', 'u-bum2', 'rep-mr32');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-074', 'u-bum3', 'rep-mr32');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-075', 'u-dm6', 'rep-mr33');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-076', 'u-bum1', 'rep-mr33');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-077', 'u-bum2', 'rep-mr33');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-078', 'u-bum3', 'rep-mr33');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-079', 'u-dm10', 'rep-mr34');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-080', 'u-bum3', 'rep-mr34');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-081', 'u-dm14', 'rep-mr35');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-082', 'u-bum3', 'rep-mr35');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-083', 'u-dm13', 'rep-mr36');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-084', 'u-am2', 'rep-mr36');
INSERT OR REPLACE INTO `manager_rep_scopes` (`id`, `manager_user_id`, `rep_id`) VALUES ('mrs-085', 'u-bum2', 'rep-mr36');

-- 7. Manager Area Scopes
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-001', 'u-dm1', 'area-026');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-002', 'u-am1', 'area-026');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-003', 'u-bum1', 'area-026');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-004', 'u-dm2', 'area-040');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-005', 'u-am2', 'area-040');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-006', 'u-bum1', 'area-040');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-007', 'u-am2', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-008', 'u-bum1', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-009', 'u-dm2', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-010', 'u-am2', 'area-028');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-011', 'u-bum1', 'area-028');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-012', 'u-am1', 'area-032');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-013', 'u-bum1', 'area-032');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-014', 'u-bum1', 'area-009');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-015', 'u-dm3', 'area-009');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-016', 'u-dm3', 'area-041');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-017', 'u-bum1', 'area-041');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-018', 'u-dm8', 'area-041');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-019', 'u-bum2', 'area-041');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-020', 'u-dm3', 'area-039');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-021', 'u-bum1', 'area-039');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-022', 'u-dm4', 'area-011');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-023', 'u-am2', 'area-011');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-024', 'u-bum1', 'area-011');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-025', 'u-dm13', 'area-038');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-026', 'u-am2', 'area-038');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-027', 'u-bum1', 'area-038');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-028', 'u-om3', 'area-025');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-029', 'u-bum1', 'area-025');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-030', 'u-om2', 'area-002');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-031', 'u-bum1', 'area-002');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-032', 'u-om2', 'area-010');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-033', 'u-bum1', 'area-010');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-034', 'u-om2', 'area-037');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-035', 'u-bum2', 'area-037');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-036', 'u-dm12', 'area-037');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-037', 'u-bum3', 'area-037');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-038', 'u-dm5', 'area-018');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-039', 'u-am2', 'area-018');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-040', 'u-bum1', 'area-018');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-041', 'u-dm5', 'area-043');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-042', 'u-am2', 'area-043');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-043', 'u-bum1', 'area-043');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-044', 'u-bum2', 'area-020');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-045', 'u-bum2', 'area-005');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-046', 'u-dm8', 'area-007');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-047', 'u-bum2', 'area-007');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-048', 'u-bum2', 'area-032');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-049', 'u-dm7', 'area-006');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-050', 'u-bum2', 'area-006');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-051', 'u-dm7', 'area-028');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-052', 'u-bum2', 'area-028');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-053', 'u-dm7', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-054', 'u-bum2', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-055', 'u-dm8', 'area-042');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-056', 'u-bum2', 'area-042');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-057', 'u-bum2', 'area-011');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-058', 'u-bum2', 'area-002');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-059', 'u-om1', 'area-035');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-060', 'u-bum2', 'area-035');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-061', 'u-dm11', 'area-023');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-062', 'u-om1', 'area-023');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-063', 'u-bum2', 'area-023');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-064', 'u-dm5', 'area-031');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-065', 'u-am2', 'area-031');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-066', 'u-bum2', 'area-031');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-067', 'u-bum3', 'area-031');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-068', 'u-bum2', 'area-018');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-069', 'u-bum3', 'area-011');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-070', 'u-dm9', 'area-020');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-071', 'u-bum3', 'area-020');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-072', 'u-dm9', 'area-017');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-073', 'u-bum3', 'area-017');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-074', 'u-dm10', 'area-016');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-075', 'u-bum3', 'area-016');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-076', 'u-dm10', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-077', 'u-bum3', 'area-015');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-078', 'u-dm10', 'area-028');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-079', 'u-bum3', 'area-028');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-080', 'u-dm12', 'area-002');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-081', 'u-bum3', 'area-002');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-082', 'u-bum3', 'area-018');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-083', 'u-bum3', 'area-035');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-084', 'u-om3', 'area-003');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-085', 'u-bum1', 'area-003');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-086', 'u-bum2', 'area-003');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-087', 'u-bum3', 'area-003');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-088', 'u-bum2', 'area-025');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-089', 'u-dm6', 'area-029');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-090', 'u-bum1', 'area-029');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-091', 'u-bum2', 'area-029');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-092', 'u-bum3', 'area-029');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-093', 'u-dm6', 'area-033');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-094', 'u-bum1', 'area-033');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-095', 'u-bum2', 'area-033');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-096', 'u-bum3', 'area-033');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-097', 'u-bum1', 'area-027');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-098', 'u-bum2', 'area-027');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-099', 'u-bum3', 'area-027');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-100', 'u-bum1', 'area-021');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-101', 'u-am1', 'area-021');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-102', 'u-bum1', 'area-014');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-103', 'u-bum2', 'area-014');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-104', 'u-bum3', 'area-014');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-105', 'u-am2', 'area-014');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-106', 'u-am2', 'area-030');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-107', 'u-bum1', 'area-030');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-108', 'u-bum2', 'area-030');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-109', 'u-bum3', 'area-030');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-110', 'u-dm5', 'area-030');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-111', 'u-bum1', 'area-012');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-112', 'u-bum2', 'area-012');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-113', 'u-bum3', 'area-012');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-114', 'u-om1', 'area-012');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-115', 'u-bum1', 'area-001');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-116', 'u-bum2', 'area-001');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-117', 'u-bum3', 'area-001');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-118', 'u-om2', 'area-001');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-119', 'u-bum1', 'area-034');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-120', 'u-bum2', 'area-034');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-121', 'u-bum3', 'area-034');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-122', 'u-dm6', 'area-034');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-123', 'u-bum1', 'area-024');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-124', 'u-bum2', 'area-024');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-125', 'u-bum3', 'area-024');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-126', 'u-om3', 'area-024');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-127', 'u-bum2', 'area-013');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-128', 'u-dm7', 'area-013');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-129', 'u-bum2', 'area-008');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-130', 'u-dm8', 'area-008');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-131', 'u-bum3', 'area-019');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-132', 'u-dm9', 'area-019');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-133', 'u-bum3', 'area-013');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-134', 'u-dm10', 'area-013');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-135', 'u-om1', 'area-022');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-136', 'u-bum1', 'area-022');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-137', 'u-bum2', 'area-022');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-138', 'u-bum3', 'area-022');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-139', 'u-dm11', 'area-022');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-140', 'u-dm12', 'area-001');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-141', 'u-am2', 'area-004');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-142', 'u-bum1', 'area-004');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-143', 'u-bum2', 'area-004');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-144', 'u-bum3', 'area-004');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-145', 'u-dm13', 'area-004');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-146', 'u-dm9', 'area-032');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-147', 'u-bum3', 'area-032');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-148', 'u-dm14', 'area-032');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-149', 'u-dm10', 'area-006');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-150', 'u-bum3', 'area-006');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-151', 'u-am1', 'area-020');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-152', 'u-bum1', 'area-020');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-153', 'u-dm1', 'area-020');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-154', 'u-am2', 'area-006');
INSERT OR REPLACE INTO `manager_area_scopes` (`id`, `manager_user_id`, `area_id`) VALUES ('mas-155', 'u-bum1', 'area-006');
