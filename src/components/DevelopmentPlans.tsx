import React, { useState } from 'react';
import { DevelopmentPlan } from '../types';
import { Lightbulb, Plus, Trash2, Sparkles, AlertTriangle, Loader2, DollarSign, User, ThumbsUp, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

interface DevelopmentPlansProps {
  plans: DevelopmentPlan[];
  members: string[];
  onAddPlan: (plan: Omit<DevelopmentPlan, 'id' | 'createdAt' | 'votes'>) => void;
  onDeletePlan: (planId: string) => void;
  onToggleVote: (planId: string, memberName: string) => void;
  onUpdateStatus: (planId: string, status: 'studying' | 'approved' | 'deferred') => void;
  onUpdateAIFeasibility: (planId: string, feasibility: DevelopmentPlan['aiFeasibility']) => void;
}

export default function DevelopmentPlans({
  plans,
  members,
  onAddPlan,
  onDeletePlan,
  onToggleVote,
  onUpdateStatus,
  onUpdateAIFeasibility,
}: DevelopmentPlansProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('تحسين عام');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [selectedVoter, setSelectedVoter] = useState(members[0] || '');
  
  // Loading state for AI analysis per plan ID
  const [analyzingPlanId, setAnalyzingPlanId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !suggestedBy) {
      setError('يرجى ملء الحقول الإلزامية: اسم الخطة والعضو المقترح.');
      return;
    }
    setError('');
    onAddPlan({
      title: title.trim(),
      description: description.trim(),
      category,
      suggestedBy,
      estimatedCost: parseFloat(estimatedCost) || 0,
      status: 'studying',
    });
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('تحسين عام');
    setSuggestedBy('');
    setEstimatedCost('');
    setIsAdding(false);
  };

  const handleRunAIAnalysis = async (plan: DevelopmentPlan) => {
    setAnalyzingPlanId(plan.id);
    try {
      const response = await fetch('/api/ai/analyze-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan.title,
          description: plan.description,
          category: plan.category,
          estimatedCost: plan.estimatedCost,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onUpdateAIFeasibility(plan.id, data);
      } else {
        alert(data.error || 'حدث خطأ متوقع أثناء طلب دراسة جدوى جيميناي.');
      }
    } catch (err) {
      alert('فشل الاتصال بالخادم الذكي لإنجاز الدراسة.');
    } finally {
      setAnalyzingPlanId(null);
    }
  };

  return (
    <div className="space-y-6 text-natural-text">
      {/* Header section with explanatory description */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-natural-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-natural-bronze/10 text-natural-bronze flex items-center justify-center">
              <Lightbulb size={18} />
            </div>
            <h2 className="text-lg font-serif font-bold text-natural-text">خطط وتطلعات التطوير المستقبلية</h2>
          </div>
          <p className="text-xs text-natural-muted mt-1 leading-relaxed">
            مساحة عائلية تشاركية لتسجيل الاقتراحات والمشاريع طويلة المدى لبيت العائلة وفحص واقعيتها بالذكاء الاصطناعي وثم التصويت المتبادل عليها تمهيداً لتبنيها برلمانياً.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setError('');
          }}
          className="px-4 py-2 bg-natural-moss text-white rounded-xl text-xs font-bold hover:bg-natural-moss/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 self-stretch sm:self-auto text-center justify-center"
        >
          <Plus size={15} />
          <span>{isAdding ? 'إغلاق النموذج' : 'اقتراح خطة تطوير'}</span>
        </button>
      </div>

      {/* Adding Proposal Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-natural-border shadow-md space-y-4 animate-fadeIn">
          <h3 className="text-sm font-serif font-bold text-natural-text border-b border-natural-cream pb-2">نموذج تطلع وخطة تطوير جديدة</h3>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-natural-text">عنوان الفكرة أو التطوير المقترح: <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="مثلاً: مظلة حديقة مجهزة برذاذ مائي، سخانات طاقة شمسية..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-natural-text">تصنيف خطة التطوير:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
              >
                <option value="توسعة وبناء">توسعة وبناء</option>
                <option value="تجميل وترفيه">تجميل وترفيه</option>
                <option value="تحسين بيئي وتوفير">تحسين بيئي وتوفير</option>
                <option value="تكنولوجيا وأتمتة">تكنولوجيا وأتمتة</option>
                <option value="صيانة إنشائية كبرى">صيانة إنشائية كبرى</option>
                <option value="تحسين عام">تحسين عام</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-natural-text">شرح تفصيلي حول الأهمية والجدوى للبيت الكبير:</label>
            <textarea
              rows={3}
              placeholder="اكتب أسباب رغبتك في هذا التحديث، أين يقع بالمنزل، وكيف سيخدم العائلة والأبناء..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-natural-text">العضو المقترح للفكرة: <span className="text-red-500">*</span></label>
              {members.length > 0 ? (
                <select
                  value={suggestedBy}
                  onChange={(e) => setSuggestedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
                >
                  <option value="">-- اختر صاحب الفكرة --</option>
                  {members.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="اكتب اسمك الثنائي..."
                  value={suggestedBy}
                  onChange={(e) => setSuggestedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-natural-text">التكلفة المتوقعة الإجمالية (تقدير أولي):</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="مثال: 5000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text text-left pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-natural-muted">وحدة العملة</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError('');
              }}
              className="px-3.5 py-2 hover:bg-natural-cream text-natural-muted rounded-xl text-xs font-bold transition-all border border-transparent cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-natural-moss text-white rounded-xl text-xs font-bold hover:bg-natural-moss-hover transition-all cursor-pointer shadow-sm"
            >
              طرح الاقتراح بالجدول
            </button>
          </div>
        </form>
      )}

      {/* Global Voting voter name selector config */}
      {members.length > 0 && plans.length > 0 && (
        <div className="bg-natural-bronze-light/45 border border-natural-bronze/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-natural-text">
          <div className="flex items-center gap-2">
            <ThumbsUp size={16} className="text-natural-bronze animate-bounce" />
            <span className="text-xs font-black">ركن المساهمة والتأييد الديمقراطي:</span>
            <span className="text-[11px] text-natural-muted">حدد اسمك الحالي لتأييد أو إلغاء تطلع بالمنزل:</span>
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedVoter}
              onChange={(e) => setSelectedVoter(e.target.value)}
              className="w-full px-3 py-1.5 border border-natural-bronze/30 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-bronze text-natural-text"
            >
              {members.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Plans list visualization */}
      {plans.length === 0 ? (
        <div className="bg-white py-14 text-center rounded-2xl border border-dashed border-natural-border">
          <Lightbulb size={36} className="text-natural-stone mx-auto mb-2.5 animate-pulse" />
          <p className="text-sm font-bold text-natural-text">لا يوجد أي خطط تطوير مسجلة حتى الآن.</p>
          <p className="text-xs text-natural-muted mt-1 leading-relaxed">
            انقر فوق "اقتراح خطة تطوير" في الأعلى لإضافة أفكار ومقترحات مستقبلية ترفع من جمال وعمر وعملية بيتكم المشترك.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {plans.map((plan) => {
            const hasVoted = plan.votes.includes(selectedVoter);
            return (
              <div key={plan.id} className="bg-white rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col justify-between">
                
                {/* Header Information strip */}
                <div className="p-5 border-b border-natural-cream space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-natural-moss-light text-natural-moss border border-natural-moss/10 rounded-full text-[10px] font-bold">
                      {plan.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={plan.status}
                        onChange={(e) => onUpdateStatus(plan.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer focus:outline-none ${
                          plan.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : plan.status === 'deferred'
                            ? 'bg-red-50 text-red-650 border-red-150'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="studying">تحت الدراسة والمشورة</option>
                        <option value="approved">معتمد عائلياً بالبرلمان</option>
                        <option value="deferred">مؤجل للفترات اللاحقة</option>
                      </select>

                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف فكرة التطوير هذه نهائياً؟')) {
                            onDeletePlan(plan.id);
                          }
                        }}
                        className="p-1 hover:bg-red-50 text-natural-muted hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="حذف خطة التطوير"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-serif font-bold text-natural-text leading-snug">{plan.title}</h3>
                    <p className="text-xs text-natural-muted mt-1 leading-relaxed whitespace-pre-line">{plan.description}</p>
                  </div>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[10px] text-natural-muted border-t border-natural-stone-light">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-natural-bronze" />
                      <span>المقترح: <strong>{plan.suggestedBy}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 font-mono">
                      <DollarSign size={12} className="text-natural-bronze" />
                      <span>الكلفة المتوقعة: <strong>{plan.estimatedCost > 0 ? `${plan.estimatedCost.toLocaleString()} وحدة العملة` : 'غير محددة بدقة'}</strong></span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Layers size={12} className="text-natural-bronze" />
                      <span>تاريخ الطرح: <span>{plan.createdAt}</span></span>
                    </div>
                  </div>
                </div>

                {/* Voter support and action bottom footer panel */}
                <div className="bg-natural-stone-light/40 px-5 py-3.5 border-b border-natural-cream flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (!selectedVoter) {
                          alert('يرجى اختيار اسمك أولاً في ركن التأييد بالأعلى للمساهمة بصوتك.');
                          return;
                        }
                        onToggleVote(plan.id, selectedVoter);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border scale-100 active:scale-95 ${
                        hasVoted 
                          ? 'bg-natural-bronze text-white border-natural-bronze shadow-sm' 
                          : 'bg-white hover:bg-natural-cream text-natural-text border-natural-border'
                      }`}
                    >
                      <ThumbsUp size={13} className={hasVoted ? 'fill-current' : ''} />
                      <span>{hasVoted ? 'مؤيّد بنجاح! ✓' : 'أنا أؤيد هذه الفكرة'}</span>
                    </button>

                    <div className="text-[10px] text-natural-text">
                      <span className="font-bold text-natural-bronze">التأييد ({plan.votes.length}):</span>{' '}
                      {plan.votes.length === 0 ? (
                        <span className="text-natural-muted">لا توجد أصوات تأييد بعد. كن الأول لمباركتها!</span>
                      ) : (
                        <span className="font-semibold text-natural-muted leading-none">{plan.votes.join('، ')}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunAIAnalysis(plan)}
                    disabled={analyzingPlanId !== null}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-natural-moss to-natural-moss/80 hover:from-natural-moss/90 hover:to-natural-moss text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto disabled:opacity-60 cursor-pointer text-center"
                  >
                    {analyzingPlanId === plan.id ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-amber-200" />
                        <span>جاري صياغة دراسة الجدوى بذكاء...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-amber-300 animate-pulse" />
                        <span>{plan.aiFeasibility ? 'تحديث دراسة الجدوى المعززة (جيميناي)' : 'صياغة دراسة الجدوى الذكية (جيميناي) ⚡'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Feasibility study output block */}
                {plan.aiFeasibility && (
                  <div className="bg-natural-moss-light/30 p-5 border-t border-natural-border space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-natural-moss/10 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={15} className="text-natural-moss animate-pulse" />
                        <h4 className="font-serif font-bold text-xs text-natural-text flex items-center gap-1">
                          تقرير دراسة الجدوى للمستشار جيميناي
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <span className="text-[10px] text-natural-muted block">نسبة واقعية الجدوى:</span>
                          <span className={`text-[13px] font-black ${
                            plan.aiFeasibility.score >= 75 ? 'text-emerald-700' : plan.aiFeasibility.score >= 50 ? 'text-amber-700' : 'text-red-700'
                          }`}>
                            {plan.aiFeasibility.score}%
                          </span>
                        </div>
                        <div className="h-6 w-[1px] bg-natural-border" />
                        <div className="text-left">
                          <span className="text-[10px] text-natural-muted block">مستوى الجهد:</span>
                          <span className="text-[11px] font-bold text-natural-text">
                            {plan.aiFeasibility.effort === 'high' ? 'مجهود وعمّالة عالية' : plan.aiFeasibility.effort === 'medium' ? 'مجهود متوسط' : 'مجهود بسيط عائلي'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pros & Cons list */}
                      <div className="space-y-2.5">
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-500/10 space-y-1">
                          <h5 className="font-bold text-[11px] text-emerald-800 flex items-center gap-1">✓ المزايا والفوائد الأسرية:</h5>
                          <ul className="list-disc list-inside space-y-1 text-neutral-650 pr-1.5 leading-relaxed">
                            {plan.aiFeasibility.pros.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-red-50/40 p-3 rounded-xl border border-red-500/10 space-y-1">
                          <h5 className="font-bold text-[11px] text-red-800 flex items-center gap-1">⚠️ التحديات والمخاطر أو الكلفة:</h5>
                          <ul className="list-disc list-inside space-y-1 text-neutral-650 pr-1.5 leading-relaxed">
                            {plan.aiFeasibility.cons.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Implementation Steps */}
                      <div className="bg-white p-3 rounded-xl border border-natural-border space-y-2 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-[11px] text-natural-moss flex items-center gap-1">
                            <Layers size={11} /> خطوات التنفيذ والتحضير الهندسي المقترح:
                          </h5>
                          <ol className="list-decimal list-inside space-y-1 text-natural-text pr-1.5 mt-1 leading-relaxed">
                            {plan.aiFeasibility.steps.map((s, i) => (
                              <li key={i} className="text-[11px] text-natural-text font-medium"><span className="text-natural-bronze font-mono font-bold"></span>{s}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="mt-3 pt-2 border-t border-natural-cream">
                          <strong className="text-[10px] text-natural-muted flex items-center gap-1">💡 توصية مستشار بيت العائلة:</strong>
                          <p className="text-[11px] text-natural-text leading-relaxed mt-0.5 whitespace-pre-line bg-natural-cream/40 p-2 rounded-lg italic">
                            "{plan.aiFeasibility.verdict}"
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
