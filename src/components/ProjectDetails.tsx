import React, { useState, useEffect } from 'react';
import { Project, Task, Expense } from '../types';
import { ArrowRight, Plus, CheckSquare, Trash2, Calendar, User, ShoppingBag, Receipt, AlertTriangle, Play, Sparkles, Camera, Upload, X, Image, Award } from 'lucide-react';

interface ProjectDetailsProps {
  project: Project;
  tasks: Task[];
  expenses: Expense[];
  members: string[];
  onToggleTask: (id: string) => void;
  onAddTask: (projectId: string, text: string, assignedTo: string, priority: 'high' | 'medium' | 'low') => void;
  onDeleteTask: (id: string) => void;
  onUpdateStatus: (projectId: string, status: 'planning' | 'active' | 'on_hold' | 'completed') => void;
  onUpdateProjectPhoto: (projectId: string, photoUrl: string) => void;
  onBack: () => void;
  onExportCertificate?: (id: string) => void;
}

export default function ProjectDetails({
  project,
  tasks,
  expenses,
  members,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateStatus,
  onUpdateProjectPhoto,
  onBack,
  onExportCertificate,
}: ProjectDetailsProps) {
  const [taskText, setTaskText] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [errorTask, setErrorTask] = useState('');

  // Settle default taskAssignee when members are available
  useEffect(() => {
    if (members?.length > 0 && !taskAssignee) {
      setTaskAssignee(members[2] || members[0]);
    }
  }, [members, taskAssignee]);

  // Camera capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [isWebRtcActive, setIsWebRtcActive] = useState(false);

  const startCamera = async () => {
    setCameraError('');
    setIsWebRtcActive(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفح الويب لا يدعم ميزة تشغيل الكاميرا الحية تفاعلياً.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setCameraStream(stream);
      setIsWebRtcActive(true);
    } catch (err: any) {
      console.error(err);
      setCameraError('فشل تشغيل تدفق الكاميرا المباشر. قد يكون بسبب حظر صلاحية استخدام الكاميرا أو عدم توفر كاميرا متصلة بالجهاز. يمكنك تحميل صورة أو اختيار عينة سريعة.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsWebRtcActive(false);
  };

  const handleCloseCameraModal = () => {
    stopCamera();
    setIsCapturing(false);
    setCameraError('');
  };

  const handleCaptureSnapshot = () => {
    const video = document.getElementById('camera-video-preview') as HTMLVideoElement;
    if (video) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateProjectPhoto(project.id, dataUrl);
          handleCloseCameraModal();
        }
      } catch (err) {
        setCameraError('فشل في التقاط الصورة من تدفق الفيديو. يرجى تجربة تحميل صورة بديلة.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateProjectPhoto(project.id, reader.result);
          handleCloseCameraModal();
        }
      };
      reader.onerror = () => {
        setCameraError('فشل في قراءة ملف الصورة المحدد.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSamplePhoto = (url: string) => {
    onUpdateProjectPhoto(project.id, url);
    handleCloseCameraModal();
  };

  const handleRemovePhoto = () => {
    if (confirm('هل أنت متأكد من حذف صورة التقدم الحالية للمشروع؟')) {
      onUpdateProjectPhoto(project.id, '');
    }
  };

  const samplePhotos = [
    { label: 'الحديقة والتشجير', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600' },
    { label: 'أدوات الصيانة والمعدات', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=600' },
    { label: 'أعمال الدهانات والديكور', url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600' },
    { label: 'تحضير المجالس والفرش', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600' },
    { label: 'الكهرباء والإنارة', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600' },
    { label: 'اللقاءات وتجهيز الطعام', url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=600' },
  ];

  // Calculations
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  
  const totalSpent = projectExpenses.reduce((acc, e) => acc + e.amount, 0);
  const completedTasks = projectTasks.filter(t => t.completed).length;
  const totalTasks = projectTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 105) > 100 ? 100 : Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) {
      setErrorTask('الرجاء كتابة وصف المهمة العائلية.');
      return;
    }

    onAddTask(project.id, taskText.trim(), taskAssignee, taskPriority);
    setTaskText('');
    setTaskPriority('medium');
    setErrorTask('');
  };

  const getPriorityBadgeStyle = (prio: string) => {
    switch (prio) {
      case 'high':
        return 'bg-natural-bronze-light text-natural-bronze font-bold border-natural-bronze/25';
      case 'medium':
        return 'bg-natural-moss-light text-natural-moss font-bold border-natural-moss/20';
      case 'low':
      default:
        return 'bg-natural-cream text-natural-muted font-bold border-natural-border';
    }
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case 'planning': return 'قيد التخطيط والمراجعة';
      case 'active': return 'نشط - جاري العمل الأسري';
      case 'on_hold': return 'معلق ومؤجل موقتًا';
      case 'completed': return 'مكتمل بنجاح تام ✓';
      default: return 'صيانة عامة';
    }
  };

  return (
    <div className="space-y-6 text-natural-text">
      
      {/* 1. Details Toolbar Back */}
      <div className="flex items-center justify-between border-b border-natural-border pb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-natural-moss-light text-natural-moss hover:bg-natural-moss-light/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-natural-border/40"
        >
          <ArrowRight size={16} />
          <span>العودة لكل مشاريع البيت</span>
        </button>

        {/* Change Status Fast Inline */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-natural-muted">حالة الفهرسة:</span>
          <select
            value={project.status}
            onChange={(e) => onUpdateStatus(project.id, e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-natural-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss"
          >
            <option value="planning">تخطيط</option>
            <option value="active">تنفيذ</option>
            <option value="on_hold">تعليق</option>
            <option value="completed">مكتمل</option>
          </select>
        </div>
      </div>

      {/* 2. Top Info Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Description Brief */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-natural-stone-light pb-2">
            <h1 className="text-xl font-serif font-black text-natural-text leading-snug">{project.title}</h1>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeStyle(project.priority)}`}>
              أولوية: {project.priority === 'high' ? 'عالية' : project.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
            </span>
          </div>
          
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-natural-muted">وصف وأهداف المشروع:</span>
            <p className="text-xs text-natural-text leading-relaxed whitespace-pre-line">{project.description}</p>
          </div>

          {project.status === 'completed' && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 font-serif">تم إنجاز هذا المشروع عائلياً بنجاح!</h4>
                  <p className="text-[10px] text-amber-800 leading-relaxed">بأيدي أبناء العائلة الكرام وجهودهم المتكاملة والمباركة.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onExportCertificate && onExportCertificate(project.id)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer scale-100 hover:scale-[1.03] active:scale-95 text-center justify-center shrink-0"
              >
                <Sparkles size={13} className="text-amber-200" />
                <span>تحميل وثيقة الشكر والتقدير (صورة)</span>
              </button>
            </div>
          )}

          {/* Project progress photo display and capture section */}
          {project.photoUrl ? (
            <div className="relative group border border-natural-border/65 rounded-xl overflow-hidden mt-3 h-48 sm:h-64 bg-natural-cream shadow-sm">
              <img 
                src={project.photoUrl} 
                alt={`توثيق مشروع: ${project.title}`} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform group-hover:scale-[1.01] duration-350"
              />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                <button
                  onClick={() => { setIsCapturing(true); startCamera(); }}
                  className="px-3.5 py-1.5 bg-white hover:bg-natural-cream text-natural-text rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Camera size={14} className="text-natural-moss" />
                  <span>تحديث صورة العمل</span>
                </button>
                <button
                  onClick={handleRemovePhoto}
                  className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white border border-transparent rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>حذف الصورة</span>
                </button>
              </div>
              <div className="absolute right-3.5 bottom-3.5 bg-black/65 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider backdrop-blur-sm pointer-events-none">
                صورة توثيق التقدم الحالية
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-natural-border/70 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-natural-cream/35 mt-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-natural-moss-light text-natural-moss rounded-full border border-natural-moss/10 shrink-0">
                  <Camera size={18} />
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-natural-text">توثيق صورة تقدم وتعمير بيت العائلة</h4>
                  <p className="text-[10px] text-natural-muted leading-relaxed mt-0.5">التقط صورة حية فوراً لتبين حالة صيانة المجلس أو المنزل لبقية أتباع المشروع وعائلتنا.</p>
                </div>
              </div>
              <button
                onClick={() => { setIsCapturing(true); startCamera(); }}
                className="px-3.5 py-2 bg-natural-moss hover:bg-natural-moss-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer self-stretch sm:self-auto shrink-0"
              >
                <Camera size={14} />
                <span>التقاط صورة المنجز</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-[11px]">
            <div className="flex items-center gap-2.5 bg-natural-cream p-2.5 rounded-xl border border-natural-border/60">
              <span className="p-1 text-white bg-natural-moss rounded-lg">
                <User size={14} className="shrink-0" />
              </span>
              <div>
                <span className="text-natural-muted block font-bold text-[10px]">منسق المشروع</span>
                <span className="text-natural-text font-bold">{project.leader}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-natural-cream p-2.5 rounded-xl border border-natural-border/60">
              <span className="p-1 text-white bg-natural-moss rounded-lg">
                <Calendar size={14} className="shrink-0" />
              </span>
              <div>
                <span className="text-natural-muted block font-bold text-[10px]">تاريخ التسليم</span>
                <span className="text-natural-text font-bold">{project.dueDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-natural-cream p-2.5 rounded-xl border border-natural-border/60">
              <span className="p-1 text-white bg-natural-moss rounded-lg">
                <Play size={14} className="shrink-0" />
              </span>
              <div>
                <span className="text-natural-muted block font-bold text-[10px]">الحالة الفعالة</span>
                <span className="text-natural-text font-bold">{getStatusLabelText(project.status)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Metrics Mini Box */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-natural-muted pb-2 border-b border-natural-cream uppercase tracking-wider">تفاصيل الحساب المالي للمشروع</h3>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-natural-muted">ميزانية الصرف الفرضية:</span>
              <span className="font-bold text-natural-text">{project.budget.toLocaleString()} ريال</span>
            </div>

            <div className="flex justify-between">
              <span className="text-natural-muted">المصروف الفعلي المدفوع:</span>
              <span className="font-bold text-natural-text">{totalSpent.toLocaleString()} ريال</span>
            </div>

            {/* Over-budget alert indicator */}
            <div className="pt-2 border-t border-natural-cream flex items-center justify-between text-xs">
              <span className="text-natural-muted">رصيد الميزانية المتبقي:</span>
              <span className={`font-bold ${project.budget - totalSpent >= 0 ? 'text-natural-moss' : 'text-natural-bronze'}`}>
                {(project.budget - totalSpent).toLocaleString()} ريال
              </span>
            </div>

            {totalSpent > project.budget && (
              <div className="p-2 bg-natural-bronze-light text-natural-bronze text-[10px] font-semibold flex items-center gap-1.5 border border-natural-bronze/20 rounded-lg">
                <AlertTriangle size={12} className="shrink-0 animate-pulse" />
                <span>تحذير: لقد تجاوزت نفقات المشروع الميزانية المرصودة!</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-natural-muted">النسبة المئوية المنفذة للتمويل:</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-natural-cream h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${totalSpent > project.budget ? 'bg-natural-bronze' : 'bg-natural-moss'}`}
                  style={{ width: `${Math.min(100, Math.round((totalSpent / project.budget) * 100))}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-natural-text">
                {project.budget > 0 ? `${Math.round((totalSpent / project.budget) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Task List & Create Inline Component */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task list Column */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-sm font-serif font-bold text-natural-text">جدول مهام مشروع بيت العائلة</h3>
            <p className="text-xs text-natural-muted mt-0.5">المهام التعاونية المسجلة. قم بتظليل المهام المكتملة لدعم التقدم العام:</p>
          </div>

          {/* Form to insert quick tasks inline */}
          <form onSubmit={handleAddTaskSubmit} className="space-y-3.5 bg-natural-cream/50 p-4 rounded-xl border border-natural-border/60">
            {errorTask && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs leading-none font-semibold">
                {errorTask}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="تفاصيل تدوين المهمة (مثال: سكب العازل الحراري، شراء البخور، إلخ)..."
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-natural-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
              />

              {/* Selector for responsible member */}
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-natural-border rounded-xl text-xs font-semibold focus:outline-none text-natural-text shrink-0"
              >
                {members.length > 0 ? (
                  members.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                ) : (
                  <option value="غير محدد">غير محدد (أضف أفراد العائلة أولاً)</option>
                )}
              </select>

              {/* Priority select */}
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-natural-border rounded-xl text-xs font-semibold focus:outline-none text-natural-text shrink-0"
              >
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-natural-moss hover:bg-natural-moss-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shrink-0 shadow-sm"
              >
                <Plus size={14} />
                <span>أضف</span>
              </button>
            </div>
          </form>

          {/* Actual items */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {projectTasks.map((t) => (
              <div 
                key={t.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                  t.completed 
                    ? 'bg-natural-cream/30 border-natural-border text-natural-muted' 
                    : 'bg-white border-natural-border hover:border-natural-stone text-natural-text shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => onToggleTask(t.id)}
                    className="w-4 h-4 text-natural-moss border-natural-border focus:ring-natural-moss focus:outline-none mt-0.5 rounded cursor-pointer"
                  />
                  <div>
                    <span className={`font-semibold ${t.completed ? 'line-through text-natural-muted/70' : 'text-natural-text'}`}>
                      {t.text}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-natural-text font-bold bg-natural-cream px-1.5 py-0.5 rounded border border-natural-border/40">
                        المسؤول: {t.assignedTo}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded border ${
                        t.priority === 'high' ? 'bg-natural-bronze-light text-natural-bronze border-natural-bronze/10' : t.priority === 'medium' ? 'bg-natural-moss-light text-natural-moss border-natural-moss/10' : 'bg-natural-cream text-natural-muted border-natural-border/20'
                      }`}>
                        {t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTask(t.id)}
                  className="p-1.5 text-natural-muted hover:text-red-500 hover:bg-natural-cream rounded-lg transition-colors"
                  title="حذف المهمة"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {projectTasks.length === 0 && (
              <div className="py-12 text-center text-natural-muted font-semibold border border-dashed border-natural-border rounded-xl bg-natural-cream/20">
                لا توجد مهام مسجلة لهذا المشروع حالياً. 
                <div className="mt-1.5 text-[11px] text-natural-muted text-center flex items-center justify-center gap-1.5">
                  <Sparkles size={11} className="text-natural-bronze" />
                  اذهب لتبويب المستشار لتوليد المهام بالذكاء الاصطناعي بنقرة واحدة!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expenses List Column for ONLY this project */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-natural-text">سجل فواتير المشروع</h3>
            <p className="text-xs text-natural-muted mt-0.5">تفاصيل المشتريات والمصروفات الخاصة بهذا المشروع:</p>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
            {projectExpenses.map((exp) => (
              <div key={exp.id} className="p-3 bg-natural-cream/40 rounded-xl border border-natural-border/60 flex items-start gap-2 text-xs justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-natural-text leading-tight">{exp.description}</p>
                  <div className="text-[10px] text-natural-muted flex items-center gap-1">
                    <span>دفعها: <span className="font-semibold text-natural-text">{exp.paidBy}</span></span>
                    <span>•</span>
                    <span>{exp.date}</span>
                  </div>
                </div>
                
                <span className="font-mono font-bold text-natural-text shrink-0 text-right">
                  {exp.amount} ر.س
                </span>
              </div>
            ))}

            {projectExpenses.length === 0 && (
              <div className="py-12 text-center text-natural-muted font-semibold bg-natural-cream/20 rounded-xl border border-dashed border-natural-border">
                لا توجد فواتير مصروفات مسجلة له حصرياً.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. CAMERA PHOTO CAPTURE MODAL OVERLAY */}
      {isCapturing && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl border border-natural-border flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4.5 border-b border-natural-border bg-natural-cream/35">
              <div className="flex items-center gap-2 text-natural-text">
                <Camera size={18} className="text-natural-moss animate-pulse" />
                <h3 className="text-sm font-serif font-bold">توثيق التقدم بالصورة لبيت العائلة</h3>
              </div>
              <button
                onClick={handleCloseCameraModal}
                className="p-1.5 hover:bg-natural-border/30 rounded-lg text-natural-muted hover:text-natural-text transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5" dir="rtl">
              
              {/* Option 1: WebRTC Video Camera preview stream */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-natural-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-natural-moss shrink-0"></span>
                  الخيار الأول: التقاط صورة مباشرة ومباشرة من كاميرا جهازك
                </h4>
                
                {cameraError ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-750 text-xs rounded-xl text-right leading-relaxed font-semibold">
                    {cameraError}
                  </div>
                ) : null}

                <div className="relative aspect-video max-w-md mx-auto rounded-xl overflow-hidden bg-black border border-natural-border/80 shadow-inner flex items-center justify-center">
                  {isWebRtcActive ? (
                    <video
                      id="camera-video-preview"
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3.5 text-natural-muted">
                      <Camera size={36} className="mx-auto text-neutral-600 opacity-60" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-neutral-400">تدفق الفيديو غير مفعل حالياً</p>
                        <p className="text-[10px] text-neutral-500">انقر على الزر أدناه لتشغيل الكاميرا الحية للهاتف أو الحاسوب</p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-natural-moss text-white hover:bg-natural-moss-hover rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        تشغيل الكاميرا المباشرة
                      </button>
                    </div>
                  )}

                  {isWebRtcActive && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        className="px-5 py-2.5 bg-natural-moss hover:bg-natural-moss-hover text-white rounded-full text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 cursor-pointer"
                      >
                        <Camera size={14} />
                        <span>التقاط لقطة الآن</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 2: Upload local files */}
              <div className="border-t border-natural-border/50 pt-4.5 space-y-2.5">
                <h4 className="text-xs font-bold text-natural-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-natural-bronze shrink-0"></span>
                  الخيار الثاني: تحميل صورة من ملفات جهازك المحلي أو الاستديو مباشرة
                </h4>
                
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-natural-border/60 border-dashed rounded-xl cursor-pointer bg-natural-cream/30 hover:bg-natural-cream/60 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <Upload size={20} className="text-natural-muted mb-1.5" />
                      <p className="text-xs font-bold text-natural-text">اختر ملف صورة من الاستوديو أو اسحبه هنا</p>
                      <p className="text-[9px] text-natural-muted mt-0.5">صيغ PNG, JPG, WEBP وغيرها (تتحول محلياً فوراً)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Option 3: Choose from default mock progress samples */}
              <div className="border-t border-natural-border/50 pt-4.5 space-y-2.5">
                <h4 className="text-xs font-bold text-natural-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-natural-moss shrink-0"></span>
                  الخيار الثالث: اختيار صورة نموذجية سريعة لتوثيق فئة هذا المشروع
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {samplePhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSamplePhoto(photo.url)}
                      className="relative rounded-xl overflow-hidden hover:ring-2 hover:ring-natural-moss text-right text-[10px] group h-14 border border-natural-border cursor-pointer transition-all"
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.label} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all"
                      />
                      <span className="absolute bottom-1 right-1.5 text-white font-bold bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {photo.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer with Close Button */}
            <div className="bg-natural-cream/35 p-3.5 border-t border-natural-border flex justify-end">
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="px-4 py-2 bg-white hover:bg-natural-cream border border-natural-border text-natural-muted hover:text-natural-text rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
