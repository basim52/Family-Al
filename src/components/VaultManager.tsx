import React, { useRef, useState } from 'react';
import { VaultTransaction, Project, VaultTransactionType } from '../types';
import { toPng } from 'html-to-image';
import { 
  X, 
  Download, 
  Plus, 
  Trash2, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Search, 
  BadgeCheck, 
  Calendar, 
  User, 
  CheckCircle,
  HelpCircle,
  History,
  Coins
} from 'lucide-react';

interface VaultManagerProps {
  transactions: VaultTransaction[];
  members: string[];
  projects: Project[];
  onAddTransaction: (txData: Omit<VaultTransaction, 'id' | 'voucherNumber'>) => Promise<void>;
  onDeleteTransaction: (txId: string) => Promise<void>;
}

export default function VaultManager({
  transactions,
  members,
  projects,
  onAddTransaction,
  onDeleteTransaction,
}: VaultManagerProps) {
  // Filters state
  const [filterType, setFilterType] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [txType, setTxType] = useState<VaultTransactionType>('deposit');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [customMember, setCustomMember] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Submit loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Voucher view modal states
  const [activeVoucher, setActiveVoucher] = useState<VaultTransaction | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

  // Ref for the paper item to export
  const voucherPaperRef = useRef<HTMLDivElement>(null);

  // Math totals
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpend = transactions
    .filter(t => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayments = transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = totalDeposits - totalSpend - totalPayments;

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setSubmitError('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    const finalMember = selectedMember === 'custom' || !selectedMember ? customMember : selectedMember;
    if (!finalMember.trim()) {
      setSubmitError('الرجاء تحديد أو كتابة اسم صاحب العملية من أفراد العائلة.');
      return;
    }

    if (!description.trim()) {
      setSubmitError('الرجاء تقديم وصف مختصر لغرض ودواعي السند.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        type: txType,
        amount: numericAmount,
        member: finalMember.trim(),
        description: description.trim(),
        date: txDate || new Date().toISOString().split('T')[0],
        projectId: selectedProjectId || undefined,
      });

      setSubmitSuccess('تم تسجيل السند الجديد وإضافته للخزنة بنجاح!');
      
      // Reset form fields
      setAmount('');
      setDescription('');
      setSelectedProjectId('');
      setCustomMember('');
      setSelectedMember('');
      
      setTimeout(() => {
        setSubmitSuccess('');
        setShowAddForm(false);
      }, 1500);
    } catch (err: any) {
      console.error('Submit transaction error:', err);
      setSubmitError('حدث خطأ أثناء حفظ السند. الرجاء المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert numbers to beautiful Arabic formal letter writing (Tafqeet)
  const tafqeetArabicText = (val: number) => {
    const formatted = val.toLocaleString('ar-SA');
    return `مبلغ وقدره ${formatted} ريال سعودي لا غير`;
  };

  // Delete transaction with safety prompt
  const handleDeleteTx = async (txId: string, voucherNum: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف وإلغاء السند رقم ${voucherNum} بشكل نهائي من السجلات؟`)) {
      try {
        await onDeleteTransaction(txId);
      } catch (err) {
        console.error('Delete tx error:', err);
      }
    }
  };

  // Export voucher paper to high-resolution PNG image
  const handleExportVoucherImage = async () => {
    if (!voucherPaperRef.current || !activeVoucher) return;
    setIsGeneratingImage(true);
    setExportError('');
    setExportSuccess('');

    try {
      // Small timeout for paint thread
      await new Promise(resolve => setTimeout(resolve, 400));

      const dataUrl = await toPng(voucherPaperRef.current, {
        cacheBust: true,
        quality: 0.99,
        pixelRatio: 2.5, // High PPI presentation
        backgroundColor: '#fdfbf7', // Force solid background color to prevent black background transparency bugs on WhatsApp
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      const fileName = `سند_${activeVoucher.type === 'deposit' ? 'إيداع' : activeVoucher.type === 'spend' ? 'صرف' : 'دفع'}_${activeVoucher.voucherNumber}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setExportSuccess('تم تصدير وحفظ صورة السند بنجاح على جهازك!');
      setTimeout(() => setExportSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error generating voucher PNG:', err);
      setExportError('عذراء، لم نتمكن من تنزيل السند كصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesMember = !searchMember || t.member === searchMember;
    
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      t.description.toLowerCase().includes(query) || 
      t.voucherNumber.toLowerCase().includes(query) || 
      t.member.toLowerCase().includes(query) ||
      (t.projectId && projects.find(p => p.id === t.projectId)?.title.toLowerCase().includes(query));

    return matchesType && matchesMember && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl" id="vault-manager-panel">
      {/* 1. Header Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Main Bank Vault balance display with royal natural palette */}
        <div className="md:col-span-2 bg-gradient-to-br from-natural-moss to-natural-text text-white p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-stone-800">
          <div className="absolute left-[-10px] top-[-10px] opacity-10">
            <Coins size={140} className="rotate-12" />
          </div>
          <div className="z-10">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/15 rounded-lg">
                <Coins size={16} className="text-amber-300" />
              </span>
              <h3 className="text-xs font-bold tracking-wider uppercase opacity-85">رصيد خزانة الاحتياطي العائلي</h3>
            </div>
            <p className="text-3xl font-serif font-black tracking-tight mt-3 text-amber-200">
              {availableBalance.toLocaleString()} <span className="text-sm font-normal text-white/80">ر.س</span>
            </p>
          </div>
          <p className="text-[10px] text-white/60 tracking-wide font-mono mt-3 z-10">
            رصيد الخزانة الجاري = الإيداعات - (الصرف + الدفع)
          </p>
        </div>

        {/* Total Deposits display */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border/70 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-natural-muted font-bold">إجمالي الإيداعات والمساهمات</span>
            <span className="p-1.5 bg-green-50 text-green-700 rounded-xl">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-serif font-black text-green-700">
              +{totalDeposits.toLocaleString()} <span className="text-xs font-sans font-normal text-natural-muted">ر.س</span>
            </p>
            <span className="text-[10px] text-natural-muted block mt-1 font-mono">
              عبر {transactions.filter(t => t.type === 'deposit').length} سندات إيداع
            </span>
          </div>
        </div>

        {/* Total Payments & Spends display */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border/70 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-natural-muted font-bold">إجمالي الصرف والمدفوعات</span>
            <span className="p-1.5 bg-red-50 text-red-700 rounded-xl">
              <TrendingDown size={14} />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-serif font-black text-amber-800">
              -{(totalSpend + totalPayments).toLocaleString()} <span className="text-xs font-sans font-normal text-natural-muted">ر.س</span>
            </p>
            <span className="text-[10px] text-natural-muted block mt-1 font-mono">
              صرف: {totalSpend.toLocaleString()} ر.س | دفع: {totalPayments.toLocaleString()} ر.س
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls and Addition Trigger Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-natural-cream/60 p-4 rounded-2xl border border-natural-border/40">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          
          {/* Quick type filter */}
          <div className="flex bg-white border border-natural-border rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-natural-moss text-white'
                  : 'text-natural-muted hover:text-natural-text'
              }`}
            >
              الجميع
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'deposit'
                  ? 'bg-green-600 text-white'
                  : 'text-natural-muted hover:text-green-700'
              }`}
            >
              سندات الإيداع
            </button>
            <button
              onClick={() => setFilterType('spend')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'spend'
                  ? 'bg-amber-700 text-white'
                  : 'text-natural-muted hover:text-amber-800'
              }`}
            >
              سندات الصرف
            </button>
            <button
              onClick={() => setFilterType('payment')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'payment'
                  ? 'bg-blue-600 text-white'
                  : 'text-natural-muted hover:text-blue-700'
              }`}
            >
              سندات الدفع
            </button>
          </div>

          {/* Member Filter Dropdown */}
          <div className="relative">
            <select
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="appearance-none bg-white border border-natural-border rounded-xl px-3 py-2 pl-8 text-xs font-medium text-natural-text focus:outline-none focus:border-natural-moss shadow-2xs cursor-pointer min-w-[130px]"
            >
              <option value="">كل المستلمين والدافعين</option>
              {Array.from(new Set(transactions.map(t => t.member))).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <Filter size={11} className="absolute left-3 top-3.5 text-natural-muted pointer-events-none" />
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-60 min-w-[180px]">
            <input
              type="text"
              placeholder="ابحث برقم السند، الغرض أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-natural-border rounded-xl pr-8 pl-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-moss placeholder:text-natural-muted/70 shadow-2xs"
            />
            <Search size={12} className="absolute right-3 top-3.5 text-natural-muted" />
          </div>
        </div>

        {/* New Transaction form toggle */}
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setSubmitError('');
            setSubmitSuccess('');
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-natural-moss hover:bg-natural-moss-dark text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'إلغاء وإغلاق' : 'تسجيل وإصدار سند جديد'}</span>
        </button>
      </div>

      {/* 3. Dropdown / Animated Add Transaction Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-natural-moss/20 rounded-3xl p-6 shadow-md transition-all space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-natural-border/70">
            <div className="p-1 px-2.5 bg-natural-moss/10 text-natural-moss rounded-lg font-bold text-xs font-mono">جديد</div>
            <h4 className="text-sm font-bold text-natural-text">نموذج إصدار سند محاسبي للخزانة العائلية</h4>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl font-bold">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5">
              <CheckCircle size={14} />
              {submitSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-natural-muted block">نوع السند المالي الرسمي</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-stone-100 rounded-xl border border-natural-border">
                <button
                  type="button"
                  onClick={() => setTxType('deposit')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'deposit'
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'text-natural-muted hover:bg-white/50'
                  }`}
                >
                  سند إيداع
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('spend')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'spend'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'text-natural-muted hover:bg-white/50'
                  }`}
                >
                  سند صرف
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('payment')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'payment'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-natural-muted hover:bg-white/50'
                  }`}
                >
                  سند دفع
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-natural-muted block">مبلغ السند (بالريال السعودي)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-natural-border rounded-xl pr-3 pl-12 py-2 text-xs text-natural-text text-left font-serif font-bold focus:outline-none focus:border-natural-moss"
                  required
                />
                <span className="absolute left-3 top-2.5 text-[10px] font-bold text-natural-muted">ر.س</span>
              </div>
            </div>

            {/* Date input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-natural-muted block">التاريخ المعيد</label>
              <div className="relative">
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-stone-50 border border-natural-border rounded-xl pr-3 pl-8 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-moss cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Member list and Custom field */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-natural-muted block">رأس العملية / القائم بها من العائلة</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="bg-stone-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-moss cursor-pointer"
                >
                  <option value="">-- اختر من أفراد العائلة --</option>
                  {members.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="custom">اسم مخصص آخر...</option>
                </select>

                <input
                  type="text"
                  placeholder="اكتب الاسم المخصص في حال اخترته"
                  value={customMember}
                  onChange={(e) => setCustomMember(e.target.value)}
                  disabled={selectedMember !== 'custom'}
                  className={`bg-stone-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-moss ${
                    selectedMember !== 'custom' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Link to active projects optionally */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-natural-muted block">ربط بمشروع عائلي قائم (اختياري)</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-stone-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-moss cursor-pointer w-full"
              >
                <option value="">لا يوجد ارتباط بمشروع محدد</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Description detail */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[11px] font-bold text-natural-muted block">تفاصيل غرض وبيان السند الرسمي</label>
              <textarea
                rows={2}
                placeholder="أدخل مبرر الصرف / تفاصيل الدفع / غايات الإيداع في الصندوق..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-stone-50 border border-natural-border rounded-xl p-3 text-xs text-natural-text focus:outline-none focus:border-natural-moss placeholder:text-natural-muted/65"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-natural-border/40">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-bold border border-natural-border hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-natural-moss hover:bg-natural-moss-dark text-white rounded-xl transition-all cursor-pointer disabled:opacity-55 flex items-center gap-1.5"
            >
              {isSubmitting ? 'جاري قيد العملية...' : 'اعتماد السند وحفظه بالخزانة'}
            </button>
          </div>
        </form>
      )}

      {/* 4. Ledger Transaction History Timeline Table */}
      <div className="bg-white border border-natural-border rounded-3xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 bg-natural-cream/40 border-b border-natural-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-natural-moss/10 text-natural-moss rounded-lg font-bold text-xs">
              {filteredTransactions.length} سجل
            </span>
            <h3 className="text-xs font-bold text-natural-text tracking-wide uppercase">سجل القيود والدفاتر المالية بالبنك العائلي</h3>
          </div>
          <p className="text-[10px] text-natural-muted font-bold flex items-center gap-1">
            <History size={11} />
            الترتيب حَسَبَ أحدث السندات المعتمدة
          </p>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-natural-muted space-y-2">
            <div className="flex justify-center">
              <FileText size={38} className="text-natural-border/80" />
            </div>
            <p className="text-xs font-bold">لا يوجد أي سند متطابق مع عوامل التصفية الحالية.</p>
            <p className="text-[11px] opacity-75">انقر على زر "تسجيل وإصدار سند جديد" بالأعلى لتدوين أول سند مالي.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-natural-border text-natural-muted font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">نوع السند</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">العضو المعني</th>
                  <th className="py-3 px-4">البيان والتفاصيل</th>
                  <th className="py-3 px-4">المشروع المرتبط</th>
                  <th className="py-3 px-4 text-left">مبلغ السند</th>
                  <th className="py-3 px-4 text-center">الإجراءات والطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border/60">
                {filteredTransactions.map((tx) => {
                  const linkedProj = tx.projectId ? projects.find(p => p.id === tx.projectId) : null;
                  return (
                    <tr key={tx.id} className="hover:bg-amber-50/20 transition-all">
                      
                      {/* Voucher ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-natural-text">
                        {tx.voucherNumber}
                      </td>

                      {/* Voucher type label */}
                      <td className="py-3.5 px-4">
                        {tx.type === 'deposit' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-green-50 text-green-700 border border-green-150 rounded-lg">
                            <ArrowUpRight size={11} />
                            إيداع في الخزانة
                          </span>
                        )}
                        {tx.type === 'spend' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-150 rounded-lg">
                            <ArrowDownLeft size={11} />
                            سند صرف
                          </span>
                        )}
                        {tx.type === 'payment' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150 rounded-lg">
                            <FileText size={11} />
                            سند دفع
                          </span>
                        )}
                      </td>

                      {/* Voucher Date */}
                      <td className="py-3.5 px-4 text-natural-muted font-mono">
                        {tx.date}
                      </td>

                      {/* Voucher Owner */}
                      <td className="py-3.5 px-4 font-medium text-natural-text">
                        {tx.member}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-natural-muted max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </td>

                      {/* Linked project */}
                      <td className="py-3.5 px-4">
                        {linkedProj ? (
                          <span className="text-[10px] font-semibold bg-stone-100 border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                            {linkedProj.title}
                          </span>
                        ) : (
                          <span className="text-stone-300 font-mono">-</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-serif font-black text-left">
                        {tx.type === 'deposit' ? (
                          <span className="text-green-700">+{tx.amount.toLocaleString()} <span className="text-[10px] font-sans font-normal text-natural-muted text-left">ر.س</span></span>
                        ) : (
                          <span className="text-amber-800">-{tx.amount.toLocaleString()} <span className="text-[10px] font-sans font-normal text-natural-muted text-left">ر.س</span></span>
                        )}
                      </td>

                      {/* Printable slip view and deletion */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Formal print slip button */}
                          <button
                            onClick={() => {
                              setActiveVoucher(tx);
                              setExportError('');
                              setExportSuccess('');
                            }}
                            className="p-1.5 bg-white border border-natural-border/70 hover:bg-natural-moss/10 text-natural-moss rounded-lg transition-all flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                            title="معاينة السند وتصديره وحفظه كصورة رسمية مأمونة"
                          >
                            <FileText size={13} />
                            <span>عرض السند</span>
                          </button>

                          {/* Delete ledger entry */}
                          <button
                            onClick={() => handleDeleteTx(tx.id, tx.voucherNumber)}
                            className="p-1.5 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-lg transition-all border border-transparent hover:border-red-150 cursor-pointer"
                            title="حذف هذا السيد نهائياً من الصندوق"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. A4 Voucher Paper Presentation Modal Overlay */}
      {activeVoucher && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
          <div className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            
            {/* Modal top navigation bar utility */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-100 text-stone-800 rounded-lg font-bold text-[10px] font-mono">
                  {activeVoucher.voucherNumber}
                </span>
                <h3 className="text-xs font-bold text-stone-800">السند المحاسبي الرسمي المعتمد</h3>
              </div>
              <button
                onClick={() => setActiveVoucher(null)}
                className="p-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                إغلاق
              </button>
            </div>

            {/* Error notifications for export */}
            {exportError && (
              <div className="my-2 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
                {exportError}
              </div>
            )}
            {exportSuccess && (
              <div className="my-2 bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2 rounded-xl flex items-center gap-1">
                <CheckCircle size={13} />
                {exportSuccess}
              </div>
            )}

            {/* A4 PAPER SLIP SHEETS FOR CANVAS GENERATION */}
            <div className="flex-1 overflow-y-auto py-4 px-2">
              <div
                ref={voucherPaperRef}
                className="bg-[#fdfbf7] border-4 border-double border-stone-700 p-8 rounded-xs shadow-xs text-stone-900 leading-relaxed font-sans select-none relative overflow-hidden"
                style={{
                  minHeight: '480px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              >
                {/* Visual Watermark background circular stamps */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                  <Coins size={360} />
                </div>

                {/* Corner flourish borders */}
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-stone-700"></div>
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-stone-700"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-stone-700"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-stone-700"></div>

                {/* 1. Header segment */}
                <div className="flex justify-between items-start border-b-2 border-stone-700 pb-4 text-xs font-bold">
                  <div className="space-y-1">
                    <p className="text-sm font-black tracking-wide text-stone-800">بَيْت العَائِلَة الكَبِير</p>
                    <p className="text-[10px] text-stone-500 font-medium">الخزانة الاستراتيجية العائلية المشتركة</p>
                    <p className="text-[9px] text-stone-550 font-medium">برمجة وفكرة: باسم آل خليل</p>
                  </div>
                  <div className="text-center bg-stone-100 border border-stone-300 p-2 rounded-xl min-w-[120px] font-mono shadow-2xs">
                    <p className="text-[9px] text-stone-400">رقم السند المالي</p>
                    <p className="text-sm font-bold text-stone-800">{activeVoucher.voucherNumber}</p>
                  </div>
                </div>

                {/* 2. Central Document Title */}
                <div className="text-center my-6 space-y-1">
                  <h2 className="text-xl font-black tracking-widest text-stone-800 border-b border-stone-400 pb-1.5 inline-block px-12 uppercase">
                    {activeVoucher.type === 'deposit' && 'سَنَد إِيدَاع نَقْدِي'}
                    {activeVoucher.type === 'spend' && 'سَنَد صَرْف نَقْدِي'}
                    {activeVoucher.type === 'payment' && 'سَنَد دَفْع رَسْمِي'}
                  </h2>
                  <p className="text-[10px] text-stone-500 tracking-wide font-mono font-bold">التاريخ: {activeVoucher.date}</p>
                </div>

                {/* 3. Voucher Core content table */}
                <div className="space-y-4 border-b border-stone-300 pb-6 text-xs text-stone-800">
                  
                  {/* Participant Name row */}
                  <div className="flex border-b border-stone-200 py-2.5">
                    <span className="w-24 font-bold text-stone-500">مُوجّه إلَى / من:</span>
                    <span className="flex-1 font-black text-amber-950 font-serif text-sm">
                      {activeVoucher.member}
                    </span>
                  </div>

                  {/* Absolute numerical and text amount row */}
                  <div className="flex border-b border-stone-200 py-2.5 items-baseline">
                    <span className="w-24 font-bold text-stone-500">القيمة والرمز:</span>
                    <div className="flex-1 flex flex-wrap gap-2 items-baseline">
                      <span className="font-serif font-black text-lg text-stone-900 border-b border-stone-700 px-2 bg-stone-100 rounded-sm">
                        {activeVoucher.amount.toLocaleString()} ر.س
                      </span>
                      <span className="text-[11px] text-stone-500 font-bold font-serif whitespace-nowrap">
                        ({tafqeetArabicText(activeVoucher.amount)})
                      </span>
                    </div>
                  </div>

                  {/* Description detail block */}
                  <div className="flex border-b border-stone-200 py-2.5">
                    <span className="w-24 font-bold text-stone-500">غرض وبيان:</span>
                    <span className="flex-1 font-medium text-stone-750 font-sans leading-relaxed">
                      {activeVoucher.description}
                    </span>
                  </div>

                  {/* Optional Linked Project details */}
                  {activeVoucher.projectId && (
                    <div className="flex border-b border-stone-200 py-2.5">
                      <span className="w-24 font-bold text-stone-500">مشروع مرتبط:</span>
                      <span className="flex-1 font-semibold text-natural-moss font-sans">
                        {projects.find(p => p.id === activeVoucher.projectId)?.title || activeVoucher.projectId}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Signature Block with circular decorative Stamp */}
                <div className="grid grid-cols-3 gap-4 pt-6 text-[10px] text-stone-600 font-bold relative min-h-[100px]">
                  
                  {/* Certified circular Circular Seal Stamp */}
                  <div className="absolute left-[20%] top-[10px] pointer-events-none transform -rotate-12 select-none">
                    <div className="w-24 h-24 rounded-full border-4 border-green-700/35 flex flex-col items-center justify-center p-1 text-center scale-95">
                      <div className="w-20 h-20 rounded-full border border-dashed border-green-750/35 flex flex-col items-center justify-center leading-none">
                        <span className="text-[7px] font-black tracking-widest text-green-700/40">خزانة العائلة</span>
                        <BadgeCheck size={20} className="text-green-700/40 my-1" />
                        <span className="text-[8px] font-extrabold text-green-700/45">مُصادق ومطابقُ</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="border-b border-stone-300 pb-1 font-bold text-stone-500 uppercase">مُستلم السند</p>
                    <p className="font-serif italic font-bold text-stone-900 pt-1">
                      {activeVoucher.type === 'deposit' ? 'الخزانة العائلية' : activeVoucher.member}
                    </p>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="border-b border-stone-300 pb-1 font-bold text-stone-500 uppercase">منسق الجمع العائلي</p>
                    <p className="font-serif italic font-bold text-stone-900 pt-1">باسم (المنسق)</p>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="border-b border-stone-300 pb-1 font-bold text-stone-500 uppercase">أمين الصندوق العائلي</p>
                    <p className="font-serif italic font-bold text-stone-900 pt-1">الوالد (الوصي)</p>
                  </div>
                </div>

                {/* 5. Footer stamp indicator */}
                <p className="text-[8px] text-center text-stone-400 font-mono tracking-wider pt-8 mt-4 border-t border-dashed border-stone-300 uppercase">
                  توليد إلكتروني مأمون حَسَبَ الدليل الاسترشادي للصندوق العائلي • رمز التحقق الفني {activeVoucher.id.substring(0,8)}
                </p>
              </div>
            </div>

            {/* Downloader tools button */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setActiveVoucher(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                الخروج والمعاودة
              </button>
              <button
                type="button"
                onClick={handleExportVoucherImage}
                disabled={isGeneratingImage}
                className="w-full py-2.5 bg-natural-moss hover:bg-natural-moss-dark text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                <span>{isGeneratingImage ? 'جاري تحضير وتصدير الصورة...' : 'حفظ كصورة (PNG)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
