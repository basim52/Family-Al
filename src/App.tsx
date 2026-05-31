import { useState, useEffect } from 'react';
import { Project, Task, Expense, Notice, ProjectStatus, DevelopmentPlan } from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_EXPENSES, 
  INITIAL_NOTICES,
  INITIAL_MEMBERS,
  INITIAL_DEV_PLANS
} from './data';

// Modular layouts
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import ProjectForm from './components/ProjectForm';
import ExpensesChart from './components/ExpensesChart';
import NoticeBoard from './components/NoticeBoard';
import AIAssistant from './components/AIAssistant';
import MembersManager from './components/MembersManager';
import ReportExporter from './components/ReportExporter';
import DevelopmentPlans from './components/DevelopmentPlans';

// Theme icons
import { Home, FolderClosed, CreditCard, Sparkles, Megaphone, CheckCircle, Info, Menu, X, Users, Trash2, Award, Lightbulb } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'projects' | 'expenses' | 'ai' | 'notices' | 'members' | 'devPlans'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Core state synced with LocalStorage for durable local persistence
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [devPlans, setDevPlans] = useState<DevelopmentPlan[]>([]);

  // Modals state
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProjectId, setExportProjectId] = useState<string | null>(null);

  // Sync to localStorage on state changes
  const saveProjectsToStorage = (updatedList: Project[]) => {
    setProjects(updatedList);
    localStorage.setItem('family_projects', JSON.stringify(updatedList));
  };

  const saveTasksToStorage = (updatedList: Task[]) => {
    setTasks(updatedList);
    localStorage.setItem('family_tasks', JSON.stringify(updatedList));
  };

  const saveExpensesToStorage = (updatedList: Expense[]) => {
    setExpenses(updatedList);
    localStorage.setItem('family_expenses', JSON.stringify(updatedList));
  };

  const saveNoticesToStorage = (updatedList: Notice[]) => {
    setNotices(updatedList);
    localStorage.setItem('family_notices', JSON.stringify(updatedList));
  };

  const saveMembersToStorage = (updatedList: string[]) => {
    setMembers(updatedList);
    localStorage.setItem('family_members', JSON.stringify(updatedList));
  };

  const saveDevPlansToStorage = (updatedList: DevelopmentPlan[]) => {
    setDevPlans(updatedList);
    localStorage.setItem('family_dev_plans', JSON.stringify(updatedList));
  };

  const handleResetAllData = () => {
    saveProjectsToStorage([]);
    saveTasksToStorage([]);
    saveExpensesToStorage([]);
    saveNoticesToStorage([]);
    saveMembersToStorage([]); // Clear all members per user's prompt request
    saveDevPlansToStorage([]);
    setSelectedProjectId(null);
    setShowResetConfirm(false);
  };

  const handleRestoreDefaults = () => {
    saveProjectsToStorage(INITIAL_PROJECTS);
    saveTasksToStorage(INITIAL_TASKS);
    saveExpensesToStorage(INITIAL_EXPENSES);
    saveNoticesToStorage(INITIAL_NOTICES);
    saveMembersToStorage(INITIAL_MEMBERS); // Restore defaults for fast testing
    saveDevPlansToStorage(INITIAL_DEV_PLANS);
    setSelectedProjectId(null);
    setShowResetConfirm(false);
  };

  // 1. Load Initial State From LocalStorage or Default Mock data
  useEffect(() => {
    const savedProjects = localStorage.getItem('family_projects');
    const savedTasks = localStorage.getItem('family_tasks');
    const savedExpenses = localStorage.getItem('family_expenses');
    const savedNotices = localStorage.getItem('family_notices');
    const savedMembers = localStorage.getItem('family_members');
    const savedDevPlans = localStorage.getItem('family_dev_plans');

    if (savedProjects) setProjects(JSON.parse(savedProjects));
    else setProjects(INITIAL_PROJECTS);

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    else setTasks(INITIAL_TASKS);

    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    else setExpenses(INITIAL_EXPENSES);

    if (savedNotices) setNotices(JSON.parse(savedNotices));
    else setNotices(INITIAL_NOTICES);

    if (savedDevPlans) setDevPlans(JSON.parse(savedDevPlans));
    else setDevPlans(INITIAL_DEV_PLANS);

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    } else {
      // By default, since the user asked to remove current names ("ازل الاسماء الحالية"),
      // we initialize to empty to let them build fresh names
      setMembers([]);
    }
  }, []);

  // Update projects spent total every time expenses change
  useEffect(() => {
    if (projects.length === 0) return;
    const updatedProjects = projects.map(p => {
      const projectSpent = expenses.filter(e => e.projectId === p.id).reduce((acc, e) => acc + e.amount, 0);
      return { ...p, spent: projectSpent };
    });

    // Simple deep equality check to prevent infinite loops
    if (JSON.stringify(projects.map(p => p.spent)) !== JSON.stringify(updatedProjects.map(p => p.spent))) {
      setProjects(updatedProjects);
      localStorage.setItem('family_projects', JSON.stringify(updatedProjects));
    }
  }, [expenses]);

  // 2. Project Actions Callbacks
  const handleSaveProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'spent'> & { id?: string }) => {
    if (projectData.id) {
      // Editing Mode
      const updated = projects.map(p => {
        if (p.id === projectData.id) {
          return {
            ...p,
            title: projectData.title,
            description: projectData.description,
            category: projectData.category,
            status: projectData.status,
            priority: projectData.priority,
            leader: projectData.leader,
            budget: projectData.budget,
            dueDate: projectData.dueDate,
          };
        }
        return p;
      });
      saveProjectsToStorage(updated);
    } else {
      // Creating Mode
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        status: projectData.status,
        priority: projectData.priority,
        leader: projectData.leader,
        budget: projectData.budget,
        spent: 0,
        dueDate: projectData.dueDate,
        createdAt: new Date().toISOString().split('T')[0]
      };
      saveProjectsToStorage([newProj, ...projects]);
    }

    setIsCreatingProject(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع العائلي وجميع المهام والفواتير المرتبطة به؟')) {
      const remainingProjects = projects.filter(p => p.id !== id);
      const remainingTasks = tasks.filter(t => t.projectId !== id);
      const remainingExpenses = expenses.filter(e => e.projectId !== id);
      
      saveProjectsToStorage(remainingProjects);
      saveTasksToStorage(remainingTasks);
      saveExpensesToStorage(remainingExpenses);
      
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    }
  };

  const handleUpdateStatus = (projectId: string, newStatus: ProjectStatus) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
    saveProjectsToStorage(updated);
  };

  const handleUpdateProjectPhoto = (projectId: string, photoUrl: string) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, photoUrl } : p);
    saveProjectsToStorage(updated);
  };

  // 3. Task Level Callbacks
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    saveTasksToStorage(updated);
  };

  const handleAddTask = (projectId: string, text: string, assignedTo: string, priority: 'high' | 'medium' | 'low') => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      text,
      completed: false,
      assignedTo,
      priority,
      dueDate: new Date().toISOString().split('T')[0]
    };
    saveTasksToStorage([...tasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasksToStorage(updated);
  };

  // Callback to import generated tasks directly into project tasks
  const handleAddSuggestedTasks = (projectId: string, tasksToAppend: { text: string; priority: 'high' | 'medium' | 'low' }[]) => {
    const mapped: Task[] = tasksToAppend.map((t, index) => ({
      id: `task-ai-${Date.now()}-${index}`,
      projectId,
      text: t.text,
      completed: false,
      assignedTo: "بانتظار التكليف",
      priority: t.priority,
      dueDate: new Date().toISOString().split('T')[0]
    }));

    saveTasksToStorage([...tasks, ...mapped]);
  };

  // 4. Bills/Expenses Level Callbacks
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      ...expenseData
    };
    saveExpensesToStorage([newExp, ...expenses]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    saveExpensesToStorage(updated);
  };

  // 5. Notice Board Level Callbacks
  const handleAddNotice = (noticeData: Omit<Notice, 'id' | 'date'>) => {
    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      ...noticeData,
      date: new Date().toISOString().split('T')[0]
    };
    saveNoticesToStorage([newNotice, ...notices]);
  };

  const handleDeleteNotice = (noticeId: string) => {
    const updated = notices.filter(n => n.id !== noticeId);
    saveNoticesToStorage(updated);
  };

  // 6. Family Members Callbacks
  const handleAddMember = (name: string) => {
    const updated = [...members, name];
    saveMembersToStorage(updated);
  };

  const handleRemoveMember = (name: string) => {
    const updated = members.filter(m => m !== name);
    saveMembersToStorage(updated);
  };

  const handleLoadSampleMembers = () => {
    saveMembersToStorage(INITIAL_MEMBERS);
  };

  // 6.5. House Development Plans Callbacks
  const handleAddPlan = (planData: Omit<DevelopmentPlan, 'id' | 'createdAt' | 'votes'>) => {
    const newPlan: DevelopmentPlan = {
      id: `plan-${Date.now()}`,
      ...planData,
      votes: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    saveDevPlansToStorage([newPlan, ...devPlans]);
  };

  const handleDeletePlan = (planId: string) => {
    const updated = devPlans.filter(p => p.id !== planId);
    saveDevPlansToStorage(updated);
  };

  const handleToggleVotePlan = (planId: string, memberName: string) => {
    const updated = devPlans.map(p => {
      if (p.id === planId) {
        const hasVoted = p.votes.includes(memberName);
        const nextVotes = hasVoted 
          ? p.votes.filter(m => m !== memberName) 
          : [...p.votes, memberName];
        return { ...p, votes: nextVotes };
      }
      return p;
    });
    saveDevPlansToStorage(updated);
  };

  const handleUpdatePlanStatus = (planId: string, status: 'studying' | 'approved' | 'deferred') => {
    const updated = devPlans.map(p => p.id === planId ? { ...p, status } : p);
    saveDevPlansToStorage(updated);
  };

  const handleUpdatePlanAIFeasibility = (planId: string, feasibility: DevelopmentPlan['aiFeasibility']) => {
    const updated = devPlans.map(p => p.id === planId ? { ...p, aiFeasibility: feasibility } : p);
    saveDevPlansToStorage(updated);
  };

  // Helper dashboard counts
  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length;
  const overallExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Active Expanded project
  const expandedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans text-natural-text">
      
      {/* LUXURIOUS NATURAL TONES TOP HEADER BANNER */}
      <header className="bg-white border-b border-natural-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          
          {/* Main Logo and Branding */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 bg-natural-moss rounded-full flex items-center justify-center text-white shadow-sm">
                  <Home size={18} />
                </span>
                <span className="text-[11px] bg-natural-moss-light text-natural-moss font-bold px-2.5 py-0.5 rounded-full border border-natural-border/60">
                  لوحة التحكم المشتركة للأسرة
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-natural-text tracking-tight mt-2 pb-0.5">
                بيت العائلة الكبير
              </h1>
              <p className="text-xs text-natural-muted max-w-xl leading-relaxed">
                مساحة تفاعلية دافئة وبسيطة لمتابعة أعمال الصيانة والتأثيث والمجلس العائلي والميزانية، مدعومة بمستشار ذكي منسق.
              </p>
            </div>

            {/* Quick dashboard metrics - Natural Tones themed & Data Operations */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 self-stretch md:self-auto">
              <div className="flex items-center gap-1 bg-natural-cream border border-natural-border p-2 rounded-2xl justify-around flex-1 sm:flex-initial">
                <div className="text-center px-3 sm:px-4 border-l border-natural-border">
                  <span className="text-[10px] text-natural-muted block font-semibold">المشاريع</span>
                  <span className="text-lg font-serif font-black text-natural-moss">{totalProjects}</span>
                </div>
                <div className="text-center px-3 sm:px-4 border-l border-natural-border">
                  <span className="text-[10px] text-natural-muted block font-semibold">قيد العمل</span>
                  <span className="text-lg font-serif font-black text-natural-bronze">{activeProjectsCount}</span>
                </div>
                <div className="text-center px-3 sm:px-4 border-l border-natural-border">
                  <span className="text-[10px] text-natural-muted block font-semibold">المكتملة</span>
                  <span className="text-lg font-serif font-black text-natural-moss">{completedProjectsCount}</span>
                </div>
                <div className="text-center px-3 sm:px-4">
                  <span className="text-[10px] text-natural-muted block font-semibold">المُنفق الكلي</span>
                  <span className="text-lg font-serif font-black text-natural-text">{overallExpenses.toLocaleString()} <span className="text-[10px] font-normal text-natural-muted">ر.س</span></span>
                </div>
              </div>

              <button
                onClick={() => { setExportProjectId(null); setShowExportModal(true); }}
                className="px-4 py-2.5 bg-natural-moss text-white hover:bg-natural-moss hover:opacity-90 font-bold rounded-2xl text-xs transition-all border border-transparent flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] cursor-pointer shrink-0"
                title="تصدير تقرير شامل بحالة مشاريع وفواتير البيت وصورة الإنجاز"
              >
                <Award size={14} className="text-amber-300 animate-pulse" />
                <span>تصدير تقرير البيت (صورة)</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-2xl text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                title="تصفير وحذف كافة المشاريع والبيانات والبدء من الصفر"
              >
                <Trash2 size={14} className="text-red-650" />
                <span>تصفير كافة المعلومات</span>
              </button>
            </div>
          </div>

          {/* Natural Tones Navigation Tabs */}
          <nav className="flex flex-wrap gap-2.5 pt-2 border-t border-natural-border/60">
            <button
              onClick={() => { setActiveTab('projects'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'projects'
                  ? 'bg-natural-moss text-white shadow-sm border border-natural-moss'
                  : 'text-natural-muted hover:text-natural-text hover:bg-natural-moss-light/50 border border-transparent'
              }`}
            >
              <FolderClosed size={15} />
              <span>مشاريع البيت</span>
            </button>

            <button
              onClick={() => { setActiveTab('expenses'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'expenses'
                  ? 'bg-natural-moss text-white shadow-sm border border-natural-moss'
                  : 'text-natural-muted hover:text-natural-text hover:bg-natural-moss-light/50 border border-transparent'
              }`}
            >
              <CreditCard size={15} />
              <span>المالية والفواتير</span>
            </button>

            <button
              onClick={() => { setActiveTab('notices'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'notices'
                  ? 'bg-natural-moss text-white shadow-sm border border-natural-moss'
                  : 'text-natural-muted hover:text-natural-text hover:bg-natural-moss-light/50 border border-transparent'
              }`}
            >
              <Megaphone size={15} />
              <span>لوحة ومقترحات مجلس العائلة</span>
            </button>

            <button
              onClick={() => { setActiveTab('members'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'members'
                  ? 'bg-natural-moss text-white shadow-sm border border-natural-moss'
                  : 'text-natural-muted hover:text-natural-text hover:bg-natural-moss-light/50 border border-transparent'
              }`}
            >
              <Users size={15} />
              <span>أفراد العائلة ({members.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('devPlans'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'devPlans'
                  ? 'bg-natural-moss text-white shadow-sm border border-natural-moss'
                  : 'text-natural-muted hover:text-natural-text hover:bg-natural-moss-light/50 border border-transparent'
              }`}
            >
              <Lightbulb size={15} />
              <span>خطط التطوير المستقبلية ({devPlans.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('ai'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'ai'
                  ? 'bg-natural-bronze text-white shadow-sm border border-natural-bronze'
                  : 'text-natural-bronze bg-natural-bronze-light/40 hover:bg-natural-bronze-light hover:text-natural-bronze border border-natural-bronze/20'
              }`}
            >
              <Sparkles size={15} className="animate-pulse" />
              <span>المستشار الذكي (AI)</span>
            </button>
          </nav>

        </div>
      </header>

      {/* DETAILED CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        {activeTab === 'projects' && (
          expandedProject ? (
            /* Expended Detail layout of single project */
            <ProjectDetails
              project={expandedProject}
              tasks={tasks}
              expenses={expenses}
              members={members}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleUpdateStatus}
              onUpdateProjectPhoto={handleUpdateProjectPhoto}
              onBack={() => setSelectedProjectId(null)}
              onExportCertificate={(id) => {
                setExportProjectId(id);
                setShowExportModal(true);
              }}
            />
          ) : (
            /* Default lists of projects */
            <ProjectList
              projects={projects}
              tasks={tasks}
              onSelectProject={(id) => setSelectedProjectId(id)}
              onEditProject={(p) => setEditingProject(p)}
              onDeleteProject={handleDeleteProject}
              onAddProjectClick={() => setIsCreatingProject(true)}
            />
          )
        )}

        {activeTab === 'expenses' && (
          <ExpensesChart
            projects={projects}
            expenses={expenses}
            members={members}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'notices' && (
          <NoticeBoard
            notices={notices}
            members={members}
            onAddNotice={handleAddNotice}
            onDeleteNotice={handleDeleteNotice}
          />
        )}

        {activeTab === 'members' && (
          <MembersManager
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onLoadSampleMembers={handleLoadSampleMembers}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistant
            projects={projects}
            onAddSuggestedTasks={handleAddSuggestedTasks}
          />
        )}

        {activeTab === 'devPlans' && (
          <DevelopmentPlans
            plans={devPlans}
            members={members}
            onAddPlan={handleAddPlan}
            onDeletePlan={handleDeletePlan}
            onToggleVote={handleToggleVotePlan}
            onUpdateStatus={handleUpdatePlanStatus}
            onUpdateAIFeasibility={handleUpdatePlanAIFeasibility}
          />
        )}
      </main>

      {/* FOOTER - Matching Design HTML Status Bar */}
      <footer className="px-6 py-4 sm:px-10 bg-natural-moss-light border-t border-natural-border flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-natural-muted gap-2 mt-auto">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <span>الموقع: الرياض، بيت العائلة الكبير</span>
          <span>•</span>
          <span>الحسابات عائلية مأمونة ومحفوظة محلياً</span>
        </div>
        <div className="flex gap-4">
          <span>شراكة، ودّ، وتعمير</span>
          <span>•</span>
          <span>آخر تحديث: الآن</span>
        </div>
      </footer>

      {/* PROJECT FORM MODAL (Add / Edit project) */}
      {(isCreatingProject || editingProject) && (
        <ProjectForm
          project={editingProject || undefined}
          onSave={handleSaveProject}
          members={members}
          onClose={() => {
            setIsCreatingProject(false);
            setEditingProject(null);
          }}
        />
      )}

      {/* REPORT EXPORTER MODAL Overlay */}
      {showExportModal && (
        <ReportExporter
          projects={projects}
          expenses={expenses}
          members={members}
          tasks={tasks}
          initialSelectedProjectId={exportProjectId}
          onClose={() => {
            setShowExportModal(false);
            setExportProjectId(null);
          }}
        />
      )}

      {/* 5. DATA RESET CONFIRMATION DIALOG MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-natural-text">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-natural-border">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-natural-border bg-red-50/40">
              <div className="flex items-center gap-2 text-red-750">
                <Trash2 size={18} className="text-red-600 animate-bounce" />
                <h3 className="text-base font-serif font-bold">تأكيد تصفير كافة المعلومات</h3>
              </div>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="p-1 px-2 text-natural-muted hover:text-natural-text rounded-lg hover:bg-natural-border/30 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-right" dir="rtl">
              <p className="text-xs text-natural-text leading-relaxed font-semibold">
                هل أنت متأكد من رغبتك في تصفير كافة معلومات لوحة بيت العائلة؟
              </p>
              <p className="text-xs text-natural-muted leading-relaxed">
                هذا الإجراء سيقوم بحذف وإفراغ جميع المشاريع الحالية، وجداول المهام، وفواتير الصرف العائلية، ومستجدات لوحة الإعلانات بالكامل.
              </p>
              <div className="p-3 bg-natural-cream border border-natural-border/60 rounded-xl space-y-1">
                <h4 className="text-[10px] font-bold text-natural-text uppercase tracking-wider">الخيارات المتوفرة لك:</h4>
                <ul className="text-[10px] text-natural-muted list-disc pr-4 space-y-1">
                  <li>البدء الفوري من الصفر كصفحة بيضاء جديدة بالكامل لتدوين بيتكم الحقيقي.</li>
                  <li>أو استعادة بيانات العينات الافتراضية للتجربة السريعة والتحليلات مجدداً.</li>
                </ul>
              </div>
            </div>

            {/* Footer Buttons selection */}
            <div className="p-4 border-t border-natural-border/60 bg-natural-cream flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5" dir="rtl">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-natural-muted bg-white border border-natural-border rounded-xl hover:bg-natural-cream transition-colors cursor-pointer text-center"
              >
                إلغاء التراجع
              </button>

              <button
                onClick={handleRestoreDefaults}
                className="px-4 py-2 text-xs font-bold text-natural-moss bg-natural-moss-light border border-natural-moss/20 hover:bg-natural-moss-light/80 rounded-xl transition-colors cursor-pointer text-center"
              >
                استعادة العينات التوضيحية
              </button>
              
              <button
                onClick={handleResetAllData}
                className="px-4 py-2 text-xs font-bold text-white bg-red-650 hover:bg-red-700 border border-transparent rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
              >
                <Trash2 size={13} />
                <span>تصفير ومسح كامل البيانات</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
