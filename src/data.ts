import { Project, Task, Expense, Notice, DevelopmentPlan } from "./types";

export const INITIAL_MEMBERS = [
  "الوالد (أبو باسم)",
  "الوالدة (أم باسم)",
  "باسم (المنسق)",
  "عماد",
  "الأخت سارة",
  "العم أبو فهد",
  "الجميع بالتساوي"
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "صيانة عازل الأسطح قبل الشتاء",
    description: "تنظيف السطح تماماً من الأتربة وسد التشققات بمادة المعجون الإسمنتي، وفرد طبقتين من العزل المائي والحراري لمنع تسريب المطر في صالة الدور العلوي والمطبخ.",
    category: "maintenance",
    status: "active",
    priority: "high",
    leader: "الوالد (أبو باسم)",
    budget: 4500,
    spent: 1850,
    dueDate: "2026-06-25",
    createdAt: "2026-05-15"
  },
  {
    id: "proj-2",
    title: "تحضيرات المجلس والضيافة لعيد الأضحى",
    description: "إعادة ترتيب المجلس الكبير، غسيل السجاد والستائر، صيانة الإضاءة المعطلة، وتجهيز دلال القهوة وأطقم ومستلزمات التقديم والضيافة المناسبة لعيد الأضحى.",
    category: "events",
    status: "active",
    priority: "high",
    leader: "باسم (المنسق)",
    budget: 2000,
    spent: 850,
    dueDate: "2026-06-18",
    createdAt: "2026-05-20"
  },
  {
    id: "proj-3",
    title: "إنشاء ركن القراءة وألعاب الأطفال بالدور الأول",
    description: "تجهيز الركن الجانبي الفارغ في الصالة العلوية برفوف خشبية للكتب، مفرش أرضي مريح، وصناديق ملونة لفرز وترتيب ألعاب أطفال العائلة لتقليل الفوضى ببيت العائلة.",
    category: "improvement",
    status: "planning",
    priority: "medium",
    leader: "الأخت سارة",
    budget: 2500,
    spent: 0,
    dueDate: "2026-07-15",
    createdAt: "2026-05-28"
  },
  {
    id: "proj-4",
    title: "تظليل موقف سيارات الفناء الخارجي",
    description: "تركيب مظلة سيارات قماشية متينة (شينكو أو قماش بولي إيثيلين مقاوم للحرارة) تسع لسيارتين في الفناء الأمامي لبيت العائلة لحمايتها من شمس الصيف الحارة.",
    category: "furnishing",
    status: "planning",
    priority: "low",
    leader: "العم أبو فهد",
    budget: 6000,
    spent: 0,
    dueDate: "2026-08-01",
    createdAt: "2026-05-30"
  },
  {
    id: "proj-5",
    title: "استبدال مضخة فلتر خزان المياه الأرضي",
    description: "مضخة المياه تخرج صوتاً غريباً وتتوقف أحياناً. الحاجة لشراء مضخة إيطالية جديدة بقوة حصان ونصف مع حماية من التشغيل الجاف وتركيبها فوراً.",
    category: "emergency",
    status: "completed",
    priority: "high",
    leader: "عماد",
    budget: 1200,
    spent: 1150,
    dueDate: "2026-05-28",
    createdAt: "2026-05-24"
  }
];

