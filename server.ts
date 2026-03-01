import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("accounting.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT, -- 'admin', 'accountant', 'manager'
    full_name TEXT
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    base_salary REAL DEFAULT 0,
    hire_date TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    month TEXT, -- YYYY-MM
    base_salary REAL,
    deductions REAL DEFAULT 0,
    bonuses REAL DEFAULT 0,
    net_salary REAL,
    payment_date TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    unit_price REAL DEFAULT 0,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    type TEXT, -- 'in', 'out'
    quantity INTEGER,
    date TEXT,
    reference TEXT,
    FOREIGN KEY (item_id) REFERENCES inventory(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    description TEXT,
    type TEXT, -- 'income', 'expense'
    category TEXT, -- 'sales', 'payroll', 'inventory', 'other'
    amount REAL,
    reference_id INTEGER, -- link to payroll or inventory movement or invoice
    reference_type TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE,
    date TEXT,
    type TEXT, -- 'sale', 'purchase'
    customer_name TEXT,
    total_amount REAL,
    payment_method TEXT DEFAULT 'cash', -- 'cash', 'credit'
    status TEXT DEFAULT 'paid'
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    item_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    total REAL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (item_id) REFERENCES inventory(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    timestamp TEXT,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT DEFAULT 'شركة الوتد',
    company_logo TEXT
  );
`);

// Migration: Ensure invoices table has necessary columns
try {
  db.prepare("SELECT payment_method FROM invoices LIMIT 1").get();
} catch (e) {
  try {
    db.exec("ALTER TABLE invoices ADD COLUMN payment_method TEXT DEFAULT 'cash'");
  } catch (err) {
    console.log("payment_method column already exists or error adding it");
  }
}

try {
  db.prepare("SELECT status FROM invoices LIMIT 1").get();
} catch (e) {
  try {
    db.exec("ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'paid'");
  } catch (err) {
    console.log("status column already exists or error adding it");
  }
}

// Seed initial admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "admin",
    "admin123",
    "admin",
    "مدير النظام"
  );
}

// Seed initial settings if not exists
const settingsExist = db.prepare("SELECT * FROM settings WHERE id = 1").get();
if (!settingsExist) {
  db.prepare("INSERT INTO settings (id, company_name) VALUES (1, 'شركة الوتد')").run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
    } else {
      res.status(401).json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
  });

  // Users Management
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, full_name FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, full_name } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
        username,
        password,
        role,
        full_name
      );
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ success: false, message: "اسم المستخدم موجود مسبقاً" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    const { company_name, company_logo } = req.body;
    db.prepare("UPDATE settings SET company_name = ?, company_logo = ? WHERE id = 1").run(
      company_name,
      company_logo
    );
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const totalIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income'").get().total || 0;
    const totalExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'").get().total || 0;
    const lowStockCount = db.prepare("SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity").get().count;
    const employeeCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'active'").get().count;

    // Monthly data for chart
    const monthlyData = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all().reverse();

    res.json({ totalIncome, totalExpense, lowStockCount, employeeCount, monthlyData });
  });

  // Employees
  app.get("/api/employees", (req, res) => {
    const employees = db.prepare("SELECT * FROM employees").all();
    res.json(employees);
  });

  app.post("/api/employees", (req, res) => {
    const { name, position, base_salary, hire_date } = req.body;
    const result = db.prepare("INSERT INTO employees (name, position, base_salary, hire_date) VALUES (?, ?, ?, ?)").run(name, position, base_salary, hire_date);
    res.json({ id: result.lastInsertRowid });
  });

  // Payroll
  app.get("/api/payroll", (req, res) => {
    const payroll = db.prepare(`
      SELECT p.*, e.name as employee_name 
      FROM payroll p 
      JOIN employees e ON p.employee_id = e.id
      ORDER BY p.month DESC
    `).all();
    res.json(payroll);
  });

  app.post("/api/payroll", (req, res) => {
    const { employee_id, month, base_salary, deductions, bonuses, payment_date } = req.body;
    const net_salary = base_salary + bonuses - deductions;
    const result = db.prepare(`
      INSERT INTO payroll (employee_id, month, base_salary, deductions, bonuses, net_salary, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(employee_id, month, base_salary, deductions, bonuses, net_salary, payment_date);

    // Add to transactions
    db.prepare(`
      INSERT INTO transactions (date, description, type, category, amount, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(payment_date, `راتب شهر ${month} للموظف ${employee_id}`, 'expense', 'payroll', net_salary, result.lastInsertRowid, 'payroll');

    res.json({ id: result.lastInsertRowid });
  });

  // Inventory
  app.get("/api/inventory", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory").all();
    res.json(items);
  });

  app.post("/api/inventory", (req, res) => {
    const { name, sku, category, quantity, min_quantity, unit_price, description } = req.body;
    const result = db.prepare(`
      INSERT INTO inventory (name, sku, category, quantity, min_quantity, unit_price, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, sku, category, quantity, min_quantity, unit_price, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/inventory/movement", (req, res) => {
    const { item_id, type, quantity, date, reference } = req.body;
    const result = db.prepare(`
      INSERT INTO inventory_movements (item_id, type, quantity, date, reference)
      VALUES (?, ?, ?, ?, ?)
    `).run(item_id, type, quantity, date, reference);

    // Update stock
    if (type === 'in') {
      db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE id = ?").run(quantity, item_id);
    } else {
      db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE id = ?").run(quantity, item_id);
    }

    // Financial transaction if it's a sale (out) or purchase (in)
    const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get(item_id);
    const amount = item.unit_price * quantity;
    const transType = type === 'in' ? 'expense' : 'income';
    const transCat = 'inventory';
    
    db.prepare(`
      INSERT INTO transactions (date, description, type, category, amount, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(date, `${type === 'in' ? 'شراء' : 'بيع'} صنف: ${item.name}`, transType, transCat, amount, result.lastInsertRowid, 'inventory_movement');

    res.json({ success: true });
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
    res.json(transactions);
  });

  // Invoices
  app.get("/api/invoices", (req, res) => {
    const invoices = db.prepare("SELECT * FROM invoices ORDER BY date DESC").all();
    // For each invoice, get items
    const invoicesWithItems = invoices.map(inv => {
      const items = db.prepare(`
        SELECT ii.*, i.name as item_name 
        FROM invoice_items ii 
        JOIN inventory i ON ii.item_id = i.id 
        WHERE ii.invoice_id = ?
      `).all(inv.id);
      return { ...inv, items };
    });
    res.json(invoicesWithItems);
  });

  app.post("/api/invoices", (req, res) => {
    const { invoice_number, date, type, customer_name, payment_method, items } = req.body;
    
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (invoice_number, date, type, customer_name, total_amount, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertInvoiceItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertTransaction = db.prepare(`
      INSERT INTO transactions (date, description, type, category, amount, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const result = insertInvoice.run(invoice_number, date, type, customer_name, total_amount, payment_method || 'cash', 'paid');
      const invoiceId = result.lastInsertRowid;

      for (const item of items) {
        insertInvoiceItem.run(invoiceId, item.item_id, item.quantity, item.unit_price, item.quantity * item.unit_price);
        
        // Fetch current item data for WAC calculation
        const currentItem = db.prepare("SELECT quantity, unit_price FROM inventory WHERE id = ?").get(item.item_id);
        
        if (type === 'purchase') {
          // Weighted Average Cost (WAC) Calculation
          const currentQty = currentItem.quantity || 0;
          const currentPrice = currentItem.unit_price || 0;
          const newQty = item.quantity;
          const newPrice = item.unit_price;
          
          const totalQty = currentQty + newQty;
          const totalValue = (currentQty * currentPrice) + (newQty * newPrice);
          const newAveragePrice = totalQty > 0 ? totalValue / totalQty : newPrice;

          db.prepare("UPDATE inventory SET quantity = ?, unit_price = ? WHERE id = ?")
            .run(totalQty, newAveragePrice, item.item_id);
        } else {
          // For sales, just decrease quantity
          db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE id = ?")
            .run(item.quantity, item.item_id);
        }

        // Record movement
        db.prepare(`
          INSERT INTO inventory_movements (item_id, type, quantity, date, reference)
          VALUES (?, ?, ?, ?, ?)
        `).run(item.item_id, type === 'purchase' ? 'in' : 'out', item.quantity, date, `Invoice: ${invoice_number}`);
      }

      // Record financial transaction
      const transType = type === 'sale' ? 'income' : 'expense';
      const description = `${type === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء'} رقم: ${invoice_number}`;
      insertTransaction.run(date, description, transType, 'inventory', total_amount, invoiceId, 'invoice');

      return invoiceId;
    });

    try {
      const invoiceId = transaction();
      res.json({ success: true, id: invoiceId });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/invoices/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, payment_method } = req.body;
    
    try {
      const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
      if (!invoice) return res.status(404).json({ success: false, message: "الفاتورة غير موجودة" });

      if (status === 'returned' && invoice.status !== 'returned') {
        // Handle Return logic: Reverse inventory and transactions
        const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(id);
        
        db.transaction(() => {
          for (const item of items) {
            if (invoice.type === 'sale') {
              // Restore inventory for returned sale
              db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE id = ?").run(item.quantity, item.item_id);
              db.prepare("INSERT INTO inventory_movements (item_id, type, quantity, date, reference) VALUES (?, ?, ?, ?, ?)")
                .run(item.item_id, 'in', item.quantity, new Date().toISOString().split('T')[0], `Return of Sale Invoice: ${invoice.invoice_number}`);
            } else {
              // Reduce inventory for returned purchase
              db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE id = ?").run(item.quantity, item.item_id);
              db.prepare("INSERT INTO inventory_movements (item_id, type, quantity, date, reference) VALUES (?, ?, ?, ?, ?)")
                .run(item.item_id, 'out', item.quantity, new Date().toISOString().split('T')[0], `Return of Purchase Invoice: ${invoice.invoice_number}`);
            }
          }

          // Add reversing financial transaction
          const transType = invoice.type === 'sale' ? 'expense' : 'income';
          const description = `إرجاع ${invoice.type === 'sale' ? 'مبيعات' : 'مشتريات'} - فاتورة رقم: ${invoice.invoice_number}`;
          db.prepare("INSERT INTO transactions (date, description, type, category, amount, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .run(new Date().toISOString().split('T')[0], description, transType, 'inventory', invoice.total_amount, id, 'invoice_return');

          db.prepare("UPDATE invoices SET status = 'returned' WHERE id = ?").run(id);
        })();
      } else {
        // Simple update for payment method or other status
        const updates = [];
        const params = [];
        if (status) { updates.push("status = ?"); params.push(status); }
        if (payment_method) { updates.push("payment_method = ?"); params.push(payment_method); }
        
        if (updates.length > 0) {
          params.push(id);
          db.prepare(`UPDATE invoices SET ${updates.join(", ")} WHERE id = ?`).run(...params);
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode serving dist folder");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
