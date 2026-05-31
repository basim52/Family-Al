import React, { useState } from 'react';
import { Project, Task, ProjectCategory } from '../types';
import { Search, Plus, Calendar, User, ShoppingBag, Flame, Sliders, CheckSquare, Hammer, Trash2, Edit3, ArrowUpRight } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddProjectClick: () => void;
}

export default function ProjectList({
  projects,
  tasks,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onAddProjectClick
}: ProjectListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'كل مشاريع البيت' },
    { value: 'maintenance', label: 'صيانة وتعمير' },
    { value: 'improvement', label: 'تحسينات وديكور' },
    { value: 'furnishing', label: 'تأثيث وتجهيزات' },
    { value: 'events', label: 'مناسبات واجتماعات' },
    { value: 'emergency', label: 'أعطال وطوارئ' }
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'maintenance':
        return <Hammer size={16} className="text-natural-moss" />;
      case 'improvement':
        return <Sliders size={16} className="text-natural-bronze" />;
      case 'furnishing':
        return <ShoppingBag size={16} className="text-natural-bronze" />;
      case 'events':
        return <Calendar size={16} className="text-natural-moss" />;
      case 'emergency':
        return <Flame size={16} className="text-natural-bronze font-bold" />;
      default:
        return <CheckSquare size={16} className="text-natural-muted" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'maintenance': return 'صيانة وتعمير';
      case 'improvement': return 'تحسينات وديكور';
      case 'furnishing': return 'تأثيث وتجهيزات';
      case 'events': return 'مناسبات واجتماعات';
      case 'emergency': return 'أعطال وطوارئ';
      default: return 'أخرى';
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'high':
        return 'bg-natural-bronze-light text-natural-bronze border-natural-bronze/25';
      case 'medium':
        return 'bg-natural-moss-light text-natural-moss border-natural-moss/20';
      case 'low':
      default:
        return 'bg-natural-cream text-natural-muted border-natural-border';
    }
  };

  const getPriorityLabel = (prio: string) => {
    switch (prio) {
      case 'high': return 'هام وعاجل';
      case 'medium': return 'متوسط الأهمية';
      case 'low': return 'عادي هادئ';
      default: return 'عادية';
    }
  };

  const getStatusBadgeAndLabel = (status: string) => {
    switch (status) {
      case 'active':
        return { style: 'bg-natural-moss-light text-natural-moss border-natural-moss/20', text: 'قيد العمل' };
      case 'completed':
        return { style: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'تم الإنجاز ✓' };
      case 'on_hold':
        return { style: 'bg-natural-bronze-light text-natural-bronze border-natural-bronze/20', text: 'معلق مؤقتاً' };
      case 'planning':
      default:
        return { style: 'bg-natural-cream text-natural-muted border-natural-border', text: 'تحت التخطيط' };
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-natural-border shadow-sm">
        
        {/* Search Field */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ابحث عن مشروع صيانة، تأثيث، أو مناسبات عائلية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 bg-natural-cream/40 border border-natural-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text placeholder-natural-muted/70"
          />
          <Search size={16} className="absolute right-3.5 top-3.5 text-natural-muted" />
        </div>

        {/* Action Button */}
        <button
          onClick={onAddProjectClick}
          className="px-5 py-2.5 bg-natural-moss text-white rounded-xl text-xs font-bold hover:bg-natural-moss-hover transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
        >
          <Plus size={16} />
          <span>إضافة مشروع جديد للبيت</span>
        </button>
      </div>

      {/* Category List Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-natural-moss-light/65 rounded-2xl max-w-full overflow-x-auto border border-natural-border/40">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat.value
                ? 'bg-white text-natural-moss shadow-sm border border-natural-border/30'
                : 'text-natural-muted hover:text-natural-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => {
          // Calculate tasks count and completions
          const projectTasks = tasks.filter(t => t.projectId === p.id);
          const completedCount = projectTasks.filter(t => t.completed).length;
          const totalCount = projectTasks.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 105) > 100 ? 100 : Math.round((completedCount / totalCount) * 100) : 0;
          const statusDetails = getStatusBadgeAndLabel(p.status);

          return (
            <div 
              key={p.id}
              className="bg-white rounded-2xl border border-natural-border p-5 shadow-sm hover:shadow-md hover:border-natural-moss transition-all flex flex-col justify-between"
            >
              <div>
                
                {/* Micro Header Tags */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-natural-moss">
                    {getCategoryIcon(p.category)}
                    {getCategoryLabel(p.category)}
                  </span>

                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${statusDetails.style}`}>
                    {statusDetails.text}
                  </span>
                </div>

                {/* Project Title and expand trigger */}
                <button
                  onClick={() => onSelectProject(p.id)}
                  className="group w-full text-right block focus:outline-none"
                >
                  <h3 className="text-base font-serif font-bold text-natural-text leading-snug group-hover:text-natural-moss transition-colors flex items-center gap-1">
                    <span>{p.title}</span>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-natural-moss shrink-0" />
                  </h3>
                </button>

                <p className="text-xs text-natural-muted leading-relaxed mt-2 line-clamp-2 h-8">{p.description}</p>

                {/* Task Metrics & ProgressBar */}
                <div className="space-y-1.5 mt-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-natural-muted">
                    <span>تقدم مهام العائلة:</span>
                    <span className="text-natural-text">{completedCount}/{totalCount} منتهية (%{progressPercent})</span>
                  </div>
                  <div className="w-full bg-natural-cream h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        p.status === 'completed' ? 'bg-emerald-500' : 'bg-natural-moss'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Finance indicators */}
                <div className="grid grid-cols-2 gap-3.5 mt-4 pt-3.5 border-t border-natural-border/60 text-[11px] font-medium text-natural-muted">
                  <div>
                    <span>الميزانية المرصودة:</span>
                    <p className="text-xs font-bold text-natural-text mt-0.5">{p.budget.toLocaleString()} ريال</p>
                  </div>
                  <div>
                    <span>المنفق الفعلي:</span>
                    <p className={`text-xs font-bold mt-0.5 ${p.spent > p.budget ? 'text-red-650' : 'text-natural-moss'}`}>
                      {p.spent.toLocaleString()} ريال
                    </p>
                  </div>
                </div>

                {/* Priority Indicator */}
                <div className="flex gap-2 items-center mt-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(p.priority)}`}>
                    الأولوية: {getPriorityLabel(p.priority)}
                  </span>
                </div>

              </div>

              {/* Card Footer Tools */}
              <div className="mt-5 pt-3.5 border-t border-natural-border/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-natural-muted text-xs">
                  <User size={13} className="text-natural-muted" />
                  <span>المنسق: <span className="font-semibold text-natural-text">{p.leader}</span></span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onEditProject(p)}
                    className="p-1.5 rounded-lg text-natural-muted hover:text-natural-moss hover:bg-natural-moss-light transition-colors"
                    title="تعديل تدوين المشروع"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => onDeleteProject(p.id)}
                    className="p-1.5 rounded-lg text-natural-muted hover:text-red-650 hover:bg-red-50 transition-colors"
                    title="حذف المشروع"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-natural-border">
            <Sliders size={36} className="mx-auto text-natural-muted mb-2" />
            <p className="text-sm font-semibold text-natural-muted">لا توجد مشاريع عائلية تطابق شروط البحث الفعالة.</p>
            <button
              onClick={onAddProjectClick}
              className="mt-3.5 text-xs font-bold text-natural-moss bg-natural-moss-light px-3.5 py-1.5 rounded-lg border border-natural-border"
            >
              أضف أول مشروع للمجلس الآن
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
