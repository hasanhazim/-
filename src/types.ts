export interface User {
  id: number;
  username: string;
  role: 'admin' | 'accountant' | 'manager';
  full_name: string;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  base_salary: number;
  hire_date: string;
  status: 'active' | 'inactive';
}

export interface Payroll {
  id: number;
  employee_id: number;
  employee_name?: string;
  month: string;
  base_salary: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  payment_date: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  description: string;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  reference_id?: number;
  reference_type?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  type: 'sale' | 'purchase';
  customer_name: string;
  total_amount: number;
  payment_method: 'cash' | 'credit';
  status: string;
  items?: InvoiceItem[];
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  lowStockCount: number;
  employeeCount: number;
  monthlyData: {
    month: string;
    income: number;
    expense: number;
  }[];
}
