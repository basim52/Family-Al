import React, { useState } from 'react';
import { Project, Task } from '../types';
import { Sparkles, Brain, DollarSign, ListChecks, HelpCircle, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  projects: Project[];
  onAddSuggestedTasks: (projectId: string, tasksToAppend: { text: string; priority: 'high' | 'medium' | 'low' }[]) => void;
}

export default function AIAssistant({ projects, onAddSuggestedTasks }: AIAssistantProps) {
  const [activeSubTab, setActiveSubTab] = useState<'advisor' | 'wizard'>('advisor');
  
  // Chat Advisor State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: 'أهلاً بكم يا أفراد بيت العائلة المبارك! 🌸 أنا مستشاركم العائلي الذكي. يسعدني جداً مساعدتكم في التخطيط للمجلس وصيانة المنزل والحديقة، أو حل النزاعات اللوجستية وتوزيع ميزانيات المناسبات بكل مودة وتعاون. اطرحوا علي أي سؤال أو فكرة عائلية!'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Wizard Planner State
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);
  
  // Suggested Output States
  const [suggestedTasks, setSuggestedTasks] = useState<{ text: string; priority: 'high' | 'medium' | 'low' }[] | null>(null);
  const [estimatedBudget, setEstimatedBudget] = useState<{
    totalEstimated: number;
    currency: string;
    items: { item: string; estimatedCost: number; reason: string }[];
    advice: string;
  } | null>(null);

  const [wizardError, setWizardError] = useState('');

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Chat Submission
  const handleSendChat = async (textToSend?: string) => {
    const msg = textToSend || chatMessage;
    if (!msg.trim()) return;

    // Add local user message
    const updatedHistory = [...chatHistory, { role: 'user', text: msg }];
    setChatHistory(updatedHistory);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/ask-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: chatHistory }),
      });

      const data = await response.json();
      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'model', text: `معذرة يا أحباب، حدث خطأ: ${data.error || 'عذراً، لم تنجح الاتصالات بمحرك الذكاء الاصطناعي.'}` }]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'حدث خطأ غير متوقع أثناء تواصلنا العائلي. يرجى مراجعة تشغيل الخادم والاتصال بالإنترنت.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate task suggestions via AI
  const handleGenerateTasks = async () => {
    if (!activeProject) {
      setWizardError('الرجاء اختيار مشروع عائلي تخطيطي أولاً.');
      return;
    }
    setWizardError('');
    setIsGeneratingTasks(true);
    setSuggestedTasks(null);

    try {
      const response = await fetch('/api/ai/suggest-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProject.title,
          description: activeProject.description,
          category: activeProject.category,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuggestedTasks(data.tasks);
      } else {
        setWizardError(data.error || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لتوليد قائمة المهام.');
      }
    } catch (err) {
      setWizardError('فشل الاتصال بالخادم الداخلي لتخطيط المهام.');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Generate budget estimations via AI
  const handleGenerateBudget = async () => {
    if (!activeProject) {
      setWizardError('الرجاء اختيار مشروع عائلي تخطيطي أولاً.');
      return;
    }
    setWizardError('');
    setIsGeneratingBudget(true);
    setEstimatedBudget(null);

    try {
      const response = await fetch('/api/ai/estimate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProject.title,
          description: activeProject.description,
          category: activeProject.category,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setEstimatedBudget(data);
      } else {
        setWizardError(data.error || 'حدث خطأ أثناء مهد البينات وتقدير التكلفة للموازنة.');
      }
    } catch (err) {
      setWizardError('فشل التوصيل بالخادم لحساب تقدير التكاليف.');
    } finally {
      setIsGeneratingBudget(false);
    }
  };

  // Function to save recommended tasks into the active project database
  const [tasksImported, setTasksImported] = useState(false);
  const handleImportTasks = () => {
    if (suggestedTasks && activeProject) {
      onAddSuggestedTasks(activeProject.id, suggestedTasks);
      setTasksImported(true);
      setTimeout(() => setTasksImported(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-natural-text">
      
      {/* Visual Navigation Side Rail */}
      <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex flex-col gap-2">
        <h3 className="text-xs font-bold text-natural-muted mb-2 uppercase tracking-wider">مستشاري الذكاء الاصطناعي</h3>
        
        <button
          onClick={() => { setActiveSubTab('advisor'); setWizardError(''); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
            activeSubTab === 'advisor'
              ? 'bg-natural-moss border-natural-moss hover:bg-natural-moss text-white shadow-sm'
              : 'text-natural-muted border-transparent hover:bg-natural-cream hover:text-natural-text'
          }`}
        >
          <Brain size={18} />
          <span>مستشار العائلة الحكيم</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('wizard'); setWizardError(''); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
            activeSubTab === 'wizard'
              ? 'bg-natural-moss border-natural-moss hover:bg-natural-moss text-white shadow-sm'
              : 'text-natural-muted border-transparent hover:bg-natural-cream hover:text-natural-text'
          }`}
        >
          <Sparkles size={18} />
          <span>مخطط المشاريع الذكي</span>
        </button>

        <div className="mt-8 p-4 bg-natural-cream border border-natural-border/60 rounded-xl space-y-2">
          <h4 className="text-[11px] font-bold text-natural-text flex items-center gap-1.5">
            <Sparkles size={12} className="text-natural-bronze animate-pulse" />
            تخطيط معتمد من جيميناي
          </h4>
          <p className="text-[10px] text-natural-muted leading-relaxed">
            يستخدم هذا الركن نموذج الذكاء الاصطناعي المتطور لتوفير حلول عملية وصيانة وتوزيع مالي للبيت والمجلس بطرق ترفع التفاعل والمودة.
          </p>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex flex-col min-h-[500px]">
        {activeSubTab === 'advisor' ? (
          
          /* VIEW 1: Advisor Chat interface */
          <div className="flex flex-col h-full flex-1 justify-between gap-4">
            <div>
              <h2 className="text-base font-serif font-bold text-natural-text">مستشار بيت العائلة الذكي</h2>
              <p className="text-xs text-natural-muted mt-0.5">اسأل عن تنظيم المهام، فض النزاعات المالية، أو اقتراح خطط لمجلس عائلي حميم ومتكامل.</p>
            </div>

            {/* Chat list container */}
            <div className="flex-1 overflow-y-auto max-h-[350px] p-2 space-y-3 bg-natural-cream/30 rounded-2xl border border-natural-border/50 flex flex-col">
              {chatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    chat.role === 'user'
                      ? 'bg-natural-moss text-white self-end rounded-br-none font-medium'
                      : 'bg-white text-natural-text border border-natural-border self-start shadow-sm rounded-bl-none whitespace-pre-wrap'
                  }`}
                >
                  <span className={`text-[10px] mb-1 font-bold ${chat.role === 'user' ? 'text-natural-cream/80' : 'text-natural-bronze'}`}>
                    {chat.role === 'user' ? 'أنت (أحد الأعضاء)' : 'مجلس الحكمة الزاهر'}
                  </span>
                  <span>{chat.text}</span>
                </div>
              ))}
              
              {chatLoading && (
                <div className="bg-natural-cream text-natural-muted rounded-2xl rounded-bl-none px-4 py-3 leading-relaxed text-xs self-start flex items-center gap-2 animate-pulse border border-natural-border/30">
                  <Loader2 size={12} className="animate-spin text-natural-moss" />
                  <span>يقوم المستشار بصياغة النصائح العائلية الحكيمة لكم...</span>
                </div>
              )}
            </div>

            {/* Quick Questions suggestion */}
            <div className="space-y-1.5 pt-1.5">
              <p className="text-[10px] text-natural-muted font-bold flex items-center gap-1">
                <HelpCircle size={10} /> اسئلة شائعة يمكنك النقر عليها والبدء فوراً:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSendChat("كيف نوزع أدوار الصيانة وإصلاح البيت عادلاً دون تكاسل؟")}
                  className="px-3 py-1 bg-white hover:bg-natural-cream text-natural-text rounded-lg text-[10px] font-semibold border border-natural-border transition-colors cursor-pointer"
                >
                  توزيع أدوار الصيانة عادلاً
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat("اقترح فعاليات عائلية لتعزيز الترابط ببيت العائلة بالجمعة.")}
                  className="px-3 py-1 bg-white hover:bg-natural-cream text-natural-text rounded-lg text-[10px] font-semibold border border-natural-border transition-colors cursor-pointer"
                >
                  فعاليات الترابط بيوم الجمعة
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat("نصيحة لحل الخلافات المالية الحاصلة بمصروفات البيت المشتركة المرتفعة؟")}
                  className="px-3 py-1 bg-white hover:bg-natural-cream text-natural-text rounded-lg text-[10px] font-semibold border border-natural-border transition-colors cursor-pointer"
                >
                  حل خلاف مالي عائلي بهدوء
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} 
              className="flex items-center gap-2 border border-natural-border rounded-xl overflow-hidden p-1 bg-white focus-within:ring-2 focus-within:ring-natural-moss transition-shadow"
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="اسأل المستشار عن مشاريع البيت، الميزانية، أو التنظيم..."
                className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none text-natural-text"
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-natural-bronze text-white rounded-lg text-xs font-semibold hover:bg-natural-bronze-hover transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                disabled={chatLoading}
              >
                <Send size={12} />
                <span>إرسال</span>
              </button>
            </form>

          </div>
        ) : (
          
          /* VIEW 2: Project AI Planner Wizard */
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-serif font-bold text-natural-text">مخطط وجرد مشاريع بيت العائلة الذكي</h2>
                <p className="text-xs text-natural-muted mt-0.5">اختر مشروعاً مسجلاً، ودع الذكاء الاصطناعي يقوم بصياغة المهام الهندسية أو تقدير جدول التكاليف بدقة.</p>
              </div>

              {wizardError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-105">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* Selection Block */}
              <div className="flex flex-col sm:flex-row items-end gap-3 bg-natural-cream p-4 rounded-2xl border border-natural-border/60">
                <div className="flex-1 space-y-1 w-full">
                  <label className="block text-xs font-bold text-natural-text">اختر مشروع بيت العائلة المستهدف:</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSuggestedTasks(null);
                      setEstimatedBudget(null);
                      setWizardError('');
                    }}
                    className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
                  >
                    <option value="" disabled>اختر مشروعاً من القائمة...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.leader})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto shrink-0 justify-end">
                  {/* Task Suggest Button */}
                  <button
                    onClick={handleGenerateTasks}
                    disabled={isGeneratingTasks || isGeneratingBudget || !selectedProjectId}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-natural-moss text-white rounded-xl text-xs font-bold hover:bg-natural-moss-hover disabled:opacity-55 transition-opacity flex items-center justify-center gap-1.5 shadow-sm border border-natural-moss cursor-pointer"
                  >
                    {isGeneratingTasks ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>توليد المهام...</span>
                      </>
                    ) : (
                      <>
                        <ListChecks size={14} />
                        <span>اقتراح مهام</span>
                      </>
                    )}
                  </button>

                  {/* Budget Estimate Button */}
                  <button
                    onClick={handleGenerateBudget}
                    disabled={isGeneratingTasks || isGeneratingBudget || !selectedProjectId}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-natural-bronze text-white rounded-xl text-xs font-bold hover:bg-natural-bronze-hover disabled:opacity-55 transition-opacity flex items-center justify-center gap-1.5 shadow-sm border border-natural-bronze cursor-pointer"
                  >
                    {isGeneratingBudget ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>تقدير الكلفة...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign size={14} />
                        <span>حساب ميزانية</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Outputs Container Rendering Panel */}
              <div className="space-y-4">
                
                {/* 1. Suggested tasks output wrapper */}
                {suggestedTasks && (
                  <div className="border border-natural-moss/20 p-5 rounded-2xl space-y-4 bg-natural-moss-light/35">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-natural-moss/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-natural-moss animate-pulse" />
                        <h4 className="text-xs font-bold text-natural-text">قائمة المهام المقترحة بواسطة المساعد الذكي</h4>
                      </div>

                      <button
                        onClick={handleImportTasks}
                        disabled={tasksImported}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
                          tasksImported 
                            ? 'bg-natural-moss text-white border-natural-moss' 
                            : 'bg-natural-bronze hover:bg-natural-bronze-hover border-natural-bronze text-white shadow-sm'
                        }`}
                      >
                        {tasksImported ? "تم دمج المهام بنجاح! ✓" : "استيراد المهام وتطبيقها فوراً"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {suggestedTasks.map((t, index) => (
                        <div key={index} className="bg-white p-3 rounded-xl border border-natural-border shadow-sm flex items-start gap-2 text-xs text-natural-text">
                          <CheckCircle2 size={14} className="text-natural-moss mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="font-semibold text-natural-text leading-snug">{t.text}</p>
                            <span className={`inline-block text-[10px] px-1.5 py-0.5 font-bold rounded border ${
                              t.priority === 'high' ? 'bg-natural-bronze-light text-natural-bronze border-natural-bronze/20' : t.priority === 'medium' ? 'bg-natural-moss-light text-natural-moss border-natural-moss/20' : 'bg-natural-cream text-natural-muted border-natural-border'
                            }`}>
                              أولوية: {t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Estimated budgets output wrapper */}
                {estimatedBudget && (
                  <div className="border border-natural-bronze/20 p-5 rounded-2xl space-y-4 bg-natural-bronze-light/35">
                    <div className="flex items-center justify-between border-b border-natural-bronze/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-natural-bronze animate-pulse" />
                        <h4 className="text-xs font-bold text-natural-text">دراسة الموازنة وحساب بنود التكاليف التقديرية</h4>
                      </div>

                      <div className="text-left">
                        <span className="text-[11px] text-natural-muted block font-bold">التكلفة الإجمالية التقديرية:</span>
                        <span className="text-base font-serif font-bold text-natural-bronze">{estimatedBudget.totalEstimated.toLocaleString()} {estimatedBudget.currency}</span>
                      </div>
                    </div>

                    {/* Cost Items Grid */}
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-natural-text">بنود التكلفة الموصى بها:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {estimatedBudget.items.map((bItem, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-natural-border shadow-sm space-y-1 text-xs flex flex-col justify-between">
                            <div>
                              <p className="font-bold text-natural-text leading-tight">{bItem.item}</p>
                              <p className="text-[10px] text-natural-muted leading-normal mt-1">{bItem.reason}</p>
                            </div>
                            <p className="text-right font-mono font-bold text-natural-text border-t border-natural-cream pt-1.5 mt-2.5 bg-natural-cream/50 px-2 py-0.5 rounded">
                              {bItem.estimatedCost} {estimatedBudget.currency}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Golden Advice */}
                    <div className="p-3 bg-white rounded-xl border border-natural-border shadow-sm space-y-1">
                      <h5 className="text-[11px] font-bold text-natural-bronze flex items-center gap-1">
                        💡 نصيحة الادخار والتخطيط الذكي:
                      </h5>
                      <p className="text-[11px] text-natural-text leading-relaxed whitespace-pre-line">{estimatedBudget.advice}</p>
                    </div>

                  </div>
                )}

                {/* Neutral placeholder when no selection has run yet */}
                {!suggestedTasks && !estimatedBudget && (
                  <div className="py-16 text-center bg-natural-cream rounded-2xl border border-dashed border-natural-border/80">
                    <Brain size={32} className="mx-auto text-natural-muted mb-2 animate-bounce animate-duration-1000" />
                    <p className="text-sm font-bold text-natural-text">ماتزال دراسة الجدوى وتوليد المهام فارغة.</p>
                    <p className="text-xs text-natural-muted mt-1">اختر مشروع بيت العائلة بالأعلى، وانقر فوق أداة المهام أو الميزان لتبدأ جولة تحليلنا الذكي.</p>
                  </div>
                )}
              </div>

            </div>

            <p className="text-[10px] text-natural-muted pt-3 border-t border-natural-border/50">
              ملاحظة: البنود النقدية وأيام التقدير الناتجة عن الذكاء الاصطناعي هي معايير استرشادية لتقريب الكلف استناداً إلى تجارب الصيانة العامة.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
