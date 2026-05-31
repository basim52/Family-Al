import React, { useState, useEffect } from 'react';
import { Project, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Search, PiggyBank, Receipt, Users, Plus, Calendar, CreditCard, Trash2, X } from 'lucide-react';

interface ExpensesChartProps {
  projects: Project[];
  expenses: Expense[];
  members: string[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpensesChart({ projects, expenses, members, onAddExpense, onDeleteExpense }: ExpensesChartProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [errorString, setErrorString] = useState('');

  // Settle default paidBy
  useEffect(() => {
    if (members?.length > 0 && !paidBy) {
      setPaidBy(members[0]);
    }
  }, [members, paidBy]);

  // 1. Calculations
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const remainingBudget = totalBudget - totalSpent;

  // Compute expenses by member
  const memberSpendingMap: { [key: string]: number } = {};
  expenses.forEach(e => {
    memberSpendingMap[e.paidBy] = (memberSpendingMap[e.paidBy] || 0) + e.amount;
  });

  // Combined official dynamic members and actual historical spending contributors
  const allContributingMembers = Array.from(new Set([
    ...members,
    ...expenses.map(e => e.paidBy)
  ])).filter(Boolean);

  // 2. Prepare chart data (Compare Budget vs Spent for active/planning projects)
  const chartData = projects.map(p => {
    // calculate spent on this project specifically
    const projectSpent = expenses.filter(e => e.projectId === p.id).reduce((acc, e) => acc + e.amount, 0);
    return {
      name: p.title.length > 18 ? p.title.substring(0, 16) + '...' : p.title,
      'الميزانية': p.budget,
      'المنفق': projectSpent
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setErrorString('الرجاء اختيار المشروع المرتبط بالدفعة.');
      return;
    }
    if (!description.trim()) {
      setErrorString('الرجاء كتابة تفاصيل ووصف المصروف.');
      return;
    }
    const amountVal = Number(amountStr);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorString('يرجى كتابة مبلغ مصروف صحيح أكبر من الصفر.');
      return;
    }

    onAddExpense({
      projectId,
      description: description.trim(),
      amount: amountVal,
      paidBy,
      date,
    });

    setDescription('');
    setAmountStr('');
    setIsAdding(false);
    setErrorString('');
  };

  const getProjectTitle = (id: string) => {
    return projects.find(p => p.id === id)?.title || 'مشروع محذوف';
  };

  const filteredExpenses = expenses.filter(e => {
    if (expenseFilter === 'all') return true;
    return e.projectId === expenseFilter;
  });

  return (
    <div className="space-y-6 text-natural-text">
      
      {/* 1. Account Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Budget Card */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-muted text-xs font-semibold">إجمالي الميزانيات المخصصة</p>
            <h3 className="text-2xl font-serif font-bold text-natural-text tracking-tight">{totalBudget.toLocaleString()} <span className="text-xs font-normal text-natural-muted">ر.س</span></h3>
          </div>
          <div className="p-3 bg-natural-moss-light rounded-xl text-natural-moss shrink-0 border border-natural-border/45">
            <PiggyBank size={24} />
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-muted text-xs font-semibold">إجمالي نقود الصرف الفعلية</p>
            <h3 className="text-2xl font-serif font-bold text-natural-text tracking-tight">{totalSpent.toLocaleString()} <span className="text-xs font-normal text-natural-muted">ر.س</span></h3>
            <span className="text-[10px] text-natural-moss font-semibold bg-natural-moss-light px-1.5 py-0.5 rounded border border-natural-border/30">
              {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% من الميزانية` : '0%'}
            </span>
          </div>
          <div className="p-3 bg-natural-bronze-light rounded-xl text-natural-bronze shrink-0 border border-natural-border/45">
            <Receipt size={24} />
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-muted text-xs font-semibold">الرصيد المتبقي الحر</p>
            <h3 className={`text-2xl font-serif font-bold tracking-tight ${remainingBudget >= 0 ? 'text-natural-moss' : 'text-natural-bronze'}`}>
              {remainingBudget.toLocaleString()} <span className="text-xs font-normal text-natural-muted">ر.س</span>
            </h3>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${remainingBudget >= 0 ? 'bg-natural-moss-light text-natural-moss border-natural-moss/20' : 'bg-natural-bronze-light text-natural-bronze border-natural-bronze/20'}`}>
              {remainingBudget >= 0 ? 'ميزانية مستقرة وكافية' : 'تجاوز في نفقات المشاريع'}
            </span>
          </div>
          <div className="p-3 bg-natural-moss-light rounded-xl text-natural-moss shrink-0 border border-natural-border/45">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* 2. Visual Chart and Member Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-serif font-bold text-natural-text">تحليل رصيد وميزانية مشاريع بيت العائلة</h3>
          <div className="w-full h-72 text-xs">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4D9" />
                  <XAxis dataKey="name" stroke="#8E8E82" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8E8E82" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #E8E4D9', fontSize: '11px', backgroundColor: '#ffffff' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                  <Bar dataKey="الميزانية" fill="#5A5A40" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المنفق" fill="#A67C52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-natural-muted">لا توجد مشاريع مقارنة مسجلة حالياً.</div>
            )}
          </div>
        </div>

        {/* Member Contributions */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-natural-text">إسهامات الأعضاء النقدية</h3>
            <p className="text-[11px] text-natural-muted mt-0.5">من قام بدفع الفواتير وسداد مستلزمات البيت مسبقاً:</p>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {allContributingMembers.map(member => {
              const memberSpent = memberSpendingMap[member] || 0;
              const percent = totalSpent > 0 ? Math.round((memberSpent / totalSpent) * 100) : 0;
              
              return (
                <div key={member} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-natural-text">{member}</span>
                    <span className="text-natural-text">{memberSpent.toLocaleString()} ريال ({percent}%)</span>
                  </div>
                  <div className="w-full bg-natural-cream h-2 rounded-full overflow-hidden border border-natural-border/30">
                    <div 
                      className="bg-natural-moss h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-natural-muted border-t border-natural-border/65 pt-2.5">
            ملاحظة: تساعد هذه المساهمات في تسوية الحسابات الشهرية المشتركة للعائلة.
          </p>
        </div>

      </div>

      {/* 3. Detailed Expense Table */}
      <div className="bg-white rounded-2xl border border-natural-border shadow-sm overflow-hidden space-y-4 p-5">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-natural-border/60">
          <div>
            <h3 className="text-sm font-serif font-bold text-natural-text">قائمة فواتير ومصروفات البيت المسجلة</h3>
            <p className="text-xs text-natural-muted mt-0.5">إجمالي الفواتير الصادرة المرتبطة بكل عمل عائلي.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-natural-muted">تصفية حسب المشروع:</span>
              <select
                value={expenseFilter}
                onChange={(e) => setExpenseFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-natural-cream border border-natural-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-natural-moss text-natural-text"
              >
                <option value="all">كل مشاريع البيت</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Add Expense Button */}
            <button
              onClick={() => setIsAdding(true)}
              className="px-3.5 py-1.5 bg-natural-bronze text-white rounded-xl text-xs font-bold hover:bg-natural-bronze-hover transition-colors flex items-center gap-1 shadow-sm border border-natural-bronze"
            >
              <Plus size={14} />
              <span>إضافة فاتورة صرف</span>
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-natural-cream/60 border-b border-natural-border text-natural-muted font-bold">
                <th className="py-2.5 px-3">تفاصيل المصروف</th>
                <th className="py-2.5 px-3">المشروع ذو الصلة</th>
                <th className="py-2.5 px-3">من قام بالدفع</th>
                <th className="py-2.5 px-3">تاريخ الدفع</th>
                <th className="py-2.5 px-3">المبلغ الفعلي</th>
                <th className="py-2.5 px-3 text-center">أدوات</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="border-b border-natural-border/50 hover:bg-natural-cream/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-natural-text">{e.description}</td>
                  <td className="py-3 px-3 text-natural-muted">{getProjectTitle(e.projectId)}</td>
                  <td className="py-3 px-3 font-medium text-natural-text">
                    <span className="bg-natural-moss-light text-natural-moss border border-natural-moss/10 px-2.5 py-1 rounded text-[11px] font-bold">
                      {e.paidBy}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-natural-muted font-mono text-[11px]">{e.date}</td>
                  <td className="py-3 px-3 font-semibold text-natural-text text-sm font-mono">
                    {e.amount.toLocaleString()} ريال
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onDeleteExpense(e.id)}
                      className="p-1 text-natural-muted hover:text-red-500 hover:bg-natural-cream rounded-lg transition-colors"
                      title="حذف المصروف"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-natural-muted font-semibold border-none">
                    لا يوجد فواتير صرف مسجلة تندرج تحت الفلتر الحالي.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Adding Expense Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-natural-border">
            <div className="flex items-center justify-between p-5 border-b border-natural-border bg-natural-cream">
              <h3 className="text-base font-serif font-bold text-natural-text">تسجيل فاتورة صرف جديدة</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-1 text-natural-muted hover:text-natural-text rounded-lg hover:bg-natural-border/40 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorString && (
                <div className="p-2.5 bg-red-50 text-red-750 border border-red-105 rounded-xl text-xs font-semibold">
                  {errorString}
                </div>
              )}

              {/* Related Project */}
              <div>
                <label className="block text-xs font-bold text-natural-text mb-1">المشروع ذو الصلة *</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs"
                >
                  <option value="" disabled>اختر المشروع من القائمة...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-natural-text mb-1">بيان وتفاصيل رصيد الصرف *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: شراء كشافات سقف، ثمن لفائف العازل..."
                  className="w-full px-3 py-2 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs"
                />
              </div>

              {/* Amount & Date & Paid By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-natural-text mb-1">المبلغ المصروف *</label>
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="مثال: 450"
                    className="w-full px-3 py-1.5 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text mb-1">تاريخ الفاتورة</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss text-xs"
                  />
                </div>
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-xs font-bold text-natural-text mb-1">العضو الكفيل بالدفع</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-natural-border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-moss bg-white text-xs"
                >
                  {members.length > 0 ? (
                    members.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))
                  ) : (
                    <option value="غير محدد">غير محدد (أضف أفراد العائلة أولاً)</option>
                  )}
                </select>
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-natural-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-natural-muted bg-white border border-natural-border rounded-lg hover:bg-natural-cream"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-natural-bronze hover:bg-natural-bronze-hover rounded-lg flex items-center gap-1 border border-natural-bronze shadow-sm"
                >
                  <span>تسجيل المصروف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
