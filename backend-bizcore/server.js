const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'bizcore_secret_2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bekhruz:uGJ5pdXVXWjjONc3OARKgw@wobbly-manta-16748.jxf.gcp-asia-southeast1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full',
  ssl: { rejectUnauthorized: false }
});

// ─── INIT DB ─────────────────────────────────────────────────────────────────
async function initDB() {
  const client = await pool.connect();
  try {
    // Users/Auth
    await client.query(`CREATE TABLE IF NOT EXISTS bc_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL DEFAULT 'Xodim',
      department VARCHAR(100),
      phone VARCHAR(50),
      salary DECIMAL(15,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Faol',
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Departments
    await client.query(`CREATE TABLE IF NOT EXISTS bc_departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      manager_name VARCHAR(255),
      budget DECIMAL(15,2) DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Products/Inventory
    await client.query(`CREATE TABLE IF NOT EXISTS bc_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity INT DEFAULT 0,
      unit VARCHAR(50),
      price DECIMAL(15,2) DEFAULT 0,
      supplier VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Mavjud',
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Finance
    await client.query(`CREATE TABLE IF NOT EXISTS bc_finance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      category VARCHAR(100),
      amount DECIMAL(15,2) NOT NULL,
      description TEXT,
      department VARCHAR(100),
      date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(50) DEFAULT 'Tasdiqlangan',
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Tasks
    await client.query(`CREATE TABLE IF NOT EXISTS bc_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to VARCHAR(255),
      assigned_by VARCHAR(255),
      department VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'Oddiy',
      status VARCHAR(50) DEFAULT 'Yangi',
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Clients/CRM
    await client.query(`CREATE TABLE IF NOT EXISTS bc_clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      status VARCHAR(50) DEFAULT 'Faol',
      contract_value DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Contracts
    await client.query(`CREATE TABLE IF NOT EXISTS bc_contracts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      client_name VARCHAR(255),
      amount DECIMAL(15,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'Kutilmoqda',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Seed admin user
    const adminCheck = await client.query("SELECT id FROM bc_users WHERE email='admin@bizcore.uz'");
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(`INSERT INTO bc_users (full_name, email, password, role, department, phone, salary)
        VALUES ('Direktor Azimov', 'admin@bizcore.uz', $1, 'Direktor', 'Boshqaruv', '+998901234567', 5000000)`, [hash]);

      // Seed sample users
      const users = [
        ['Salimova Nodira', 'hr@bizcore.uz', 'HR Menejer', 'HR Bo\'limi', '+998901234568', 3000000],
        ['Toshmatov Bekzod', 'finance@bizcore.uz', 'Moliya Menejeri', 'Moliya Bo\'limi', '+998901234569', 3500000],
        ['Rahimova Dilnoza', 'sales@bizcore.uz', 'Savdo Menejeri', 'Savdo Bo\'limi', '+998901234570', 4000000],
        ['Karimov Jasur', 'warehouse@bizcore.uz', 'Ombor Boshlig\'i', 'Omborxona', '+998901234571', 2500000],
      ];
      for (const u of users) {
        const h = await bcrypt.hash('123456', 10);
        await client.query(`INSERT INTO bc_users (full_name, email, password, role, department, phone, salary)
          VALUES ($1,$2,$3,$4,$5,$6,$7)`, [u[0], u[1], h, u[2], u[3], u[4], u[5]]);
      }

      // Seed departments
      await client.query(`INSERT INTO bc_departments (name, manager_name, budget, description) VALUES
        ('Boshqaruv', 'Direktor Azimov', 50000000, 'Asosiy boshqaruv bo\'limi'),
        ('HR Bo''limi', 'Salimova Nodira', 20000000, 'Xodimlar boshqaruvi'),
        ('Moliya Bo''limi', 'Toshmatov Bekzod', 30000000, 'Moliyaviy hisobotlar'),
        ('Savdo Bo''limi', 'Rahimova Dilnoza', 40000000, 'Mijozlar va shartnomalar'),
        ('Omborxona', 'Karimov Jasur', 15000000, 'Mahsulot va inventar')`);

      // Seed products
      await client.query(`INSERT INTO bc_products (name, category, quantity, unit, price, supplier, status) VALUES
        ('Ofis Stuli', 'Mebel', 45, 'dona', 850000, 'UzFurniture', 'Mavjud'),
        ('Kompyuter Dell', 'Elektronika', 12, 'dona', 8500000, 'TechStore', 'Mavjud'),
        ('A4 Qog''oz', 'Buyumlar', 250, 'paket', 45000, 'OfficeSupply', 'Mavjud'),
        ('Printer HP', 'Elektronika', 5, 'dona', 3200000, 'TechStore', 'Mavjud'),
        ('Flipchart', 'Mebel', 8, 'dona', 650000, 'UzFurniture', 'Mavjud'),
        ('USB-C Kabel', 'Aksesuar', 3, 'dona', 85000, 'TechStore', 'Kam qoldi')`);

      // Seed finance
      await client.query(`INSERT INTO bc_finance (type, category, amount, description, department, date, status) VALUES
        ('Kirim', 'Shartnoma', 15000000, 'UzTech bilan shartnoma to''lovi', 'Savdo Bo''limi', CURRENT_DATE - 5, 'Tasdiqlangan'),
        ('Kirim', 'Xizmat', 8000000, 'Konsalting xizmati uchun to''lov', 'Savdo Bo''limi', CURRENT_DATE - 3, 'Tasdiqlangan'),
        ('Chiqim', 'Maosh', 18500000, 'Aprel oyi maoshlari', 'HR Bo''limi', CURRENT_DATE - 1, 'Tasdiqlangan'),
        ('Chiqim', 'Xarajat', 2300000, 'Ofis buyumlari xaridi', 'Omborxona', CURRENT_DATE, 'Kutilmoqda')`);

      // Seed tasks
      await client.query(`INSERT INTO bc_tasks (title, description, assigned_to, assigned_by, department, priority, status, due_date) VALUES
        ('Yillik hisobot tayyorlash', 'Moliyaviy yillik hisobotni yakunlash', 'Toshmatov Bekzod', 'Direktor Azimov', 'Moliya Bo''limi', 'Yuqori', 'Jarayonda', CURRENT_DATE + 7),
        ('Yangi xodim qabul qilish', '3 ta yangi dasturchi qabul qilish', 'Salimova Nodira', 'Direktor Azimov', 'HR Bo''limi', 'Oddiy', 'Yangi', CURRENT_DATE + 14),
        ('Mijozlar bazasini yangilash', 'CRM ma''lumotlarini tekshirish', 'Rahimova Dilnoza', 'Direktor Azimov', 'Savdo Bo''limi', 'Past', 'Yangi', CURRENT_DATE + 10),
        ('Inventar sanashi', 'Omborxonadagi barcha mahsulotlarni sanash', 'Karimov Jasur', 'Direktor Azimov', 'Omborxona', 'Yuqori', 'Bajarildi', CURRENT_DATE - 2)`);

      // Seed clients
      await client.query(`INSERT INTO bc_clients (company_name, contact_person, email, phone, address, status, contract_value, notes) VALUES
        ('UzTech Solutions', 'Mirzo Aliyev', 'contact@uztech.uz', '+998712345678', 'Toshkent, Chilonzor', 'Faol', 25000000, 'VIP mijoz'),
        ('GlobalTrade LLC', 'Sara Johnson', 'sara@globaltrade.com', '+998909876543', 'Toshkent, Yunusobod', 'Faol', 42000000, 'Xalqaro hamkor'),
        ('Anor Group', 'Sherzod Karimov', 'info@anorgroup.uz', '+998711234567', 'Samarqand', 'Kutilmoqda', 0, 'Yangi mijoz'),
        ('NovaTech', 'Elena Smirnova', 'elena@novatech.ru', '+79261234567', 'Toshkent, Mirzo Ulugbek', 'Faol', 18000000, '')`);

      // Seed contracts
      await client.query(`INSERT INTO bc_contracts (title, client_name, amount, start_date, end_date, status, description) VALUES
        ('UzTech IT Xizmat Shartnomasi', 'UzTech Solutions', 25000000, CURRENT_DATE - 30, CURRENT_DATE + 335, 'Faol', 'Yillik IT support xizmati'),
        ('GlobalTrade Yetkazib berish', 'GlobalTrade LLC', 42000000, CURRENT_DATE - 60, CURRENT_DATE + 120, 'Faol', 'Logistika va yetkazib berish'),
        ('NovaTech Konsalting', 'NovaTech', 18000000, CURRENT_DATE + 15, CURRENT_DATE + 195, 'Kutilmoqda', 'Biznes tahlil va konsalting')`);
    }

    console.log('✅ BizCore DB initialized successfully');
  } catch (err) {
    console.error('DB init error:', err.message);
  } finally {
    client.release();
  }
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz' });
  }
};

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await pool.query('SELECT * FROM bc_users WHERE email=$1', [email]);
    if (!r.rows[0]) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    const valid = await bcrypt.compare(password, r.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Parol noto\'g\'ri' });
    const { password: _, ...user } = r.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const r = await pool.query('SELECT id,full_name,email,role,department,phone,salary,status,created_at FROM bc_users WHERE id=$1', [req.user.id]);
  res.json(r.rows[0]);
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const [users, departments, products, finance, tasks, clients, contracts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM bc_users'),
      pool.query('SELECT COUNT(*) FROM bc_departments'),
      pool.query('SELECT COUNT(*) FROM bc_products'),
      pool.query('SELECT COALESCE(SUM(CASE WHEN type=\'Kirim\' THEN amount ELSE 0 END),0) as income, COALESCE(SUM(CASE WHEN type=\'Chiqim\' THEN amount ELSE 0 END),0) as expense FROM bc_finance'),
      pool.query('SELECT status, COUNT(*) as count FROM bc_tasks GROUP BY status'),
      pool.query('SELECT COUNT(*) FROM bc_clients'),
      pool.query('SELECT COUNT(*) FROM bc_contracts WHERE status=\'Faol\''),
    ]);
    const taskStats = {};
    tasks.rows.forEach(r => { taskStats[r.status] = parseInt(r.count); });
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalDepartments: parseInt(departments.rows[0].count),
      totalProducts: parseInt(products.rows[0].count),
      totalIncome: parseFloat(finance.rows[0].income),
      totalExpense: parseFloat(finance.rows[0].expense),
      netProfit: parseFloat(finance.rows[0].income) - parseFloat(finance.rows[0].expense),
      taskStats,
      totalClients: parseInt(clients.rows[0].count),
      activeContracts: parseInt(contracts.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USERS (HR) ───────────────────────────────────────────────────────────────
app.get('/api/users', auth, async (req, res) => {
  const r = await pool.query('SELECT id,full_name,email,role,department,phone,salary,status,created_at FROM bc_users ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/users', auth, async (req, res) => {
  const { full_name, email, password, role, department, phone, salary, status } = req.body;
  try {
    const hash = await bcrypt.hash(password || '123456', 10);
    const r = await pool.query(`INSERT INTO bc_users (full_name,email,password,role,department,phone,salary,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,full_name,email,role,department,phone,salary,status,created_at`,
      [full_name, email, hash, role, department, phone, salary||0, status||'Faol']);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/users/:id', auth, async (req, res) => {
  const { full_name, email, role, department, phone, salary, status } = req.body;
  const r = await pool.query(`UPDATE bc_users SET full_name=$1,email=$2,role=$3,department=$4,phone=$5,salary=$6,status=$7 WHERE id=$8 RETURNING id,full_name,email,role,department,phone,salary,status,created_at`,
    [full_name, email, role, department, phone, salary, status, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/users/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_users WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
app.get('/api/departments', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_departments ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/departments', auth, async (req, res) => {
  const { name, manager_name, budget, description } = req.body;
  const r = await pool.query('INSERT INTO bc_departments (name,manager_name,budget,description) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, manager_name, budget||0, description]);
  res.json(r.rows[0]);
});
app.put('/api/departments/:id', auth, async (req, res) => {
  const { name, manager_name, budget, description } = req.body;
  const r = await pool.query('UPDATE bc_departments SET name=$1,manager_name=$2,budget=$3,description=$4 WHERE id=$5 RETURNING *',
    [name, manager_name, budget, description, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/departments/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_departments WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── PRODUCTS/INVENTORY ───────────────────────────────────────────────────────
app.get('/api/products', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_products ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/products', auth, async (req, res) => {
  const { name, category, quantity, unit, price, supplier, status } = req.body;
  const r = await pool.query('INSERT INTO bc_products (name,category,quantity,unit,price,supplier,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [name, category, quantity||0, unit, price||0, supplier, status||'Mavjud']);
  res.json(r.rows[0]);
});
app.put('/api/products/:id', auth, async (req, res) => {
  const { name, category, quantity, unit, price, supplier, status } = req.body;
  const r = await pool.query('UPDATE bc_products SET name=$1,category=$2,quantity=$3,unit=$4,price=$5,supplier=$6,status=$7 WHERE id=$8 RETURNING *',
    [name, category, quantity, unit, price, supplier, status, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/products/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_products WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── FINANCE ──────────────────────────────────────────────────────────────────
app.get('/api/finance', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_finance ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/finance', auth, async (req, res) => {
  const { type, category, amount, description, department, date, status } = req.body;
  const r = await pool.query('INSERT INTO bc_finance (type,category,amount,description,department,date,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [type, category, amount, description, department, date||new Date().toISOString().split('T')[0], status||'Tasdiqlangan']);
  res.json(r.rows[0]);
});
app.put('/api/finance/:id', auth, async (req, res) => {
  const { type, category, amount, description, department, date, status } = req.body;
  const r = await pool.query('UPDATE bc_finance SET type=$1,category=$2,amount=$3,description=$4,department=$5,date=$6,status=$7 WHERE id=$8 RETURNING *',
    [type, category, amount, description, department, date, status, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/finance/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_finance WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── TASKS ────────────────────────────────────────────────────────────────────
app.get('/api/tasks', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_tasks ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/tasks', auth, async (req, res) => {
  const { title, description, assigned_to, assigned_by, department, priority, status, due_date } = req.body;
  const r = await pool.query('INSERT INTO bc_tasks (title,description,assigned_to,assigned_by,department,priority,status,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [title, description, assigned_to, assigned_by, department, priority||'Oddiy', status||'Yangi', due_date]);
  res.json(r.rows[0]);
});
app.put('/api/tasks/:id', auth, async (req, res) => {
  const { title, description, assigned_to, assigned_by, department, priority, status, due_date } = req.body;
  const r = await pool.query('UPDATE bc_tasks SET title=$1,description=$2,assigned_to=$3,assigned_by=$4,department=$5,priority=$6,status=$7,due_date=$8 WHERE id=$9 RETURNING *',
    [title, description, assigned_to, assigned_by, department, priority, status, due_date, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/tasks/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_tasks WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
app.get('/api/clients', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_clients ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/clients', auth, async (req, res) => {
  const { company_name, contact_person, email, phone, address, status, contract_value, notes } = req.body;
  const r = await pool.query('INSERT INTO bc_clients (company_name,contact_person,email,phone,address,status,contract_value,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [company_name, contact_person, email, phone, address, status||'Faol', contract_value||0, notes]);
  res.json(r.rows[0]);
});
app.put('/api/clients/:id', auth, async (req, res) => {
  const { company_name, contact_person, email, phone, address, status, contract_value, notes } = req.body;
  const r = await pool.query('UPDATE bc_clients SET company_name=$1,contact_person=$2,email=$3,phone=$4,address=$5,status=$6,contract_value=$7,notes=$8 WHERE id=$9 RETURNING *',
    [company_name, contact_person, email, phone, address, status, contract_value, notes, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/clients/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_clients WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
app.get('/api/contracts', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_contracts ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/contracts', auth, async (req, res) => {
  const { title, client_name, amount, start_date, end_date, status, description } = req.body;
  const r = await pool.query('INSERT INTO bc_contracts (title,client_name,amount,start_date,end_date,status,description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [title, client_name, amount||0, start_date, end_date, status||'Kutilmoqda', description]);
  res.json(r.rows[0]);
});
app.put('/api/contracts/:id', auth, async (req, res) => {
  const { title, client_name, amount, start_date, end_date, status, description } = req.body;
  const r = await pool.query('UPDATE bc_contracts SET title=$1,client_name=$2,amount=$3,start_date=$4,end_date=$5,status=$6,description=$7 WHERE id=$8 RETURNING *',
    [title, client_name, amount, start_date, end_date, status, description, req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/contracts/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM bc_contracts WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 BizCore Backend running on port ${PORT}`);
  await initDB();
});
