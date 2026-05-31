import React, { useState } from 'react';
import { Project, ProjectCategory, ProjectStatus, PriorityLevel } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface ProjectFormProps {
  project?: Project; // If provided, we are editing
  onSave: (projectData: Omit<Project, 'id' | 'createdAt' | 'spent'> & { id?: string }) => void;
  onClose: () => void;
  members: string[];
}

export default function ProjectForm({ project, onSave, onClose, members }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [category, setCategory] = useState<ProjectCategory>(project?.category || 'maintenance');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'planning');
  const [priority, setPriority] = useState<PriorityLevel>(project?.priority || 'medium');
  const [leader, setLeader] = useState(project?.leader || members[0] || 'لم يحدد بعد');
  const [budget, setBudget] = useState(project?.budget || "");
  const [dueDate, setDueDate] = useState(project?.dueDate || new Date().toISOString().split('T')[0]);
  const [errorString, setErrorString] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorString('يرجى إدخال اسم المشروع العائلي.');
      return;
    }
    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      setErrorString('يرجى إدخال مبلغ ميزانية صحيح ومقبول (رقم أكبر من أو يساوي الصفر).');
      return;
    }

    onSave({
      id: project?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      priority,
      leader,
      budget: budgetNum,
      dueDate,
    });
  };

  const categories: { value: ProjectCategory; label: string }[] = [
    { value: 'maintenance', label: 'صيانة وتعمير' },
    { value: 'improvement', label: 'تحسينات وديكور' },
    { value: 'furnishing', label: 'تأثيث وتجهيزات' },
    { value: 'events', label: 'مناسبات واجتماعات' },
    { value: 'emergency', label: 'أعطال وطوارئ' },
    { value: 'other', label: 'أخرى (منوع)' }
  ];

  return (
    <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-natural-text">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-natural-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-natural-border bg-natural-cream">
          <h3 className="text-lg font-serif font-bold text-natural-text">
            {project ? 'تعديل تفاصيل المشروع' : 'إضافة مشروع عائلي جديد'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-natural-muted hover:text-natural-text hover:bg-natural-border/40 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorString && (
            <div className="p-3 bg-red-50 text-red-750 rounded-lg text-xs font-semibold flex items-center gap-2 border border-red-105">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorString}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-natural-text mb-1">اسم المشروع *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تجديد عازل الأسطح، غسيل مجالس العائلة..."
              className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs text-natural-text"
              dir="auto"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-natural-text mb-1">تفاصيل المشروع ووصفه</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب خلاصة فكرة المشروع والأمور التي تسعى العائلة لإنجازها..."
              rows={3}
              className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs text-natural-text"
              dir="auto"
            />
          </div>

          {/* Category & Leader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-natural-text mb-1">تصنيف المشروع</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs text-natural-text font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-text mb-1">منسق المشروع (المسؤول)</label>
              <select
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs text-natural-text font-semibold"
              >
                {members.length > 0 ? (
                  members.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))
                ) : (
                  <option value="لم يحدد بعد">لم يحدد بعد (أضف أفراد العائلة أولاً)</option>
                )}
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-natural-text mb-1">حالة المشروع الحالية</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs text-natural-text font-semibold"
              >
                <option value="planning">قيد التخطيط</option>
                <option value="active">قيد التنفيذ والعمل</option>
                <option value="on_hold">معلق مؤقتاً</option>
                <option value="completed">مكتمل ومُنجز</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-text mb-1">الأولوية والأهمية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs text-natural-text font-semibold"
              >
                <option value="high">عالية (عاجل وهام)</option>
                <option value="medium">متوسطة (عادي)</option>
                <option value="low">منخفضة (قابل للتأجيل)</option>
              </select>
            </div>
          </div>

          {/* Budget & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-natural-text mb-1">الميزانية المرصودة (رمزية)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="أدخل مبلغ الميزانية التقديرية"
                className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs text-natural-text"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-text mb-1">تاريخ التسليم المتوقع</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs text-natural-text"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-natural-border/60 bg-natural-cream flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-natural-muted bg-white border border-natural-border rounded-xl hover:bg-natural-cream transition-colors cursor-pointer"
          >
            إلغاء التعديل
          </button>
          
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-bold text-white bg-natural-moss hover:bg-natural-moss-hover border border-natural-moss rounded-xl flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Save size={16} />
            <span>حفظ المشروع</span>
          </button>
        </div>

      </div>
    </div>
  );
}
