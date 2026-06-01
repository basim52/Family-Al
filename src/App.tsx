import { useState, useEffect } from 'react';
import { Project, Task, Expense, Notice, ProjectStatus, DevelopmentPlan, VaultTransaction } from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_EXPENSES, 
  INITIAL_NOTICES,
  INITIAL_MEMBERS,
  INITIAL_DEV_PLANS,
  INITIAL_VAULT_TRANSACTIONS
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
import VaultManager from './components/VaultManager';

// Theme icons
import { Home, FolderClosed, CreditCard, Sparkles, Megaphone, CheckCircle, Info, Menu, X, Users, Trash2, Award, Lightbulb, LogOut, Cloud, RefreshCw, Vault, Receipt } from 'lucide-react';

// Firebase core configuration imports
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const getMemberDocId = (name: string): string => {
  // Convert name to hex to satisfy ^[a-zA-Z0-9_\-]+$ format in firestore.rules
  return 'mem-' + Array.from(name)
    .map(c => c.charCodeAt(0).toString(16))
    .join('-');
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'projects' | 'expenses' | 'ai' | 'notices' | 'members' | 'devPlans' | 'vault'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Authentication & Cloud states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('is_guest_mode') === 'true';
  });

  // Core state synced with LocalStorage for durable local persistence or loaded from Firestore
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('family_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('family_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('family_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });
  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('family_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });
  const [members, setMembers] = useState<string[]>(() => {
    const saved = localStorage.getItem('family_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });
  const [devPlans, setDevPlans] = useState<DevelopmentPlan[]>(() => {
    const saved = localStorage.getItem('family_dev_plans');
    return saved ? JSON.parse(saved) : INITIAL_DEV_PLANS;
  });
  const [vaultTransactions, setVaultTransactions] = useState<VaultTransaction[]>(() => {
    const saved = localStorage.getItem('family_vault_transactions');
    return saved ? JSON.parse(saved) : INITIAL_VAULT_TRANSACTIONS;
  });

  // Modals state
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProjectId, setExportProjectId] = useState<string | null>(null);

  // Sync to localStorage on state changes (Only active in local fallback Guest mode)
  const saveProjectsToStorage = (updatedList: Project[]) => {
    setProjects(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_projects', JSON.stringify(updatedList));
    }
  };

  const saveTasksToStorage = (updatedList: Task[]) => {
    setTasks(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_tasks', JSON.stringify(updatedList));
    }
  };

  const saveExpensesToStorage = (updatedList: Expense[]) => {
    setExpenses(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_expenses', JSON.stringify(updatedList));
    }
  };

  const saveNoticesToStorage = (updatedList: Notice[]) => {
    setNotices(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_notices', JSON.stringify(updatedList));
    }
  };

  const saveMembersToStorage = (updatedList: string[]) => {
    setMembers(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_members', JSON.stringify(updatedList));
    }
  };

  const saveDevPlansToStorage = (updatedList: DevelopmentPlan[]) => {
    setDevPlans(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_dev_plans', JSON.stringify(updatedList));
    }
  };

  const saveVaultTransactionsToStorage = (updatedList: VaultTransaction[]) => {
    setVaultTransactions(updatedList);
    if (!isCloudMode) {
      localStorage.setItem('family_vault_transactions', JSON.stringify(updatedList));
    }
  };

  // Google Provider Authentication Trigger handlers
  const handleSignInGoogle = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Sign in error:", e);
      alert("تعذر تسجيل الدخول من Google الفوري. يرجى مراجعة إعدادات الهوية والمنبثقات.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsCloudMode(false);
      setIsGuestMode(false);
      localStorage.removeItem('is_guest_mode');
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const handleEnterAsGuest = () => {
    setIsGuestMode(true);
    setIsCloudMode(false);
    localStorage.setItem('is_guest_mode', 'true');
    // Force immediate local storage restore
    const savedProjects = localStorage.getItem('family_projects');
    const savedTasks = localStorage.getItem('family_tasks');
    const savedExpenses = localStorage.getItem('family_expenses');
    const savedNotices = localStorage.getItem('family_notices');
    const savedMembers = localStorage.getItem('family_members');
    const savedDevPlans = localStorage.getItem('family_dev_plans');
    const savedVaultTransactions = localStorage.getItem('family_vault_transactions');

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

    if (savedVaultTransactions) setVaultTransactions(JSON.parse(savedVaultTransactions));
    else setVaultTransactions(INITIAL_VAULT_TRANSACTIONS);

    if (savedMembers) setMembers(JSON.parse(savedMembers));
    else setMembers([]);
  };

  // 1. Firebase Authentication listener & Real-time setup
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsCloudMode(true);
        setIsGuestMode(false);
        localStorage.removeItem('is_guest_mode');

        // Subscribe to all Collections with real-time onSnapshot synchronization
        const unsubProjects = onSnapshot(collection(db, 'projects'), async (snapshot) => {
          if (snapshot.empty) {
            // Seeding the cloud Firestore databases on very first login so they have sample data instantly
            setIsBootstrapping(true);
            try {
              for (const p of INITIAL_PROJECTS) {
                await setDoc(doc(db, 'projects', p.id), p);
              }
              for (const t of INITIAL_TASKS) {
                await setDoc(doc(db, 'tasks', t.id), t);
              }
              for (const e of INITIAL_EXPENSES) {
                await setDoc(doc(db, 'expenses', e.id), e);
              }
              for (const n of INITIAL_NOTICES) {
                await setDoc(doc(db, 'notices', n.id), n);
              }
              for (const dp of INITIAL_DEV_PLANS) {
                await setDoc(doc(db, 'developmentPlans', dp.id), dp);
              }
              for (const m of INITIAL_MEMBERS) {
                const memberId = getMemberDocId(m);
                await setDoc(doc(db, 'members', memberId), { id: memberId, name: m });
              }
              for (const vt of INITIAL_VAULT_TRANSACTIONS) {
                await setDoc(doc(db, 'vaultTransactions', vt.id), vt);
              }
            } catch (seedError) {
              console.error("Bootloader seed failed:", seedError);
            } finally {
              setIsBootstrapping(false);
            }
          } else {
            const list: Project[] = [];
            snapshot.forEach(d => {
              list.push(d.data() as Project);
            });
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setProjects(list);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'projects');
        });

        const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
          const list: Task[] = [];
          snapshot.forEach(d => {
            list.push(d.data() as Task);
          });
          setTasks(list);
        });

        const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
          const list: Expense[] = [];
          snapshot.forEach(d => {
            list.push(d.data() as Expense);
          });
          list.sort((a, b) => b.date.localeCompare(a.date));
          setExpenses(list);
        });

        const unsubNotices = onSnapshot(collection(db, 'notices'), (snapshot) => {
          const list: Notice[] = [];
          snapshot.forEach(d => {
            list.push(d.data() as Notice);
          });
          list.sort((a, b) => b.date.localeCompare(a.date));
          setNotices(list);
        });

        const unsubDevPlans = onSnapshot(collection(db, 'developmentPlans'), (snapshot) => {
          const list: DevelopmentPlan[] = [];
          snapshot.forEach(d => {
            list.push(d.data() as DevelopmentPlan);
          });
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setDevPlans(list);
        });

        const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
          const list: string[] = [];
          snapshot.forEach(d => {
            const m = d.data();
            if (m && m.name) {
              list.push(m.name);
            }
          });
          setMembers(list);
        });

        const unsubVaultTransactions = onSnapshot(collection(db, 'vaultTransactions'), (snapshot) => {
          const list: VaultTransaction[] = [];
          snapshot.forEach(d => {
            list.push(d.data() as VaultTransaction);
          });
          list.sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
          setVaultTransactions(list);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'vaultTransactions');
        });

        setAuthLoading(false);

        // Store active listeners for total teardown
        return () => {
          unsubProjects();
          unsubTasks();
          unsubExpenses();
          unsubNotices();
          unsubDevPlans();
          unsubMembers();
          unsubVaultTransactions();
        };
      } else {
        // Unauthenticated state
        setUser(null);
        setIsCloudMode(false);
        setAuthLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Sync to local storage on offline/guest changes
  useEffect(() => {
    if (!isCloudMode && isGuestMode) {
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

      const savedVaultTransactions = localStorage.getItem('family_vault_transactions');
      if (savedVaultTransactions) setVaultTransactions(JSON.parse(savedVaultTransactions));
      else setVaultTransactions(INITIAL_VAULT_TRANSACTIONS);

      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        setMembers([]);
      }
    }
  }, [isCloudMode, isGuestMode]);

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
      if (!isCloudMode) {
        localStorage.setItem('family_projects', JSON.stringify(updatedProjects));
      }
    }
  }, [expenses, projects, isCloudMode]);

  // 2. Project Actions Callbacks with dual Cloud/Local modes
  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'spent'> & { id?: string }) => {
    if (isCloudMode) {
      const projId = projectData.id || `proj-${Date.now()}`;
      const existingProj = projects.find(p => p.id === projId);
      const dataToSave: Project = {
        id: projId,
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        status: projectData.status,
        priority: projectData.priority,
        leader: projectData.leader,
        budget: projectData.budget,
        spent: existingProj ? existingProj.spent : 0,
        dueDate: projectData.dueDate,
        createdAt: existingProj ? existingProj.createdAt : new Date().toISOString().split('T')[0],
        ...(projectData.photoUrl ? { photoUrl: projectData.photoUrl } : (existingProj?.photoUrl ? { photoUrl: existingProj.photoUrl } : {}))
      };
      try {
        await setDoc(doc(db, 'projects', projId), dataToSave);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${projId}`);
      }
    } else {
      if (projectData.id) {
        const updated = projects.map(p => p.id === projectData.id ? { ...p, ...projectData } : p);
        saveProjectsToStorage(updated);
      } else {
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
    }

    setIsCreatingProject(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع العائلي وجميع المهام والفواتير المرتبطة به؟')) {
      if (isCloudMode) {
        try {
          await deleteDoc(doc(db, 'projects', id));
          const relatedTasks = tasks.filter(t => t.projectId === id);
          for (const t of relatedTasks) {
            await deleteDoc(doc(db, 'tasks', t.id));
          }
          const relatedExpenses = expenses.filter(e => e.projectId === id);
          for (const e of relatedExpenses) {
            await deleteDoc(doc(db, 'expenses', e.id));
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `projects/${id}`);
        }
      } else {
        const remainingProjects = projects.filter(p => p.id !== id);
        const remainingTasks = tasks.filter(t => t.projectId !== id);
        const remainingExpenses = expenses.filter(e => e.projectId !== id);
        
        saveProjectsToStorage(remainingProjects);
        saveTasksToStorage(remainingTasks);
        saveExpensesToStorage(remainingExpenses);
      }
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: ProjectStatus) => {
    if (isCloudMode) {
      try {
        await updateDoc(doc(db, 'projects', projectId), { status: newStatus });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `projects/${projectId}`);
      }
    } else {
      const updated = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
      saveProjectsToStorage(updated);
    }
  };

  const handleUpdateProjectPhoto = async (projectId: string, photoUrl: string) => {
    if (isCloudMode) {
      try {
        await updateDoc(doc(db, 'projects', projectId), { photoUrl });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `projects/${projectId}`);
      }
    } else {
      const updated = projects.map(p => p.id === projectId ? { ...p, photoUrl } : p);
      saveProjectsToStorage(updated);
    }
  };

  // 3. Task Level Callbacks
  const handleToggleTask = async (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    if (isCloudMode) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), { completed: !target.completed });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `tasks/${taskId}`);
      }
    } else {
      const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      saveTasksToStorage(updated);
    }
  };

  const handleAddTask = async (projectId: string, text: string, assignedTo: string, priority: 'high' | 'medium' | 'low') => {
    const taskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      projectId,
      text,
      completed: false,
      assignedTo,
      priority,
      dueDate: new Date().toISOString().split('T')[0]
    };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tasks', taskId), newTask);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `tasks/${taskId}`);
      }
    } else {
      saveTasksToStorage([...tasks, newTask]);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `tasks/${taskId}`);
      }
    } else {
      const updated = tasks.filter(t => t.id !== taskId);
      saveTasksToStorage(updated);
    }
  };

  // Callback to import generated tasks directly into project tasks
  const handleAddSuggestedTasks = async (projectId: string, tasksToAppend: { text: string; priority: 'high' | 'medium' | 'low' }[]) => {
    if (isCloudMode) {
      try {
        for (let idx = 0; idx < tasksToAppend.length; idx++) {
          const t = tasksToAppend[idx];
          const tId = `task-ai-${Date.now()}-${idx}`;
          await setDoc(doc(db, 'tasks', tId), {
            id: tId,
            projectId,
            text: t.text,
            completed: false,
            assignedTo: "بانتظار التكليف",
            priority: t.priority,
            dueDate: new Date().toISOString().split('T')[0]
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'tasks');
      }
    } else {
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
    }
  };

  // 4. Bills/Expenses Level Callbacks
  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const expId = `exp-${Date.now()}`;
    const newExp: Expense = {
      id: expId,
      ...expenseData
    };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'expenses', expId), newExp);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `expenses/${expId}`);
      }
    } else {
      saveExpensesToStorage([newExp, ...expenses]);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'expenses', expenseId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `expenses/${expenseId}`);
      }
    } else {
      const updated = expenses.filter(e => e.id !== expenseId);
      saveExpensesToStorage(updated);
    }
  };

  // 5. Notice Board Level Callbacks
  const handleAddNotice = async (noticeData: Omit<Notice, 'id' | 'date'>) => {
    const noticeId = `notice-${Date.now()}`;
    const newNotice: Notice = {
      id: noticeId,
      ...noticeData,
      date: new Date().toISOString().split('T')[0]
    };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'notices', noticeId), newNotice);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `notices/${noticeId}`);
      }
    } else {
      saveNoticesToStorage([newNotice, ...notices]);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'notices', noticeId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `notices/${noticeId}`);
      }
    } else {
      const updated = notices.filter(n => n.id !== noticeId);
      saveNoticesToStorage(updated);
    }
  };

  // 6. Family Members Callbacks
  const handleAddMember = async (name: string) => {
    if (isCloudMode) {
      const memberId = getMemberDocId(name);
      try {
        await setDoc(doc(db, 'members', memberId), { id: memberId, name });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `members/${memberId}`);
      }
    } else {
      saveMembersToStorage([...members, name]);
    }
  };

  const handleRemoveMember = async (name: string) => {
    if (isCloudMode) {
      const memberId = getMemberDocId(name);
      try {
        await deleteDoc(doc(db, 'members', memberId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `members/${memberId}`);
      }
    } else {
      const updated = members.filter(m => m !== name);
      saveMembersToStorage(updated);
    }
  };

  const handleLoadSampleMembers = async () => {
    if (isCloudMode) {
      try {
        for (const m of INITIAL_MEMBERS) {
          const mId = getMemberDocId(m);
          await setDoc(doc(db, 'members', mId), { id: mId, name: m });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'members');
      }
    } else {
      saveMembersToStorage(INITIAL_MEMBERS);
    }
  };

  // 6.5. House Development Plans Callbacks
  const handleAddPlan = async (planData: Omit<DevelopmentPlan, 'id' | 'createdAt' | 'votes'>) => {
    const planId = `plan-${Date.now()}`;
    const newPlan: DevelopmentPlan = {
      id: planId,
      ...planData,
      votes: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'developmentPlans', planId), newPlan);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `developmentPlans/${planId}`);
      }
    } else {
      saveDevPlansToStorage([newPlan, ...devPlans]);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'developmentPlans', planId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `developmentPlans/${planId}`);
      }
    } else {
      const updated = devPlans.filter(p => p.id !== planId);
      saveDevPlansToStorage(updated);
    }
  };

  const handleToggleVotePlan = async (planId: string, memberName: string) => {
    const plan = devPlans.find(p => p.id === planId);
    if (!plan) return;
    const hasVoted = plan.votes.includes(memberName);
    const nextVotes = hasVoted 
      ? plan.votes.filter(m => m !== memberName) 
      : [...plan.votes, memberName];

    if (isCloudMode) {
      try {
        await updateDoc(doc(db, 'developmentPlans', planId), { votes: nextVotes });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `developmentPlans/${planId}`);
      }
    } else {
      const updated = devPlans.map(p => p.id === planId ? { ...p, votes: nextVotes } : p);
      saveDevPlansToStorage(updated);
    }
  };

  const handleUpdatePlanStatus = async (planId: string, status: 'studying' | 'approved' | 'deferred') => {
    if (isCloudMode) {
      try {
        await updateDoc(doc(db, 'developmentPlans', planId), { status });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `developmentPlans/${planId}`);
      }
    } else {
      const updated = devPlans.map(p => p.id === planId ? { ...p, status } : p);
      saveDevPlansToStorage(updated);
    }
  };

  const handleUpdatePlanFeasibility = async (planId: string, feasibility: DevelopmentPlan['feasibility']) => {
    if (isCloudMode) {
      try {
        await updateDoc(doc(db, 'developmentPlans', planId), { feasibility: feasibility });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `developmentPlans/${planId}`);
      }
    } else {
      const updated = devPlans.map(p => p.id === planId ? { ...p, feasibility: feasibility } : p);
      saveDevPlansToStorage(updated);
    }
  };

  // 6.6. Vault / Family Bank Callbacks
  const handleAddVaultTransaction = async (txData: Omit<VaultTransaction, 'id' | 'voucherNumber'>) => {
    const txId = `vtx-${Date.now()}`;
    const maxVoucherSeq = vaultTransactions.reduce((acc, vt) => {
      const match = vt.voucherNumber.match(/V-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > acc ? num : acc;
      }
      return acc;
    }, 1000);
    const voucherNumber = `V-${maxVoucherSeq + 1}`;

    const newTx: VaultTransaction = {
      id: txId,
      voucherNumber,
      type: txData.type,
      amount: txData.amount,
      member: txData.member,
      description: txData.description,
      date: txData.date,
    };

    if (txData.projectId) {
      newTx.projectId = txData.projectId;
    }

    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'vaultTransactions', txId), newTx);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `vaultTransactions/${txId}`);
      }
    } else {
      saveVaultTransactionsToStorage([newTx, ...vaultTransactions]);
    }
  };

  const handleDeleteVaultTransaction = async (txId: string) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'vaultTransactions', txId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `vaultTransactions/${txId}`);
      }
    } else {
      const updated = vaultTransactions.filter(vt => vt.id !== txId);
      saveVaultTransactionsToStorage(updated);
    }
  };

  // 7. Data Management & Resets Callbacks
  const handleResetAllData = async () => {
    if (isCloudMode) {
      try {
        setIsBootstrapping(true);
        // Delete all projects
        for (const p of projects) {
          await deleteDoc(doc(db, 'projects', p.id));
        }
        // Delete all tasks
        for (const t of tasks) {
          await deleteDoc(doc(db, 'tasks', t.id));
        }
        // Delete all expenses
        for (const e of expenses) {
          await deleteDoc(doc(db, 'expenses', e.id));
        }
        // Delete all notices
        for (const n of notices) {
          await deleteDoc(doc(db, 'notices', n.id));
        }
        // Delete all dev plans
        for (const dp of devPlans) {
          await deleteDoc(doc(db, 'developmentPlans', dp.id));
        }
        // Delete all members
        for (const m of members) {
          const memberId = getMemberDocId(m);
          await deleteDoc(doc(db, 'members', memberId));
        }
        // Delete all vault transactions
        for (const vt of vaultTransactions) {
          await deleteDoc(doc(db, 'vaultTransactions', vt.id));
        }
        
        setProjects([]);
        setTasks([]);
        setExpenses([]);
        setNotices([]);
        setDevPlans([]);
        setMembers([]);
        setVaultTransactions([]);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'all_collections');
      } finally {
        setIsBootstrapping(false);
      }
    } else {
      localStorage.removeItem('family_projects');
      localStorage.removeItem('family_tasks');
      localStorage.removeItem('family_expenses');
      localStorage.removeItem('family_notices');
      localStorage.removeItem('family_members');
      localStorage.removeItem('family_dev_plans');
      localStorage.removeItem('family_vault_transactions');
      
      setProjects([]);
      setTasks([]);
      setExpenses([]);
      setNotices([]);
      setDevPlans([]);
      setMembers([]);
      setVaultTransactions([]);
    }
    setShowResetConfirm(false);
    setSelectedProjectId(null);
  };

  const handleRestoreDefaults = async () => {
    if (isCloudMode) {
      setIsBootstrapping(true);
      try {
        // First delete everything to avoid duplicate key issues
        for (const p of projects) {
          await deleteDoc(doc(db, 'projects', p.id));
        }
        for (const t of tasks) {
          await deleteDoc(doc(db, 'tasks', t.id));
        }
        for (const e of expenses) {
          await deleteDoc(doc(db, 'expenses', e.id));
        }
        for (const n of notices) {
          await deleteDoc(doc(db, 'notices', n.id));
        }
        for (const dp of devPlans) {
          await deleteDoc(doc(db, 'developmentPlans', dp.id));
        }
        for (const m of members) {
          const memberId = getMemberDocId(m);
          await deleteDoc(doc(db, 'members', memberId));
        }
        for (const vt of vaultTransactions) {
          await deleteDoc(doc(db, 'vaultTransactions', vt.id));
        }

        // Then re-seed everything
        for (const p of INITIAL_PROJECTS) {
          await setDoc(doc(db, 'projects', p.id), p);
        }
        for (const t of INITIAL_TASKS) {
          await setDoc(doc(db, 'tasks', t.id), t);
        }
        for (const e of INITIAL_EXPENSES) {
          await setDoc(doc(db, 'expenses', e.id), e);
        }
        for (const n of INITIAL_NOTICES) {
          await setDoc(doc(db, 'notices', n.id), n);
        }
        for (const dp of INITIAL_DEV_PLANS) {
          await setDoc(doc(db, 'developmentPlans', dp.id), dp);
        }
        for (const m of INITIAL_MEMBERS) {
          const memberId = getMemberDocId(m);
          await setDoc(doc(db, 'members', memberId), { id: memberId, name: m });
        }
        for (const vt of INITIAL_VAULT_TRANSACTIONS) {
          await setDoc(doc(db, 'vaultTransactions', vt.id), vt);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'restore_sample_data');
      } finally {
        setIsBootstrapping(false);
      }
    } else {
      localStorage.setItem('family_projects', JSON.stringify(INITIAL_PROJECTS));
      localStorage.setItem('family_tasks', JSON.stringify(INITIAL_TASKS));
      localStorage.setItem('family_expenses', JSON.stringify(INITIAL_EXPENSES));
      localStorage.setItem('family_notices', JSON.stringify(INITIAL_NOTICES));
      localStorage.setItem('family_members', JSON.stringify(INITIAL_MEMBERS));
      localStorage.setItem('family_dev_plans', JSON.stringify(INITIAL_DEV_PLANS));
      localStorage.setItem('family_vault_transactions', JSON.stringify(INITIAL_VAULT_TRANSACTIONS));

      setProjects(INITIAL_PROJECTS);
      setTasks(INITIAL_TASKS);
      setExpenses(INITIAL_EXPENSES);
      setNotices(INITIAL_NOTICES);
      setDevPlans(INITIAL_DEV_PLANS);
      setMembers(INITIAL_MEMBERS);
      setVaultTransactions(INITIAL_VAULT_TRANSACTIONS);
    }
    setShowResetConfirm(false);
    setSelectedProjectId(null);
  };

  // Helper dashboard counts
  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length;
  const overallExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Active Expanded project
  const expandedProject = projects.find(p => p.id === selectedProjectId);

  // High-fidelity security loading view
  if (authLoading) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center p-4 text-natural-text" dir="rtl">
        <div className="text-center space-y-4">
          <RefreshCw className="mx-auto text-natural-moss animate-spin" size={32} />
          <p className="text-xs font-bold tracking-wide text-natural-muted">جاري التحقق من أمن وتزامن الملفات السحابية كعائلة واحدة...</p>
        </div>
      </div>
    );
  }

  // Seeding/Bootstrapping database helper load page
  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center p-4 text-natural-text" dir="rtl">
        <div className="text-center space-y-4">
          <RefreshCw className="mx-auto text-natural-moss animate-spin" size={32} />
          <p className="text-sm font-bold text-natural-text">جاري إقلاع وبناء خوادم السحابة العائلية وقاعدة البيانات لأول مرة...</p>
          <p className="text-xs text-natural-muted">يرجى الانتظار، يتم تصنيف وترتيب نماذج الصيانة والإعلانات الآن.</p>
        </div>
      </div>
    );
  }

  // Welcome Gate authentication wall
  if (!user && !isGuestMode) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center p-4 text-natural-text" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-3xl border border-natural-border p-8 shadow-md text-center space-y-6">
          <div className="space-y-3">
            <span className="w-16 h-16 bg-natural-moss/10 text-natural-moss rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Home size={32} className="text-natural-moss stroke-[1.5]" />
            </span>
            <div className="inline-flex items-center gap-1.5 bg-natural-cream text-natural-moss text-[10px] font-bold px-3 py-1 rounded-full border border-natural-border/60">
              <Cloud size={12} className="text-natural-moss" />
              <span>البوابة المشتركة المأمونة للأسرة</span>
            </div>
            <h1 className="text-2xl font-serif font-black text-natural-text tracking-tight">
              بيت العائلة الكبير
            </h1>
            <p className="text-xs text-natural-muted leading-relaxed max-w-sm mx-auto">
              مرحبًا بك في لوحة التعمير السحابية المشتركة. تفضل بتسجيل الدخول الآمن لتنسيق مهام الصيانة، فواتير الصرف، ومقترحات مجلس العائلة بشكل متزامن وبسيط.
            </p>
          </div>

          <div className="border-t border-natural-border/50 pt-6 space-y-3">
            <button
              onClick={handleSignInGoogle}
              className="w-full py-3 px-4 bg-white border border-natural-border hover:bg-natural-cream text-natural-text font-bold text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.77-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.54-5.17 3.54-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.86-3c-1.08.72-2.45 1.16-4.1 1.16-3.15 0-5.81-2.13-6.76-4.99H1.17v3.1A11.996 11.996 0 0012 24z" />
                <path fill="#FBBC05" d="M5.24 14.26a7.22 7.22 0 010-4.52V6.64H1.17a11.996 11.996 0 000 10.72l4.07-3.1z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.3 2.67 1.17 6.64l4.07 3.1c.95-2.86 3.61-4.99 6.76-4.99z" />
              </svg>
              <span>تسجيل الدخول باستخدام حساب Google</span>
            </button>

            <button
              onClick={handleEnterAsGuest}
              className="w-full py-2.5 px-4 bg-natural-cream/70 hover:bg-natural-cream text-natural-moss font-bold text-xs rounded-2xl flex items-center justify-center gap-1 border border-natural-border/30 transition-all cursor-pointer"
            >
              <span>الاستمرار كزائر (لوحة محليّة للتجربة)</span>
            </button>
          </div>

          <div className="text-[9px] uppercase tracking-widest text-natural-muted pt-3 border-t border-natural-cream">
            بيت العائلة الكبير • شراكة، ودّ، وتعمير
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans text-natural-text">
      
      {/* LUXURIOUS NATURAL TONES TOP HEADER BANNER */}
      <header className="bg-white border-b border-natural-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          
          {/* Main Logo, Branding and Google Profile Info block */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 bg-natural-moss rounded-full flex items-center justify-center text-white shadow-sm">
                  <Home size={18} />
                </span>
                <span className="text-[11px] bg-natural-moss-light text-natural-moss font-bold px-2.5 py-0.5 rounded-full border border-natural-border/60 flex items-center gap-1">
                  {isCloudMode ? <Cloud size={11} className="text-natural-moss" /> : null}
                  <span>{isCloudMode ? "السحابة العائلية متصلة وفورية" : "الوضع التجريبي محلي زائر"}</span>
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
              {/* Google profile context badge */}
              {user && (
                <div className="flex items-center gap-2.5 bg-natural-cream/50 border border-natural-border p-2.5 rounded-2xl justify-end">
                  <div className="text-right">
                    <span className="text-xs font-bold text-natural-text block">{user.displayName}</span>
                    <span className="text-[9px] text-natural-muted block leading-none">{user.email}</span>
                  </div>
                  <img 
                    src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                    alt={user.displayName || "Family user"}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-natural-border shadow-xs shrink-0"
                  />
                  <button 
                    onClick={handleSignOut}
                    className="p-2 bg-white hover:bg-red-50 hover:text-red-700 text-natural-muted rounded-xl border border-natural-border/60 transition-all cursor-pointer shadow-xs mr-1"
                    title="تسجيل الخروج والعودة للبوابة"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              )}
              
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
              onClick={() => { setActiveTab('vault'); setSelectedProjectId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'vault'
                  ? 'bg-natural-moss text-white shadow-sm border border-natural-moss'
                  : 'text-natural-muted hover:text-natural-text hover:bg-natural-moss-light/50 border border-transparent'
              }`}
            >
              <Vault size={15} />
              <span>البنك والخزانة العائلية</span>
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

        {activeTab === 'vault' && (
          <VaultManager
            transactions={vaultTransactions}
            members={members}
            projects={projects}
            onAddTransaction={handleAddVaultTransaction}
            onDeleteTransaction={handleDeleteVaultTransaction}
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
            onUpdateFeasibility={handleUpdatePlanFeasibility}
          />
        )}
      </main>

      {/* FOOTER - Matching Design HTML Status Bar */}
      <footer className="px-6 py-4 sm:px-10 bg-natural-moss-light border-t border-natural-border flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-natural-muted gap-2 mt-auto">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <span>برمجة وفكرة: باسم آل خليل</span>
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
