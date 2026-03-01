import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Plus,
  Search,
  Download,
  Menu,
  X,
  CreditCard,
  History,
  ReceiptText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardStats, Employee, InventoryItem, Transaction, Payroll, User, Invoice, InvoiceItem } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={() => {
      onClick();
      if (window.innerWidth < 1024) {
        // Close sidebar on mobile after selection
      }
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string, icon: any, color: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form states
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<Invoice | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('accounting_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, empRes, invRes, transRes, payRes, invsRes, usersRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/payroll').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);
      setStats(statsRes);
      setEmployees(empRes);
      setInventory(invRes);
      setTransactions(transRes);
      setPayroll(payRes);
      setInvoices(invsRes);
      setUsers(usersRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const formData = new FormData(e.currentTarget);
    const { username, password } = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('accounting_user', JSON.stringify(data.user));
        fetchData();
      } else {
        setLoginError(data.message || 'خطأ في تسجيل الدخول');
      }
    } catch (err) {
      setLoginError('حدث خطأ في الاتصال بالسيرفر');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('accounting_user');
    setActiveTab('dashboard');
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setShowModal(null);
      fetchData();
    } else {
      const error = await res.json();
      alert(error.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setShowModal(null);
    fetchData();
  };

  const handleAddInventory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setShowModal(null);
    fetchData();
  };

  const handleUpdateInvoiceStatus = async (id: number, status?: string, payment_method?: string) => {
    await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, payment_method })
    });
    setShowStatusModal(null);
    fetchData();
  };

  const handleAddPayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        employee_id: Number(data.employee_id),
        base_salary: Number(data.base_salary),
        deductions: Number(data.deductions),
        bonuses: Number(data.bonuses)
      })
    });
    setShowModal(null);
    fetchData();
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = invoice.items?.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.item_name}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${item.unit_price.toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${item.total.toLocaleString()} د.ع</td>
      </tr>
    `).join('') || '';

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة رقم ${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-between; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { color: #f97316; margin: 0; }
            .invoice-details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .total { text-align: left; font-size: 1.2em; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>الوتد</h1>
              <p>نظام إدارة المحاسبة والمخزون</p>
            </div>
            <div style="text-align: left;">
              <h2>${invoice.type === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء'}</h2>
              <p>رقم: ${invoice.invoice_number}</p>
              <p>التاريخ: ${invoice.date}</p>
            </div>
          </div>
          
          <div class="invoice-details">
            <p><strong>${invoice.type === 'sale' ? 'العميل' : 'المورد'}:</strong> ${invoice.customer_name}</p>
            <p><strong>طريقة الدفع:</strong> ${invoice.payment_method === 'cash' ? 'نقد' : 'آجل'}</p>
          </div>

          <table>
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">الصنف</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الكمية</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">سعر الوحدة</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total">
            الإجمالي الكلي: ${invoice.total_amount.toLocaleString()} د.ع
          </div>

          <div style="margin-top: 50px; text-align: center;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; background: #f97316; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: bold;">طباعة الفاتورة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintProfitLoss = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير الأرباح والخسائر</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .stat-box { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; }
            .total { font-size: 1.5em; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
            .income { color: #f97316; }
            .expense { color: #f43f5e; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير الأرباح والخسائر</h1>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-IQ')}</p>
          </div>
          <div class="stat-box">
            <span>إجمالي الإيرادات:</span>
            <span class="income">${totalIncome.toLocaleString()} د.ع</span>
          </div>
          <div class="stat-box">
            <span>إجمالي المصروفات:</span>
            <span class="expense">${totalExpense.toLocaleString()} د.ع</span>
          </div>
          <div class="stat-box total">
            <span>صافي الربح/الخسارة:</span>
            <span class="${netProfit >= 0 ? 'income' : 'expense'}">${netProfit.toLocaleString()} د.ع</span>
          </div>
          <div style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #f97316; color: white; border: none; border-radius: 8px; cursor: pointer;">طباعة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintInventoryReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = inventory.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.sku}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${item.unit_price.toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${(item.quantity * item.unit_price).toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير المخزون</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
            h1 { text-align: center; color: #f97316; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; border: 1px solid #ddd; padding: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>تقرير حالة المخزون</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-IQ')}</p>
          <table>
            <thead>
              <tr>
                <th style="text-align: right;">اسم الصنف</th>
                <th style="text-align: center;">SKU</th>
                <th style="text-align: center;">الكمية المتوفرة</th>
                <th style="text-align: left;">سعر الوحدة</th>
                <th style="text-align: left;">القيمة الإجمالية</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #f97316; color: white; border: none; border-radius: 8px; cursor: pointer;">طباعة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintPayrollReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const payrollHtml = payroll.map(p => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.employee_name}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.month}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${p.base_salary.toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${p.bonuses.toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${p.deductions.toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left;">${p.net_salary.toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير الرواتب</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
            h1 { text-align: center; color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; border: 1px solid #ddd; padding: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>تقرير كشف الرواتب</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-IQ')}</p>
          <table>
            <thead>
              <tr>
                <th style="text-align: right;">اسم الموظف</th>
                <th style="text-align: center;">الشهر</th>
                <th style="text-align: left;">الراتب الأساسي</th>
                <th style="text-align: left;">المكافآت</th>
                <th style="text-align: left;">الاستقطاعات</th>
                <th style="text-align: left;">صافي الراتب</th>
              </tr>
            </thead>
            <tbody>
              ${payrollHtml}
            </tbody>
          </table>
          <div style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">طباعة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintTransactions = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const transactionsHtml = transactions.map(t => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t.date}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t.description}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t.category}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t.amount.toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${t.type === 'income' ? '#f97316' : '#f43f5e'};">
          ${t.type === 'income' ? 'دخل' : 'مصروف'}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>كشف العمليات المالية</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
            h1 { text-align: center; color: #f97316; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; border: 1px solid #ddd; padding: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>كشف العمليات المالية - الوتد</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-IQ')}</p>
          <table>
            <thead>
              <tr>
                <th style="text-align: right;">التاريخ</th>
                <th style="text-align: right;">الوصف</th>
                <th style="text-align: right;">الفئة</th>
                <th style="text-align: left;">المبلغ</th>
                <th style="text-align: center;">النوع</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsHtml}
            </tbody>
          </table>
          <div style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #f97316; color: white; border: none; border-radius: 8px; cursor: pointer;">طباعة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-200">
              <CreditCard size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">نظام الوتد للمحاسبة</h1>
            <p className="text-slate-500 mt-2">يرجى تسجيل الدخول للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">اسم المستخدم</label>
              <input 
                name="username" 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="أدخل كلمة المرور"
              />
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {loginError}
              </motion.div>
            )}

            <button 
              type="submit" 
              className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-[0.98]"
            >
              تسجيل الدخول
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 rtl relative overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 0, 
          opacity: isSidebarOpen ? 1 : 0,
          x: isSidebarOpen ? 0 : 280
        }}
        className={`bg-white border-l border-slate-200 flex flex-col overflow-hidden fixed lg:relative h-full z-50 lg:z-0 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white">
            <CreditCard size={24} />
          </div>
          <h1 className="text-xl font-bold text-orange-600">الوتد</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="لوحة التحكم" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="الموظفين والرواتب" 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')} 
          />
          <SidebarItem 
            icon={Package} 
            label="المخزون" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarItem 
            icon={ReceiptText} 
            label="الفواتير" 
            active={activeTab === 'invoices'} 
            onClick={() => setActiveTab('invoices')} 
          />
          <SidebarItem 
            icon={History} 
            label="العمليات المالية" 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="التقارير" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          {user.role === 'admin' && (
            <SidebarItem 
              icon={Settings} 
              label="إدارة المستخدمين" 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
              {user.full_name[0]}
            </div>
            <div>
              <p className="text-sm font-bold">{user.full_name}</p>
              <p className="text-xs text-slate-500">{user.role === 'admin' ? 'مدير النظام' : 'محاسب'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-base lg:text-lg font-bold truncate max-w-[150px] lg:max-w-none">
              {activeTab === 'dashboard' && 'لوحة التحكم'}
              {activeTab === 'employees' && 'إدارة الموظفين والرواتب'}
              {activeTab === 'inventory' && 'إدارة المخزون'}
              {activeTab === 'invoices' && 'إدارة الفواتير'}
              {activeTab === 'transactions' && 'العمليات المالية'}
              {activeTab === 'reports' && 'التقارير المالية'}
              {activeTab === 'users' && 'إدارة المستخدمين'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                className="bg-slate-50 border border-slate-200 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600 relative">
              <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
              <AlertCircle size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 lg:space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <StatCard 
                    title="إجمالي الدخل" 
                    value={`${stats?.totalIncome.toLocaleString()} د.ع`} 
                    icon={TrendingUp} 
                    color="bg-orange-500"
                    trend="+12%"
                  />
                  <StatCard 
                    title="إجمالي المصروفات" 
                    value={`${stats?.totalExpense.toLocaleString()} د.ع`} 
                    icon={TrendingDown} 
                    color="bg-rose-500"
                    trend="-5%"
                  />
                  <StatCard 
                    title="الموظفين النشطين" 
                    value={`${stats?.employeeCount}`} 
                    icon={Users} 
                    color="bg-orange-500"
                  />
                  <StatCard 
                    title="أصناف منخفضة المخزون" 
                    value={`${stats?.lowStockCount}`} 
                    icon={Package} 
                    color="bg-amber-500"
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-base lg:text-lg font-bold mb-6">تحليل الدخل والمصروفات (آخر 6 أشهر)</h3>
                    <div className="h-64 lg:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="income" name="الدخل" fill="#f97316" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="المصروفات" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-base lg:text-lg font-bold mb-6">التدفق النقدي</h3>
                    <div className="h-64 lg:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.monthlyData}>
                          <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="income" stroke="#f97316" fillOpacity={1} fill="url(#colorIncome)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 lg:p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-base lg:text-lg font-bold">آخر العمليات المالية</h3>
                    <button onClick={() => setActiveTab('transactions')} className="text-orange-600 text-sm font-bold hover:underline">عرض الكل</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-slate-50 text-slate-500 text-sm">
                        <tr>
                          <th className="px-6 py-4 font-medium">التاريخ</th>
                          <th className="px-6 py-4 font-medium">الوصف</th>
                          <th className="px-6 py-4 font-medium">الفئة</th>
                          <th className="px-6 py-4 font-medium">المبلغ</th>
                          <th className="px-6 py-4 font-medium">النوع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm">{t.date}</td>
                            <td className="px-6 py-4 text-sm font-medium">{t.description}</td>
                            <td className="px-6 py-4 text-sm">{t.category}</td>
                            <td className="px-6 py-4 text-sm font-bold">{t.amount.toLocaleString()} د.ع</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {t.type === 'income' ? 'دخل' : 'مصروف'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'employees' && (
              <motion.div 
                key="employees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl lg:text-2xl font-bold">الموظفين</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowModal('payroll')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm lg:text-base"
                    >
                      <Plus size={18} />
                      صرف راتب
                    </button>
                    <button 
                      onClick={() => setShowModal('employee')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm lg:text-base"
                    >
                      <Plus size={18} />
                      إضافة موظف
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right min-w-[600px]">
                      <thead className="bg-slate-50 text-slate-500 text-sm">
                        <tr>
                          <th className="px-6 py-4 font-medium">الاسم</th>
                          <th className="px-6 py-4 font-medium">الوظيفة</th>
                          <th className="px-6 py-4 font-medium">الراتب الأساسي</th>
                          <th className="px-6 py-4 font-medium">تاريخ التعيين</th>
                          <th className="px-6 py-4 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employees.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold">{e.name}</td>
                            <td className="px-6 py-4 text-sm">{e.position}</td>
                            <td className="px-6 py-4 text-sm">{e.base_salary.toLocaleString()} د.ع</td>
                            <td className="px-6 py-4 text-sm">{e.hire_date}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${e.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                {e.status === 'active' ? 'نشط' : 'غير نشط'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h4 className="font-bold">آخر الرواتب المصروفة</h4>
                    </div>
                    <div className="p-4 space-y-4">
                      {payroll.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="text-sm font-bold">{p.employee_name}</p>
                            <p className="text-xs text-slate-500">{p.month}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600">{p.net_salary.toLocaleString()} د.ع</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl lg:text-2xl font-bold">المخزون</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowModal('movement')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm lg:text-base"
                    >
                      <History size={18} />
                      حركة مخزنية
                    </button>
                    <button 
                      onClick={() => setShowModal('inventory')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm lg:text-base"
                    >
                      <Plus size={18} />
                      إضافة صنف
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[700px]">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">الصنف</th>
                        <th className="px-6 py-4 font-medium">SKU</th>
                        <th className="px-6 py-4 font-medium">الفئة</th>
                        <th className="px-6 py-4 font-medium">الكمية</th>
                        <th className="px-6 py-4 font-medium">سعر الوحدة</th>
                        <th className="px-6 py-4 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold">{item.name}</td>
                          <td className="px-6 py-4 text-sm">{item.sku}</td>
                          <td className="px-6 py-4 text-sm">{item.category}</td>
                          <td className="px-6 py-4 text-sm font-bold">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm">{item.unit_price.toLocaleString()} د.ع</td>
                          <td className="px-6 py-4">
                            {item.quantity <= item.min_quantity ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-600 flex items-center gap-1 w-fit">
                                <AlertCircle size={12} />
                                منخفض
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-600">
                                متوفر
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'invoices' && (
              <motion.div 
                key="invoices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl lg:text-2xl font-bold">الفواتير</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowModal('purchase_invoice')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-rose-700 transition-colors text-sm lg:text-base"
                    >
                      <Plus size={18} />
                      فاتورة شراء
                    </button>
                    <button 
                      onClick={() => setShowModal('sale_invoice')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm lg:text-base"
                    >
                      <Plus size={18} />
                      فاتورة بيع
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[800px]">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">رقم الفاتورة</th>
                        <th className="px-6 py-4 font-medium">التاريخ</th>
                        <th className="px-6 py-4 font-medium">النوع</th>
                        <th className="px-6 py-4 font-medium">العميل/المورد</th>
                        <th className="px-6 py-4 font-medium">طريقة الدفع</th>
                        <th className="px-6 py-4 font-medium">الحالة</th>
                        <th className="px-6 py-4 font-medium">الإجمالي</th>
                        <th className="px-6 py-4 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold">{inv.invoice_number}</td>
                          <td className="px-6 py-4 text-sm">{inv.date}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`text-xs px-2 py-1 rounded-full ${inv.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {inv.type === 'sale' ? 'بيع' : 'شراء'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">{inv.customer_name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`text-xs px-2 py-1 rounded-full ${inv.payment_method === 'cash' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                              {inv.payment_method === 'cash' ? 'نقد' : 'آجل'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'returned' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {inv.status === 'returned' ? 'مرتجع' : 'مكتمل'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">{inv.total_amount.toLocaleString()} د.ع</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handlePrintInvoice(inv)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="طباعة"
                              >
                                <Download size={18} />
                              </button>
                              <button 
                                onClick={() => setShowStatusModal(inv)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="تعديل الحالة"
                              >
                                <Settings size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div 
                key="transactions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl lg:text-2xl font-bold">العمليات المالية</h3>
                  <button 
                    onClick={handlePrintTransactions}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm lg:text-base"
                  >
                    <Download size={18} />
                    تصدير PDF
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[600px]">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">التاريخ</th>
                        <th className="px-6 py-4 font-medium">الوصف</th>
                        <th className="px-6 py-4 font-medium">الفئة</th>
                        <th className="px-6 py-4 font-medium">المبلغ</th>
                        <th className="px-6 py-4 font-medium">النوع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm">{t.date}</td>
                          <td className="px-6 py-4 text-sm font-medium">{t.description}</td>
                          <td className="px-6 py-4 text-sm">{t.category}</td>
                          <td className="px-6 py-4 text-sm font-bold">{t.amount.toLocaleString()} د.ع</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {t.type === 'income' ? 'دخل' : 'مصروف'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp size={32} />
                    </div>
                    <h4 className="font-bold mb-2">تقرير الأرباح والخسائر</h4>
                    <p className="text-sm text-slate-500 mb-4">ملخص شامل للإيرادات والمصروفات خلال فترة محددة.</p>
                    <button 
                      onClick={handlePrintProfitLoss}
                      className="w-full py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                    >
                      إنشاء التقرير
                    </button>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={32} />
                    </div>
                    <h4 className="font-bold mb-2">تقرير الرواتب</h4>
                    <p className="text-sm text-slate-500 mb-4">كشف تفصيلي بالرواتب المصروفة والاستقطاعات والمكافآت.</p>
                    <button 
                      onClick={handlePrintPayrollReport}
                      className="w-full py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                    >
                      إنشاء التقرير
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package size={32} />
                    </div>
                    <h4 className="font-bold mb-2">تقرير المخزون</h4>
                    <p className="text-sm text-slate-500 mb-4">حالة المخزون الحالية، الأصناف المنخفضة، وحركة الأصناف.</p>
                    <button 
                      onClick={handlePrintInventoryReport}
                      className="w-full py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                    >
                      إنشاء التقرير
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && user.role === 'admin' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-2xl font-bold">إدارة مستخدمي النظام</h3>
                  <button 
                    onClick={() => setShowModal('add_user')}
                    className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
                  >
                    <Plus size={20} />
                    إضافة مستخدم جديد
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
                      <div className={`absolute top-0 right-0 w-2 h-full ${u.role === 'admin' ? 'bg-orange-600' : 'bg-blue-500'}`}></div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-xl">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{u.full_name}</h4>
                          <p className="text-slate-500 text-sm">@{u.username}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${u.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {u.role === 'admin' ? 'مدير نظام' : u.role === 'accountant' ? 'محاسب' : 'مدير'}
                        </span>
                        {u.username !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold">تعديل حالة الفاتورة</h3>
                <button onClick={() => setShowStatusModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-orange-800">رقم الفاتورة: <span className="font-bold">{showStatusModal.invoice_number}</span></p>
                    <span className={`text-xs px-2 py-1 rounded-full ${showStatusModal.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {showStatusModal.type === 'sale' ? 'بيع' : 'شراء'}
                    </span>
                  </div>
                  <p className="text-sm text-orange-800">العميل/المورد: <span className="font-bold">{showStatusModal.customer_name}</span></p>
                  <p className="text-sm text-orange-800">طريقة الدفع الحالية: <span className="font-bold">{showStatusModal.payment_method === 'cash' ? 'نقد' : 'آجل'}</span></p>
                  <p className="text-sm text-orange-800">الحالة: <span className="font-bold">{showStatusModal.status === 'returned' ? 'مرتجع' : 'مكتمل'}</span></p>
                </div>

                <div className="space-y-4">
                  {showStatusModal.payment_method === 'credit' && showStatusModal.status !== 'returned' && (
                    <button 
                      onClick={() => handleUpdateInvoiceStatus(showStatusModal.id, undefined, 'cash')}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      تحويل إلى نقد
                    </button>
                  )}

                  {showStatusModal.payment_method === 'cash' && showStatusModal.status !== 'returned' && (
                    <div className="text-center p-3 bg-slate-50 rounded-xl text-slate-500 text-sm">
                      الفاتورة مدفوعة نقداً بالفعل
                    </div>
                  )}
                  
                  {showStatusModal.status !== 'returned' ? (
                    <button 
                      onClick={() => {
                        if(confirm('هل أنت متأكد من إرجاع هذه الفاتورة؟ سيتم عكس الحركات المالية والمخزنية.')) {
                          handleUpdateInvoiceStatus(showStatusModal.id, 'returned');
                        }
                      }}
                      className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                    >
                      إرجاع الفاتورة
                    </button>
                  ) : (
                    <div className="text-center p-3 bg-rose-50 rounded-xl text-rose-600 font-bold">
                      هذه الفاتورة تم إرجاعها مسبقاً
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold">
                  {showModal === 'employee' && 'إضافة موظف جديد'}
                  {showModal === 'inventory' && 'إضافة صنف جديد'}
                  {showModal === 'payroll' && 'صرف راتب'}
                  {showModal === 'movement' && 'تسجيل حركة مخزنية'}
                  {(showModal === 'sale_invoice' || showModal === 'purchase_invoice') && (showModal === 'sale_invoice' ? 'فاتورة بيع جديدة' : 'فاتورة شراء جديدة')}
                </h3>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {showModal === 'add_user' && (
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                      <input name="full_name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">اسم المستخدم</label>
                      <input name="username" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                      <input name="password" type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الصلاحية</label>
                      <select name="role" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                        <option value="accountant">محاسب</option>
                        <option value="manager">مدير</option>
                        <option value="admin">مدير نظام</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors mt-4">إضافة المستخدم</button>
                  </form>
                )}

                {showModal === 'employee' && (
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">اسم الموظف</label>
                      <input name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الوظيفة</label>
                      <input name="position" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">الراتب الأساسي</label>
                        <input name="base_salary" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">تاريخ التعيين</label>
                        <input name="hire_date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors mt-4">حفظ البيانات</button>
                  </form>
                )}

                {showModal === 'inventory' && (
                  <form onSubmit={handleAddInventory} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">اسم الصنف</label>
                        <input name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">SKU</label>
                        <input name="sku" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الفئة</label>
                      <input name="category" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">الكمية</label>
                        <input name="quantity" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">الحد الأدنى</label>
                        <input name="min_quantity" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">سعر الوحدة</label>
                        <input name="unit_price" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors mt-4">إضافة الصنف</button>
                  </form>
                )}

                {showModal === 'payroll' && (
                  <form onSubmit={handleAddPayroll} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">الموظف</label>
                      <select name="employee_id" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">الشهر</label>
                        <input name="month" type="month" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">تاريخ الصرف</label>
                        <input name="payment_date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الراتب الأساسي</label>
                      <input name="base_salary" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">الاستقطاعات</label>
                        <input name="deductions" type="number" defaultValue="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">المكافآت</label>
                        <input name="bonuses" type="number" defaultValue="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors mt-4">تأكيد الصرف</button>
                  </form>
                )}

                {showModal === 'movement' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData.entries());
                    await fetch('/api/inventory/movement', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...data,
                        item_id: Number(data.item_id),
                        quantity: Number(data.quantity)
                      })
                    });
                    setShowModal(null);
                    fetchData();
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">الصنف</label>
                      <select name="item_id" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                        {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (الرصيد: {i.quantity})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">نوع الحركة</label>
                        <select name="type" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                          <option value="in">دخول (شراء/توريد)</option>
                          <option value="out">خروج (بيع/صرف)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">الكمية</label>
                        <input name="quantity" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">التاريخ</label>
                      <input name="date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">المرجع (رقم الفاتورة/السند)</label>
                      <input name="reference" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors mt-4">تسجيل الحركة</button>
                  </form>
                )}

                {(showModal === 'sale_invoice' || showModal === 'purchase_invoice') && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData.entries());
                    
                    // For simplicity in this demo, we'll just handle one item per invoice from the form
                    // In a real app, you'd have a dynamic list of items
                    const items = [{
                      item_id: Number(data.item_id),
                      quantity: Number(data.quantity),
                      unit_price: Number(data.unit_price)
                    }];

                    await fetch('/api/invoices', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        invoice_number: data.invoice_number,
                        date: data.date,
                        customer_name: data.customer_name,
                        type: showModal === 'sale_invoice' ? 'sale' : 'purchase',
                        items,
                        payment_method: data.payment_method
                      })
                    });
                    setShowModal(null);
                    fetchData();
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">رقم الفاتورة</label>
                        <input name="invoice_number" required defaultValue={`INV-${Date.now().toString().slice(-6)}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">التاريخ</label>
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">{showModal === 'sale_invoice' ? 'اسم العميل' : 'اسم المورد'}</label>
                        <input name="customer_name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
                        <select name="payment_method" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                          <option value="cash">نقد</option>
                          <option value="credit">آجل</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                      <h4 className="font-bold text-sm">الأصناف</h4>
                      <div>
                        <label className="block text-sm font-medium mb-1">اختر الصنف</label>
                        <select name="item_id" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                          {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (الرصيد: {i.quantity})</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">الكمية</label>
                          <input name="quantity" type="number" required min="1" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">سعر الوحدة</label>
                          <input name="unit_price" type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                        </div>
                      </div>
                    </div>
                    <button type="submit" className={`w-full py-3 ${showModal === 'sale_invoice' ? 'bg-orange-600' : 'bg-rose-600'} text-white rounded-xl font-bold hover:opacity-90 transition-colors mt-4`}>
                      حفظ الفاتورة
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
