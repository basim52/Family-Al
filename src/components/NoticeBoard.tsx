import React, { useState, useEffect } from 'react';
import { Notice } from '../types';
import { Megaphone, GraduationCap, CheckCircle, Info, Calendar, Plus, X, MessageSquare, Trash2, Send } from 'lucide-react';

interface NoticeBoardProps {
  notices: Notice[];
  members: string[];
  onAddNotice: (notice: Omit<Notice, 'id' | 'date'>) => void;
  onDeleteNotice: (id: string) => void;
}

export default function NoticeBoard({ notices, members, onAddNotice, onDeleteNotice }: NoticeBoardProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<'announcement' | 'decision' | 'note'>('announcement');
  const [errorNotice, setErrorNotice] = useState('');

  // Settle default author when members loaded
  useEffect(() => {
    if (members?.length > 0 && !author) {
      setAuthor(members[0]);
    }
  }, [members, author]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorNotice('الرجاء تعبئة العنوان ونص التنبيه.');
      return;
    }
    
    onAddNotice({
      title: title.trim(),
      content: content.trim(),
      author,
      type,
    });

    setTitle('');
    setContent('');
    setIsAdding(false);
    setErrorNotice('');
  };

  const filteredNotices = notices.filter(n => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const getNoticeBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return {
          icon: <Megaphone size={14} className="text-natural-bronze" />,
          bgColor: 'bg-natural-bronze-light border-natural-bronze/10',
          textColor: 'text-natural-bronze',
          label: 'إعلان عاجل'
        };
      case 'decision':
        return {
          icon: <CheckCircle size={14} className="text-natural-moss" />,
          bgColor: 'bg-natural-moss-light border-natural-moss/20',
          textColor: 'text-natural-moss',
          label: 'قرار مجلس العائلة'
        };
      case 'note':
      default:
        return {
          icon: <Info size={14} className="text-natural-text" />,
          bgColor: 'bg-natural-cream border-natural-border',
          textColor: 'text-natural-text',
          label: 'تنبيه عائلي'
        };
    }
  };

  return (
    <div className="space-y-6 text-natural-text">
      
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-natural-border shadow-sm">
        <div>
          <h2 className="text-lg font-serif font-bold text-natural-text">مستجدات ولوحة إعلانات بيت العائلة</h2>
          <p className="text-xs text-natural-muted mt-0.5">تبادل الأخبار، القرارات العائلية، والتنبيهات الهامة وتوثيق اجتماعات اللقاء المشترك.</p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-natural-moss text-white rounded-xl text-xs font-bold hover:bg-natural-moss-hover transition-colors flex items-center gap-1.5 shadow-sm border border-natural-moss self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Plus size={16} />
          <span>إضافة مستجد جديد</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-natural-cream border border-natural-border/60 rounded-xl max-w-md">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'all' ? 'bg-white text-natural-text shadow-sm' : 'text-natural-muted hover:text-natural-text'}`}
        >
          الكل ({notices.length})
        </button>
        <button
          onClick={() => setFilterType('announcement')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'announcement' ? 'bg-white text-natural-bronze shadow-sm' : 'text-natural-muted hover:text-natural-bronze'}`}
        >
          إعلانات
        </button>
        <button
          onClick={() => setFilterType('decision')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'decision' ? 'bg-white text-natural-moss shadow-sm' : 'text-natural-muted hover:text-natural-moss'}`}
        >
          قرارات
        </button>
        <button
          onClick={() => setFilterType('note')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'note' ? 'bg-white text-natural-text shadow-sm' : 'text-natural-muted hover:text-natural-text'}`}
        >
          تنبيهات
        </button>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotices.map((n) => {
          const badge = getNoticeBadge(n.type);
          return (
            <div 
              key={n.id} 
              className="bg-white rounded-2xl border border-natural-border p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                {/* Notice Badge Header */}
                <div className="flex items-center justify-between mb-3.5 border-b border-natural-cream pb-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bgColor} ${badge.textColor}`}>
                    {badge.icon}
                    {badge.label}
                  </span>

                  <button
                    onClick={() => onDeleteNotice(n.id)}
                    className="p-1 text-natural-muted hover:text-red-500 rounded-lg hover:bg-natural-cream transition-colors cursor-pointer"
                    title="حذف المستجد"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 className="text-base font-serif font-semibold text-natural-text mb-2 leading-snug">{n.title}</h3>
                <p className="text-xs text-natural-text leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>

              {/* Author Footer */}
              <div className="mt-5 pt-3.5 border-t border-natural-border/50 flex items-center justify-between text-natural-muted text-[11px] font-medium font-sans">
                <span className="bg-natural-cream border border-natural-border/40 px-2 py-0.5 rounded text-natural-text font-bold">المسؤول: {n.author}</span>
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Calendar size={12} className="text-natural-bronze" />
                  {n.date}
                </span>
              </div>

            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-natural-border">
            <MessageSquare size={36} className="mx-auto text-natural-muted mb-2" />
            <p className="text-sm font-semibold text-natural-muted">لا توجد إشعارات أو مستجدات مخصصة تندرج تحت هذا الفلتر حالياً.</p>
          </div>
        )}
      </div>

      {/* Adding Notice Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-natural-border">
            <div className="flex items-center justify-between p-5 border-b border-natural-border bg-natural-cream">
              <h3 className="text-base font-serif font-bold text-natural-text">إرسال مستجد أو قرار لمجلس العائلة</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-1 text-natural-muted hover:text-natural-text rounded-lg hover:bg-natural-border/40 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorNotice && (
                <div className="p-2.5 bg-red-50 text-red-750 border border-red-105 rounded-xl text-xs font-semibold">
                  {errorNotice}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-natural-text mb-1">عنوان التنبيه أو القرار *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="تبديل الخزان، اجتماع الجمعة القادم..."
                  className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs text-natural-text"
                />
              </div>

              {/* Notice Type & Author */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-natural-text mb-1">نوع المستجد</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs text-natural-text font-semibold"
                  >
                    <option value="announcement">إعلان عاجل</option>
                    <option value="decision">قرار العائلة</option>
                    <option value="note">تنبيه بسيط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text mb-1">صاحب القرار</label>
                  <select
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs text-natural-text font-semibold"
                  >
                    {members.length > 0 ? (
                      members.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    ) : (
                      <option value="لم يحدد بعد">لم يحدد بعد (أضف أفراد العائلة)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-natural-text mb-1">تفاصيل ومحتوى الإقرار *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب التوجيهات أو التنبيه التفصيلي لأفراد العائلة هنا بوضوح وسرعة..."
                  rows={4}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs text-natural-text"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-natural-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-natural-muted bg-white border border-natural-border rounded-lg hover:bg-natural-cream cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-natural-bronze hover:bg-natural-bronze-hover border border-natural-bronze rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Send size={12} />
                  <span>نشر الإعلان</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