export const INITIAL_TASKS: Task[] = [
  // proj-1
  {
    id: "task-1-1",
    projectId: "proj-1",
    text: "إزالة المخلفات الخشبية والعلب الفارغة وتكنيس السطح تماماً",
    completed: true,
    assignedTo: "عماد",
    priority: "high",
    dueDate: "2026-05-20"
  },
  {
    id: "task-1-2",
    projectId: "proj-1",
    text: "شراء رول عازل مائي مقاس 4 ملم مع الإسفلت السائل والفرشاة",
    completed: true,
    assignedTo: "باسم (المنسق)",
    priority: "high",
    dueDate: "2026-05-25"
  },
  {
    id: "task-1-3",
    projectId: "proj-1",
    text: "التعاقد مع فني الطلاء والفرد لتنفيذ الصهر واللصق بالحرارة",
    completed: false,
    assignedTo: "الوالد (أبو باسم)",
    priority: "high",
    dueDate: "2026-06-10"
  },
  {
    id: "task-1-4",
    projectId: "proj-1",
    text: "اختبار العزل بصب كمية من المياه وتركه يومين للاطمئنان",
    completed: false,
    assignedTo: "عماد",
    priority: "high",
    dueDate: "2026-06-15"
  },

  // proj-2
  {
    id: "task-2-1",
    projectId: "proj-2",
    text: "نقل السجاد القديم لمغسلة السجاد الوطنية الكبرى",
    completed: true,
    assignedTo: "عماد",
    priority: "medium",
    dueDate: "2026-05-22"
  },
  {
    id: "task-2-2",
    projectId: "proj-2",
    text: "شراء وتوصيل كشافات الإنارة المخفية الصفراء للمجلس",
    completed: true,
    assignedTo: "باسم (المنسق)",
    priority: "high",
    dueDate: "2026-05-28"
  },
  {
    id: "task-2-3",
    projectId: "proj-2",
    text: "جرد وتلميع فناجين وصواني المجلس وشراء دلة رسلان جديدة للقهوة",
    completed: false,
    assignedTo: "الوالدة (أم باسم)",
    priority: "medium",
    dueDate: "2026-06-12"
  },
  {
    id: "task-2-4",
    projectId: "proj-2",
    text: "شراء تشكيلة الشوكولاتة وحلويات العيد وبخور العود للمجلس",
    completed: false,
    assignedTo: "الأخت سارة",
    priority: "medium",
    dueDate: "2026-06-16"
  },

  // proj-3
  {
    id: "task-3-1",
    projectId: "proj-3",
    text: "أخذ مقاسات الجدار الجانبي وحساب عدد الرفوف المطلوبة بدقة",
    completed: false,
    assignedTo: "الأخت سارة",
    priority: "medium",
    dueDate: "2026-06-15"
  },
  {
    id: "task-3-2",
    projectId: "proj-3",
    text: "شراء الرفوف الخشبية البيضاء وحواملها الحديدية المخفية",
    completed: false,
    assignedTo: "باسم (المنسق)",
    priority: "low",
    dueDate: "2026-06-30"
  },
  {
    id: "task-3-3",
    projectId: "proj-3",
    text: "فرز وترتيب ألعاب الأطفال السليمة والتبرع بالألعاب المكررة والقديمة",
    completed: false,
    assignedTo: "الوالدة (أم باسم)",
    priority: "medium",
    dueDate: "2026-07-05"
  },

  // proj-5
  {
    id: "task-5-1",
    projectId: "proj-5",
    text: "فحص العطل مع السباك لمعرفة إمكانية صيانة الدينامو أو ضرورة استبداله",
    completed: true,
    assignedTo: "عماد",
    priority: "high",
    dueDate: "2026-05-25"
  },
  {
    id: "task-5-2",
    projectId: "proj-5",
    text: "شراء مضخة مياه صامتة ماركة 'بيدرولو' إيطالية أصلية 1.5 حصان",
    completed: true,
    assignedTo: "العم أبو فهد",
    priority: "high",
    dueDate: "2026-05-26"
  },
  {
    id: "task-5-3",
    projectId: "proj-5",
    text: "تركيب الدينامو وتمديد الكهرباء بشكل آمن مع فني السباكة",
    completed: true,
    assignedTo: "عماد",
    priority: "high",
    dueDate: "2026-05-27"
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1-1",
    projectId: "proj-1",
    description: "شراء لفائف العزل المالي والبيتومين السائل من محلات السباكة",
    amount: 1450,
    paidBy: "الوالد (أبو باسم)",
    date: "2026-05-24"
  },
  {
    id: "exp-1-2",
    projectId: "proj-1",
    description: "شراء معجون إسمنتي لسد الشقوق وفواصل زوايا الأسطح",
    amount: 400,
    paidBy: "باسم (المنسق)",
    date: "2026-05-25"
  },
  {
    id: "exp-2-1",
    projectId: "proj-2",
    description: "تكلفة غسيل ونفض سجاد المجلس الكبير (4 رولات سجادة دائرية)",
    amount: 450,
    paidBy: "باسم (المنسق)",
    date: "2026-05-23"
  },
  {
    id: "exp-2-2",
    projectId: "proj-2",
    description: "شراء كشاف شريط ليد وبراغي وتوابع صيانة إضاءة السقف",
    amount: 400,
    paidBy: "عماد",
    date: "2026-05-29"
  },
  {
    id: "exp-5-1",
    projectId: "proj-5",
    description: "شراء دينامو ومضخة المياه الإيطالية 1.5 حصان مع الفاتورة والضمان",
    amount: 950,
    paidBy: "العم أبو فهد",
    date: "2026-05-26"
  },
  {
    id: "exp-5-2",
    projectId: "proj-5",
    description: "أجرة تركيب السباك واختبار دورة سحب مياه الخزان",
    amount: 200,
    paidBy: "عماد",
    date: "2026-05-27"
  }
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: "notice-1",
    title: "شكر وتقدير لعضوي بيت العائلة",
    content: "نتوجه بجزيل الشكر لابننا عماد والعم أبو فهد على سرعة استجابتهم المتميزة بحل مشكلة انقطاع المياه وشراء ومتابعة تركيب مضخة الفلتر الجديدة للخزان الأرضي في وقت وجيز وصيانة التمديدات.",
    author: "الوالد (أبو باسم)",
    date: "2026-05-28",
    type: "announcement"
  },
  {
    id: "notice-2",
    title: "قرار تأجيل مشروع مظلة مواقف السيارات",
    content: "تم الاتفاق في جلسة العائلة الأسبوعية على تأجيل شراء وتركيب مظلة مواقف الفناء حتى مطلع شهر أغسطس القادم، لإعطاء الأولوية للانتهاء من الميزانية التشغيلية لعيد الأضحى وصيانة عازل أسطح البيت.",
    author: "باسم (المنسق)",
    date: "2026-05-30",
    type: "decision"
  },
  {
    id: "notice-3",
    title: "تنبيه هام ومحبة بشأن نفايات الحديقة",
    content: "يُرجى من الجميع الإشراف على أبنائهم لجمع مقتنياتهم من الحديقة الخلفية بعد اللعب مباشرة، للحفاظ على مظهر البيت الكبير ولأن شركة ري العشب ستقوم بقص الأطراف يوم الخميس القادم بمشيئة الله.",
    author: "الوالدة (أم باسم)",
    date: "2026-05-31",
    type: "note"
  }
];

