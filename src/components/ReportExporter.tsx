import React, { useRef, useState } from 'react';
import { Project, Expense, Task } from '../types';
import { toPng } from 'html-to-image';
import { 
  X, 
  Download, 
  Sparkles, 
  CheckCircle, 
  Award, 
  Users, 
  Calendar, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Feather,
  DollarSign,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

interface ReportExporterProps {
  projects: Project[];
  expenses: Expense[];
  members: string[];
  tasks: Task[];
  onClose: () => void;
  initialSelectedProjectId?: string | null;
}

export default function ReportExporter({
  projects,
  expenses,
  members,
  tasks,
  onClose,
  initialSelectedProjectId = null,
}: ReportExporterProps) {
  const exportAreaRef = useRef<HTMLDivElement>(null);
  const [exportType, setExportType] = useState<'general' | 'certificate'>(
    initialSelectedProjectId ? 'certificate' : 'general'
  );
  
  // Find completed projects to list for certificate select
  const completedProjects = projects.filter(p => p.status === 'completed');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialSelectedProjectId || (completedProjects[0]?.id || '')
  );
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentSelectedProject = projects.find(p => p.id === selectedProjectId);

  const handleDownloadImage = async () => {
    if (!exportAreaRef.current) return;
    setIsGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Add a slight delay to ensure fonts and assets are rendered fully
      await new Promise((resolve) => setTimeout(resolve, 380));

      const dataUrl = await toPng(exportAreaRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2, // High resolution
        backgroundColor: '#ffffff', // Ensures solid background without transparent corners or borders, eliminating dark background quirks in third-party messaging apps
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      const link = document.createElement('a');
      const dateString = new Date().toISOString().split('T')[0];
      const fileName = exportType === 'general' 
        ? `تقرير_بيت_العائلة_الشامل_${dateString}.png`
        : `شهادة_إنجاز_مشروع_${currentSelectedProject?.title || 'بيت_العائلة'}_${dateString}.png`;
        
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setSuccessMsg('تم توليد الصورة وحفظها بنجاح في جهازك!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error generating image:', err);
      setErrorMsg('عذراً، حدث خطأ أثناء تحويل التقرير إلى صورة. يرجى تجربة متصفح آخر أو كرر المحاولة.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculations for general report
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const projectSuccessRate = projects.length > 0 
    ? Math.round((completedProjects.length / projects.length) * 100) 
    : 0;

  // Expenses paid by each member
  const memberSpendingMap: Record<string, number> = {};
  expenses.forEach(e => {
    memberSpendingMap[e.paidBy] = (memberSpendingMap[e.paidBy] || 0) + e.amount;
  });

  // Category Translation
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'maintenance': return 'صيانة دورية';
      case 'improvement': return 'تحسين وتطوير';
      case 'furnishing': return 'تأثيث وديكور';
      case 'events': return 'مناسبات عائلية';
      case 'emergency': return 'حالة طارئة';
      default: return 'أخرى';
    }
  };

  return (
    <div className="fixed inset-0 bg-natural-text/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-natural-border flex flex-col my-auto max-h-[95vh] overflow-hidden" dir="rtl">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-natural-border bg-natural-cream/45">
          <div className="flex items-center gap-2">
            <Award className="text-natural-moss animate-pulse" size={20} />
            <h3 className="text-sm font-serif font-bold text-natural-text sm:text-base">تصدير إنجازات وتفاصيل بيت العائلة</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-natural-border/40 rounded-lg text-natural-muted hover:text-natural-text transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL CONTENT: SELECT TYPE */}
        <div className="p-4 bg-natural-cream/20 border-b border-natural-border/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setExportType('general')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                exportType === 'general'
                  ? 'bg-natural-moss text-white shadow-sm'
                  : 'bg-white text-natural-muted border border-natural-border hover:bg-natural-cream'
              }`}
            >
              <FileText size={14} />
              <span>التقرير العائلي الشامل</span>
            </button>
            <button
              onClick={() => setExportType('certificate')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                exportType === 'certificate'
                  ? 'bg-natural-moss text-white shadow-sm'
                  : 'bg-white text-natural-muted border border-natural-border hover:bg-natural-cream'
              }`}
            >
              <Award size={14} />
              <span>شهادات إنجاز المنجزة ({completedProjects.length})</span>
            </button>
          </div>

          {exportType === 'certificate' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-bold text-natural-muted shrink-0">اختر مشروعاً مكتملاً:</span>
              {completedProjects.length > 0 ? (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-natural-border rounded-xl text-xs font-semibold focus:outline-none text-natural-text"
                >
                  {completedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 p-1.5 px-3 rounded-lg border border-red-100">
                  لا توجد مشاريع منجزة وتامة بعد. حوّل مشروعًا إلى مكتمل لتصدير شهادته!
                </span>
              )}
            </div>
          )}
        </div>

        {/* WORKSPACE & CANVAS AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100 flex justify-center border-b border-natural-border">
          
          {/* THE CAPTURE BOX CONTAINER (Will receive direct styles for printing) */}
          <div 
            ref={exportAreaRef}
            id="family-report-capture"
            className="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-2xl border border-neutral-300 shadow-md text-right space-y-6 relative overflow-hidden"
            style={{ fontFamily: 'sans-serif' }}
          >
            {/* Elegant Vintage Frame Background Elements for traditional touch */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-natural-moss-light/10 rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-natural-bronze-light/10 rounded-tr-full pointer-events-none"></div>
            
            {/* Outer border decoration */}
            <div className="absolute inset-3 border border-natural-border/30 rounded-2xl pointer-events-none"></div>
            <div className="absolute inset-4 border-2 border-natural-moss/10 rounded-xl pointer-events-none"></div>

            {/* ----------------- TYPE 1: GENERAL SYSTEM REPORT ----------------- */}
            {exportType === 'general' && (
              <div className="space-y-6 relative z-10 px-2 select-none">
                {/* Vintage Title Emblem */}
                <div className="text-center space-y-2 border-b-2 border-double border-natural-border pb-5">
                  <div className="mx-auto w-12 h-12 bg-natural-moss text-white rounded-full flex items-center justify-center shadow-md border-4 border-natural-moss-light">
                    <ShieldCheck size={22} className="stroke-[2.2]" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-serif font-black text-natural-text">تقرير إنجازات وتعمير بيت العائلة الكبير</h1>
                  <p className="text-xs text-natural-muted leading-relaxed">
                    مستند صادر لتسجيل ميزانيات صيانة وتجهيز السكن العائلي ومشاريع الأسرة المشتركة
                  </p>
                  <div className="flex items-center justify-center gap-6 pt-1 text-[10px] text-natural-muted font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-natural-moss" />
                      تاريخ التقرير: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-natural-bronze" />
                      المقر: ديوانية بيت العائلة
                    </span>
                  </div>
                </div>

                {/* Micro Metrics Rows */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-natural-cream/40 p-4 rounded-xl border border-natural-border/60">
                  <div className="bg-white p-3 rounded-lg border border-natural-border/40 text-center space-y-0.5 shadow-sm">
                    <span className="text-[9px] font-bold text-natural-muted block">الموازنة المعتمدة</span>
                    <span className="text-sm font-serif font-black text-natural-text">{totalBudget.toLocaleString()} <span className="text-[9px] font-normal text-natural-muted">ر.س</span></span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-natural-border/40 text-center space-y-0.5 shadow-sm">
                    <span className="text-[9px] font-bold text-natural-muted block">دُفِع في الفواتير</span>
                    <span className="text-sm font-serif font-black text-red-700">{totalSpent.toLocaleString()} <span className="text-[9px] font-normal text-neutral-400">ر.س</span></span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-natural-border/40 text-center space-y-0.5 shadow-sm">
                    <span className="text-[9px] font-bold text-natural-muted block">المتبقي المتاح</span>
                    <span className={`text-sm font-serif font-black ${remainingBudget >= 0 ? 'text-natural-moss' : 'text-red-700'}`}>
                      {remainingBudget.toLocaleString()} <span className="text-[9px] font-normal text-neutral-400">ر.س</span>
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-natural-border/40 text-center space-y-0.5 shadow-sm">
                    <span className="text-[9px] font-bold text-natural-muted block font-serif">معدل الإنجاز</span>
                    <span className="text-sm font-serif font-black text-natural-bronze">{projectSuccessRate}%</span>
                  </div>
                </div>

                {/* Section A: Projects progress details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-natural-text border-r-4 border-natural-moss pr-2 flex items-center gap-1.5 bg-neutral-50 py-1">
                    <FolderOpen size={13} className="text-natural-moss" />
                    <span>سجل ومستوى تقدم المشاريع العائلية</span>
                  </h3>
                  
                  {projects.length === 0 ? (
                    <p className="text-center py-4 text-xs text-natural-muted border border-dashed border-natural-border rounded-xl">لا توجد مشاريع مسجلة في اللوحة حالياً.</p>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((proj, idx) => (
                        <div key={proj.id} className="p-3 bg-white border border-natural-border/80 rounded-xl space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-natural-moss-light text-natural-moss font-serif font-bold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="text-xs font-bold text-natural-text">{proj.title}</h4>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full border border-natural-border/70 bg-natural-cream text-natural-muted font-semibold">
                                {getCategoryLabel(proj.category)}
                              </span>
                              <span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                proj.status === 'completed' 
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : proj.status === 'active'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                              }`}>
                                {proj.status === 'completed' ? '✓ منجز تام' : proj.status === 'active' ? '● قيد التنفيذ' : 'مخطط له'}
                              </span>
                            </div>
                          </div>

                          {/* Progress line */}
                          <div className="grid grid-cols-2 gap-4 text-[10px] text-natural-muted mt-1">
                            <div>
                              <span>مسؤول المشروع: </span>
                              <strong className="text-natural-text">{proj.leader}</strong>
                            </div>
                            <div className="text-left font-mono">
                              <span>الميزانية: {proj.budget.toLocaleString()} ر.س</span>
                              <span className="mx-1">/</span>
                              <span>المنفق: {proj.spent.toLocaleString()} ر.س</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section B: Expenses and Bills */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-natural-text border-r-4 border-natural-bronze pr-2 flex items-center gap-1.5 bg-neutral-50 py-1">
                    <FileText size={13} className="text-natural-bronze" />
                    <span>فواتير الصرفية والمدفوعات الأخيرة</span>
                  </h3>
                  
                  {expenses.length === 0 ? (
                    <p className="text-center py-4 text-xs text-natural-muted border border-dashed border-natural-border rounded-xl">لا توجد فواتير أو مصروفات مسجلة.</p>
                  ) : (
                    <div className="border border-natural-border/70 rounded-xl overflow-hidden shadow-xs bg-white text-[10px]">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-natural-cream/35 border-b border-natural-border text-natural-muted font-bold">
                            <th className="p-2 pr-3.5">البند والبيان</th>
                            <th className="p-2">الدافع</th>
                            <th className="p-2">المبلغ</th>
                            <th className="p-2 pl-3.5 text-left">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-natural-border/50 text-natural-text">
                          {expenses.slice(0, 5).map((exp) => (
                            <tr key={exp.id} className="hover:bg-neutral-50">
                              <td className="p-2 pr-3.5 font-semibold">{exp.description}</td>
                              <td className="p-2">{exp.paidBy}</td>
                              <td className="p-2 font-bold font-mono text-red-700">{exp.amount.toLocaleString()} ر.س</td>
                              <td className="p-2 pl-3.5 text-left font-mono text-natural-muted">{exp.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {expenses.length > 5 && (
                        <div className="bg-natural-cream/10 p-1.5 text-center text-[9px] text-natural-muted border-t border-natural-border/50 font-bold">
                          يوجد {expenses.length - 5} فواتير أخرى مسجلة عُدلت في حسابات المستند
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section C: Contributors Financial Contributions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-natural-text border-r-4 border-natural-moss pr-2 flex items-center gap-1.5 bg-neutral-50 py-1">
                    <Users size={13} className="text-natural-moss" />
                    <span>مساهمات أفراد العائلة المالية</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-right">
                    {members.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs text-natural-muted border border-dashed border-natural-border rounded-xl">لا توجد أسماء مسجلة بعد، يرجى إضافتهم من لسان التحكم.</div>
                    ) : (
                      members.map((member, idx) => {
                        const amountPaid = memberSpendingMap[member] || 0;
                        return (
                          <div key={idx} className="p-2.5 bg-neutral-50 hover:bg-natural-cream/20 border border-natural-border/60 rounded-xl text-right">
                            <span className="block text-[10px] font-bold text-natural-text mb-0.5">{member}</span>
                            <span className="block text-xs font-serif font-black text-natural-moss font-mono">{amountPaid.toLocaleString()} ر.س</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Traditional Signature Footer */}
                <div className="flex items-center justify-between border-t border-natural-border pt-4 text-[10px] text-natural-muted">
                  <div className="space-y-0.5">
                    <p>المشرف على السجلات المالي</p>
                    <p className="font-serif font-bold text-natural-text">باسم الهديب ( المنسق الداخلي )</p>
                  </div>
                  <div className="text-center bg-natural-moss-light p-2.5 rounded-lg border border-natural-border/60">
                    <span className="font-serif font-black text-natural-moss">خُتم مجلس بيت العائلة الرسمي</span>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TYPE 2: ELEGANT CERTIFICATE OF COMPLETION ----------------- */}
            {exportType === 'certificate' && (
              <div className="space-y-8 relative z-10 text-center select-none py-4 px-2">
                
                {currentSelectedProject ? (
                  <div className="space-y-6">
                    {/* High Emblem Box */}
                    <div className="mx-auto w-20 h-20 bg-natural-moss text-white rounded-full flex items-center justify-center border-4 border-amber-300 shadow-xl animate-pulse relative">
                      <Award size={40} className="stroke-[1.3] text-amber-200" />
                      <div className="absolute -inset-1 rounded-full border-2 border-natural-moss/20"></div>
                    </div>

                    {/* Top callig or heading text */}
                    <div className="space-y-1">
                      <span className="text-xs uppercase tracking-widest text-natural-bronze font-serif font-bold">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ</span>
                      <h2 className="text-2xl sm:text-3xl font-serif font-black text-natural-text leading-tight tracking-wide border-b border-natural-border/40 pb-4 max-w-sm mx-auto">
                        شَهَادَةُ إِنجَازْ وَشُكْرْ
                      </h2>
                    </div>

                    <div className="space-y-4 max-w-xl mx-auto text-xs sm:text-sm text-neutral-700 leading-loose">
                      <p className="font-semibold text-natural-text text-base">
                        يتقدم مجلس بيت العائلة الكبير بفيض من الشكر والعرفان
                      </p>
                      
                      <div className="my-4 py-2 bg-natural-moss-light border-y border-natural-border text-center">
                        <span className="text-lg sm:text-xl font-serif font-black text-natural-moss">
                          إلى الابن البار: {currentSelectedProject.leader}
                        </span>
                      </div>

                      <p className="text-neutral-600 leading-relaxed font-semibold">
                        وذلك لقاء إخلاصه وجهده المبارك في التخطيط والإشراف والتنسيق لإنجاز مشروع:
                      </p>

                      <p className="text-base font-serif font-black text-natural-bronze my-2">
                        « {currentSelectedProject.title} »
                      </p>

                      <p className="text-[11px] sm:text-xs text-natural-muted leading-relaxed max-w-md mx-auto">
                        والذي تكلّل بالنجاح والتوفيق والتمام والحمد لله بميزانية إجمالية بلغت <span className="font-bold text-natural-text font-serif">{currentSelectedProject.budget.toLocaleString()} ر.س</span>، 
                        والذي ساهم في راحة وأمن عائلتنا الكريمة وتلبية احتياجات السكن على أكمل وجه.
                      </p>
                    </div>

                    {/* Show completed project tasks check list inside certificate */}
                    {tasks.filter(t => t.projectId === currentSelectedProject.id).length > 0 && (
                      <div className="max-w-md mx-auto bg-natural-cream/25 p-4 rounded-xl border border-natural-border/60 text-right space-y-2">
                        <h4 className="text-[10px] font-bold text-natural-muted border-b border-natural-border pb-1">أبرز البنود التي أُنجزت بالكامل:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                          {tasks
                            .filter(t => t.projectId === currentSelectedProject.id)
                            .slice(0, 4)
                            .map((task) => (
                              <div key={task.id} className="flex items-center gap-1.5 text-natural-text">
                                <span className="text-natural-moss text-xs font-bold leading-none shrink-0">✓</span>
                                <span className="truncate">{task.text}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Hand Signature representation */}
                    <div className="grid grid-cols-2 gap-6 pt-10 text-xs text-neutral-600 border-t border-natural-border/40 max-w-md mx-auto">
                      <div className="text-right space-y-1.5">
                        <p className="text-[10px] text-natural-muted">تاريخ منح الوثيقة:</p>
                        <p className="font-serif font-black text-natural-text">{new Date().toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div className="text-left space-y-1">
                        <p className="text-[10px] text-natural-muted">معتمد من:</p>
                        <p className="font-serif font-black text-natural-moss text-xs flex items-center justify-end gap-1">
                          <Feather size={12} className="text-natural-bronze" />
                          <span>ديوان عائلة الهديب</span>
                        </p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-12 space-y-4">
                    <p className="text-xs text-natural-muted">لم يتم اختيار أي مشروع مكتمل لتوليد وثيقة الشكر به.</p>
                  </div>
                )}

              </div>
            )}

            {/* Micro watermark */}
            <div className="absolute bottom-1 right-1/2 translate-x-1/2 text-[8px] text-neutral-300 font-mono pointer-events-none">
              بيت العائلة الكبير © 2026
            </div>
          </div>

        </div>

        {/* FEEDBACK STATUS BAR */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-red-750 text-xs font-semibold text-right border-y border-red-200" dir="rtl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-green-50 text-green-750 text-xs font-semibold text-right border-y border-green-200 flex items-center gap-2" dir="rtl">
            <CheckCircle size={15} className="text-green-600 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS Bar */}
        <div className="p-4 bg-natural-cream/35 border-t border-natural-border flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="text-[10px] text-natural-muted text-right font-medium leading-relaxed sm:max-w-md">
            ملاحظة: يتم تصدير الصورة بدقة عالية كليًا من متصفحك. يرجى الانتظار لحين اكتمال المعالجة والتحميل الفوري.
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-white hover:bg-neutral-50 border border-natural-border text-natural-muted hover:text-natural-text rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              إلغاء النافذة
            </button>
            
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-natural-moss hover:bg-natural-moss-hover disabled:bg-neutral-300 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Sparkles size={14} className="animate-spin" />
                  <span>جاري تحويل التقرير وصياغته...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>تصدير وحفظ الصورة الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
