import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Plus, Sparkles, AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';

interface MembersManagerProps {
  members: string[];
  onAddMember: (name: string) => void;
  onRemoveMember: (name: string) => void;
  onLoadSampleMembers: () => void;
}

export default function MembersManager({
  members,
  onAddMember,
  onRemoveMember,
  onLoadSampleMembers,
}: MembersManagerProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMemberName.trim();
    
    if (!cleanName) {
      setErrorMsg('فضلاً، اكتب اسم فرد العائلة أولاً لتتمكن من إضافته.');
      setSuccessMsg('');
      return;
    }
    
    if (members.includes(cleanName)) {
      setErrorMsg(`الاسم "${cleanName}" مسجّل وموجود مسبقاً في قائمة أفراد العائلة.`);
      setSuccessMsg('');
      return;
    }

    onAddMember(cleanName);
    setNewMemberName('');
    setErrorMsg('');
    setSuccessMsg(`تمت إضافة "${cleanName}" بنجاح إلى قائمة العائلة.`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const handleDelete = (name: string) => {
    if (confirm(`هل أنت متأكد من حذف العضو "${name}" من قائمة العائلة؟\nملاحظة: هذا لن يحذف المساهمات المكتوبة باسمه مسبقاً حفاظاً على توازن المالية والمهام.`)) {
      onRemoveMember(name);
      setSuccessMsg(`تم حذف "${name}" من القائمة.`);
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Title & Introduction Bar */}
      <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2 text-natural-moss">
            <Users size={20} className="stroke-[2.5]" />
            <h2 className="text-lg font-serif font-bold text-natural-text">إدارة أفراد العائلة</h2>
          </div>
          <p className="text-xs text-natural-muted leading-relaxed">
            التحكم في أعضاء بيت العائلة وتخصيصهم لتكليفات الصيانة، تسجيل الصرف المالي، وتحديد كتاب التنبيهات في لوحة المجلس.
          </p>
        </div>
        
        {members.length === 0 && (
          <button
            type="button"
            onClick={onLoadSampleMembers}
            className="px-4 py-2 bg-natural-moss-light text-natural-moss hover:bg-natural-border/40 border border-natural-border/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-stretch md:self-auto justify-center"
          >
            <RefreshCw size={13} className="animate-spin-slow" />
            <span>استعادة الأسماء النموذجية الافتراضية</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RIGHT COLUMN: Add new member Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm space-y-4">
            <div className="border-b border-natural-border/60 pb-3">
              <h3 className="text-xs font-bold text-natural-text uppercase tracking-wider flex items-center gap-2">
                <UserPlus size={15} className="text-natural-moss" />
                <span>إضافة عضو جديد للعائلة</span>
              </h3>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-natural-muted mb-1">اسم العضو بالكامل أو الصفة</label>
                <input
                  type="text"
                  placeholder="مثال: باسم (المنسق)، الوالدة، أبو فهد..."
                  value={newMemberName}
                  onChange={(e) => {
                    setNewMemberName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-natural-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text placeholder-natural-muted/65 font-semibold text-right"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[10px] sm:text-xs flex items-center gap-1.5 text-right leading-none font-semibold">
                  <AlertCircle size={13} className="shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-[10px] sm:text-xs flex items-center gap-1.5 text-right leading-none font-semibold">
                  <CheckCircle size={13} className="shrink-0 text-green-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-natural-moss hover:bg-natural-moss-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Plus size={14} />
                <span>إدراج في لوحة العائلة</span>
              </button>
            </form>
          </div>

          {/* Quick Info Box */}
          <div className="bg-natural-cream/65 p-4 rounded-xl border border-natural-border/50 text-right space-y-2">
            <h4 className="text-[11px] font-bold text-natural-text flex items-center gap-1.5">
              <Info size={13} className="text-natural-bronze" />
              إرشادات الاستخدام:
            </h4>
            <ul className="text-[10px] text-natural-muted list-disc pr-4 space-y-1.5 leading-relaxed">
              <li>الأسماء المضافة هنا ستظهر مباشرة في خيارات تكليف المهام وصرف الفواتير وصياغة الإعلانات.</li>
              <li>عند تصفير كل البيانات من الهيدر العلوي، يتم تلقائياً تصفير قائمة الأسماء أيضاً للبدء الكامل من الصفر.</li>
              <li>يمكنك استخدام التسميات التي توضح المنصب (مثل: "الوالد (المالك)" أو "الوالدة (أم باسم)") لتسهيل المتابعة على بقية أفراد العائلة.</li>
            </ul>
          </div>
        </div>

        {/* LEFT COLUMN: List current members */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-natural-border/60 pb-3">
              <h3 className="text-xs font-bold text-natural-text uppercase tracking-wider flex items-center gap-2">
                <Users size={15} className="text-natural-moss" />
                <span>قائمة المسجلين بلوحة البيت</span>
              </h3>
              <span className="text-[10px] text-natural-muted font-mono tracking-widest bg-natural-cream px-2 py-0.5 rounded-lg border border-natural-border/60">
                العدد الكلي: {members.length}
              </span>
            </div>

            {members.length === 0 ? (
              <div className="py-12 px-4 rounded-xl border border-dashed border-natural-border/80 text-center bg-natural-cream/15 max-w-lg mx-auto space-y-4">
                <Users size={40} className="mx-auto text-natural-muted/40" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-natural-text">جميع الأسماء فارغة حالياً</h4>
                  <p className="text-[10px] text-natural-muted leading-relaxed max-w-xs mx-auto">
                    لقد قمت بإزالة الأسماء السابقة بنجاح. يرجى البدء في إدراج أفراد عائلتك الحقيقيين الآن عبر الصندوق الجانبي لتعمير لوحتكم الخاصة!
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={onLoadSampleMembers}
                  className="px-3.5 py-1.5 bg-white hover:bg-natural-cream text-natural-moss border border-natural-border rounded-xl text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-natural-bronze" />
                  <span>تعبئة سريعة بالأسماء التوضيحية للتجربة</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((member, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-natural-cream/30 hover:bg-natural-cream/65 border border-natural-border/80 rounded-xl transition-all group shadow-inner"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-natural-moss-light text-natural-moss font-serif font-black text-xs flex items-center justify-center border border-natural-moss/10 shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-natural-text">{member}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      className="p-1 px-1.5 bg-white border border-transparent rounded-lg text-neutral-400 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer shadow-xs md:opacity-0 group-hover:opacity-100"
                      title={`حذف ${member}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