export const INITIAL_DEV_PLANS: DevelopmentPlan[] = [
  {
    id: "plan-1",
    title: "نظام طاقة شمسية مستقل وصديق للبيئة",
    description: "تركيب ألواح شمسية فوق السطح العلوي لتغطية استهلاك السخانات ومكيفات الصالة الكبرى وتوفير ما لا يقل عن 45% من قيمة الفاتورة الشهرية للكهرباء.",
    suggestedBy: "باسم (المنسق)",
    estimatedCost: 15000,
    votes: ["باسم (المنسق)", "الأخت سارة", "عماد"],
    status: "studying",
    category: "تحسين بيئي وتوفير طاقة",
    createdAt: "2026-05-25"
  },
  {
    id: "plan-2",
    title: "الحديقة الزراعية المائية المعلقة بالسطح",
    description: "استخدام أنابيب الـ PVC لتأسيس نظام زراعة مائي ذكي لإنتاج الخضار الورقية كالنعناع والجرجير بتمويل عائلي مشترك لزيادة المسطح الأخضر بالبيت.",
    suggestedBy: "الوالدة (أم باسم)",
    estimatedCost: 3200,
    votes: ["الوالدة (أم باسم)", "الأخت سارة"],
    status: "approved",
    category: "تجميل وترفيه عائلي",
    createdAt: "2026-05-28"
  },
  {
    id: "plan-3",
    title: "بناء ملحق ألعاب وترفيه للأحفاد في الفناء الجانبي",
    description: "تأسيس غرفة زجاجية صغيرة مبردة تضم منطقة للعب ألعاب التركيب والطاولات وسبورة ذكية لتجميع أطفال العائلة وقضاء أوقات إيجابية ومنع الضجيج بالمجلس الرئيسي.",
    suggestedBy: "العم أبو فهد",
    estimatedCost: 22000,
    votes: ["العم أبو فهد", "عماد", "الأخت سارة"],
    status: "studying",
    category: "توسعة وبناء رفاهية",
    createdAt: "2026-05-30"
  }
];

