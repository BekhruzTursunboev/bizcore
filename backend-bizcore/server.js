const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'bizcore_secret_2024_secure';
const DB_URL = process.env.DATABASE_URL || 'postgresql://bekhruz:uGJ5pdXVXWjjONc3OARKgw@wobbly-manta-16748.jxf.gcp-asia-southeast1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false }, max: 10 });

/* ─── HEALTH CHECK ─────────────────────────────────────────────────────────── */
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

/* ─── INIT DB ──────────────────────────────────────────────────────────────── */
async function initDB() {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS bc_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL DEFAULT 'Xodim',
      department VARCHAR(100) DEFAULT 'Boshqaruv',
      phone VARCHAR(50),
      salary DECIMAL(15,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Faol',
      avatar_color VARCHAR(20),
      hire_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL UNIQUE,
      manager_name VARCHAR(255),
      budget DECIMAL(15,2) DEFAULT 0,
      employee_count INT DEFAULT 0,
      description TEXT,
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Faol',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity INT DEFAULT 0,
      min_quantity INT DEFAULT 5,
      unit VARCHAR(50) DEFAULT 'dona',
      price DECIMAL(15,2) DEFAULT 0,
      total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * price) STORED,
      supplier VARCHAR(255),
      location VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Mavjud',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_finance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL CHECK (type IN ('Kirim','Chiqim')),
      category VARCHAR(100),
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      description TEXT,
      department VARCHAR(100),
      payment_method VARCHAR(50) DEFAULT 'Naqd',
      reference_no VARCHAR(100),
      date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(50) DEFAULT 'Tasdiqlangan',
      created_by VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to VARCHAR(255),
      assigned_by VARCHAR(255),
      department VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'Oddiy',
      status VARCHAR(50) DEFAULT 'Yangi',
      progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
      due_date DATE,
      tags VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      industry VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Faol',
      contract_value DECIMAL(15,2) DEFAULT 0,
      source VARCHAR(100),
      notes TEXT,
      last_contact DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_contracts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      client_name VARCHAR(255),
      contract_no VARCHAR(100),
      amount DECIMAL(15,2) DEFAULT 0,
      paid_amount DECIMAL(15,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'Kutilmoqda',
      type VARCHAR(100),
      description TEXT,
      responsible VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS bc_activity_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_name VARCHAR(255),
      action VARCHAR(100),
      module VARCHAR(100),
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    /* ─── SEED ─────────────────────────────────────────────────────────────── */
    const check = await c.query("SELECT id FROM bc_users WHERE email='admin@bizcore.uz'");
    if (check.rows.length === 0) {
      console.log('Seeding initial data...');

      // Users
      const users = [
        ['Azimov Behruz Kamoliddinovich', 'admin@bizcore.uz', 'admin123', 'Direktor', 'Boshqaruv', '+998 91 234 56 78', 12000000, 'Faol'],
        ['Salimova Nodira Hamidovna', 'hr@bizcore.uz', '123456', 'HR Menejer', 'HR Bo\'limi', '+998 93 456 78 90', 5500000, 'Faol'],
        ['Toshmatov Bekzod Ravshanov', 'finance@bizcore.uz', '123456', 'Moliya Menejeri', 'Moliya Bo\'limi', '+998 94 567 89 01', 7000000, 'Faol'],
        ['Rahimova Dilnoza Sobirovna', 'sales@bizcore.uz', '123456', 'Savdo Menejeri', 'Savdo Bo\'limi', '+998 97 678 90 12', 8000000, 'Faol'],
        ['Karimov Jasur Baxtiyor', 'warehouse@bizcore.uz', '123456', 'Ombor Boshlig\'i', 'Omborxona', '+998 90 789 01 23', 4500000, 'Faol'],
        ['Yusupova Malika Abdullayeva', 'it@bizcore.uz', '123456', 'Dasturchi', 'IT Bo\'limi', '+998 99 890 12 34', 9000000, 'Faol'],
        ['Xolmatov Sherzod Ulmas', 'marketing@bizcore.uz', '123456', 'Marketolog', 'Marketing Bo\'limi', '+998 91 901 23 45', 5000000, 'Ta\'tilda'],
        ['Nazarova Feruza Ibrohimova', 'designer@bizcore.uz', '123456', 'Dizayner', 'IT Bo\'limi', '+998 93 012 34 56', 6500000, 'Faol'],
      ];
      for (const [fn, em, pw, role, dept, phone, salary, status] of users) {
        const hash = await bcrypt.hash(pw, 10);
        await c.query(`INSERT INTO bc_users (full_name,email,password,role,department,phone,salary,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (email) DO NOTHING`,
          [fn, em, hash, role, dept, phone, salary, status]);
      }

      // Departments
      const depts = [
        ['Boshqaruv', 'Azimov Behruz', 80000000, 'Asosiy boshqaruv va strategiya bo\'limi', 'A-blok, 1-qavat', 'Faol'],
        ['HR Bo\'limi', 'Salimova Nodira', 25000000, 'Xodimlarni yollash, rivojlantirish va boshqarish', 'A-blok, 2-qavat', 'Faol'],
        ['Moliya Bo\'limi', 'Toshmatov Bekzod', 35000000, 'Moliyaviy hisobot, byudjet va audit', 'B-blok, 1-qavat', 'Faol'],
        ['Savdo Bo\'limi', 'Rahimova Dilnoza', 50000000, 'Mijozlar va savdo jarayonlari', 'B-blok, 2-qavat', 'Faol'],
        ['Omborxona', 'Karimov Jasur', 15000000, 'Mahsulot saqlash va inventar boshqaruvi', 'Ombor binosi', 'Faol'],
        ['IT Bo\'limi', 'Yusupova Malika', 40000000, 'Dasturiy ta\'minot va texnik qo\'llab-quvvatlash', 'C-blok, 3-qavat', 'Faol'],
        ['Marketing Bo\'limi', 'Xolmatov Sherzod', 20000000, 'Reklama, branding va bozor tahlili', 'C-blok, 2-qavat', 'Faol'],
      ];
      for (const [name, mgr, budget, desc, loc, status] of depts) {
        await c.query(`INSERT INTO bc_departments (name,manager_name,budget,description,location,status) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (name) DO NOTHING`,
          [name, mgr, budget, desc, loc, status]);
      }
      // Update employee counts
      await c.query(`UPDATE bc_departments d SET employee_count = (SELECT COUNT(*) FROM bc_users u WHERE u.department = d.name)`);

      // Products
      const products = [
        ['Lenovo ThinkPad L14', 'Elektronika', 8, 3, 'dona', 9500000, 'TechDistributor UZ', 'IT xonasi', 'Mavjud'],
        ['HP LaserJet Pro M404', 'Elektronika', 4, 2, 'dona', 4200000, 'OfficePro', 'Printer xonasi', 'Mavjud'],
        ['Ofis Stuli (Ergonomik)', 'Mebel', 35, 10, 'dona', 1250000, 'FurniturePlus', 'Ombor', 'Mavjud'],
        ['A4 Qog\'oz (Snegurochka)', 'Sarflovlar', 180, 50, 'paket', 52000, 'PaperWorld', 'Ombor', 'Mavjud'],
        ['Samsung 27" Monitor', 'Elektronika', 12, 5, 'dona', 3800000, 'TechDistributor UZ', 'IT xonasi', 'Mavjud'],
        ['Proyektor Epson EB-X41', 'Elektronika', 3, 1, 'dona', 7500000, 'MediaTech', 'Yig\'ilish xonasi', 'Mavjud'],
        ['Flipchart (2x3m)', 'Jihozlar', 6, 2, 'dona', 850000, 'OfficePro', 'Yig\'ilish xonasi', 'Mavjud'],
        ['USB-C Hub (7-in-1)', 'Aksesuar', 2, 5, 'dona', 320000, 'TechDistributor UZ', 'IT xonasi', 'Kam qoldi'],
        ['Whiteboard Marker Set', 'Sarflovlar', 85, 30, 'to\'plam', 45000, 'OfficePro', 'Ombor', 'Mavjud'],
        ['Kursi (Mehmon)', 'Mebel', 40, 10, 'dona', 450000, 'FurniturePlus', 'Ombor', 'Mavjud'],
        ['Noutbuk Sumkasi', 'Aksesuar', 15, 5, 'dona', 180000, 'OfficePro', 'IT xonasi', 'Mavjud'],
        ['Telefon (IP-SIP)', 'Elektronika', 1, 2, 'dona', 950000, 'TelecomUZ', 'Aloqa markazi', 'Kam qoldi'],
      ];
      for (const [name, cat, qty, minQ, unit, price, supplier, loc, status] of products) {
        await c.query(`INSERT INTO bc_products (name,category,quantity,min_quantity,unit,price,supplier,location,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [name, cat, qty, minQ, unit, price, supplier, loc, status]);
      }

      // Finance
      const finance = [
        ['Kirim', 'Shartnoma to\'lovi', 42000000, 'GlobalTrade LLC yillik shartnoma', 'Savdo Bo\'limi', 'Bank o\'tkazmasi', 'INV-2024-001', -30, 'Tasdiqlangan'],
        ['Kirim', 'Konsalting xizmati', 18500000, 'UzTech Solutions konsalting', 'Savdo Bo\'limi', 'Bank o\'tkazmasi', 'INV-2024-002', -25, 'Tasdiqlangan'],
        ['Kirim', 'Litsenziya to\'lovi', 9000000, 'Dasturiy ta\'minot litsenziyasi', 'IT Bo\'limi', 'Naqd', 'INV-2024-003', -20, 'Tasdiqlangan'],
        ['Chiqim', 'Oylik maoshlar', 62500000, 'Barcha xodimlar Iyun maoshi', 'HR Bo\'limi', 'Bank o\'tkazmasi', 'PAY-2024-006', -5, 'Tasdiqlangan'],
        ['Chiqim', 'Ofis ijarasi', 12000000, 'A-blok va B-blok Iyun oylik ijarasi', 'Boshqaruv', 'Bank o\'tkazmasi', 'RENT-2024-006', -3, 'Tasdiqlangan'],
        ['Kirim', 'Mahsulot sotuvi', 28000000, 'Anor Group mahsulot yetkazib berish', 'Savdo Bo\'limi', 'Naqd', 'INV-2024-004', -15, 'Tasdiqlangan'],
        ['Chiqim', 'Jihozlar xaridi', 38500000, 'IT jihozlari yangilash dasturi', 'IT Bo\'limi', 'Bank o\'tkazmasi', 'PO-2024-012', -10, 'Tasdiqlangan'],
        ['Chiqim', 'Kommunal xarajatlar', 4200000, 'Elektr, suv, internet Iyun', 'Boshqaruv', 'Naqd', 'UTIL-2024-006', -1, 'Tasdiqlangan'],
        ['Kirim', 'Xizmat ko\'rsatish', 15000000, 'NovaTech oylik xizmat shartnomasi', 'Savdo Bo\'limi', 'Bank o\'tkazmasi', 'INV-2024-005', -8, 'Tasdiqlangan'],
        ['Chiqim', 'Marketing xarajati', 8500000, 'Iyun oylik reklama kampaniyasi', 'Marketing Bo\'limi', 'Naqd', 'MKT-2024-006', -2, 'Kutilmoqda'],
      ];
      for (const [type, cat, amount, desc, dept, method, ref, days, status] of finance) {
        await c.query(`INSERT INTO bc_finance (type,category,amount,description,department,payment_method,reference_no,date,status) VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE+$8,$9)`,
          [type, cat, amount, desc, dept, method, ref, days, status]);
      }

      // Tasks
      const tasks = [
        ['Yillik moliyaviy hisobot tayyorlash', 'Q2 2024 moliyaviy hisobotni auditorlarga taqdim etish uchun tayyorlash', 'Toshmatov Bekzod', 'Azimov Behruz', 'Moliya Bo\'limi', 'Yuqori', 'Jarayonda', 75, 7],
        ['CRM tizimiga 50 ta yangi mijoz kiritish', 'Savdo bo\'limining potensial mijozlar bazasini yangilash', 'Rahimova Dilnoza', 'Azimov Behruz', 'Savdo Bo\'limi', 'Yuqori', 'Jarayonda', 40, 10],
        ['3 ta yangi dasturchi yollash', 'IT bo\'limi uchun React va Node.js bilgan dasturchilar topish', 'Salimova Nodira', 'Azimov Behruz', 'HR Bo\'limi', 'Yuqori', 'Yangi', 0, 14],
        ['Inventar tekshiruvi o\'tkazish', 'Omborxonadagi barcha jihozlarni sanash va hisobot tayyorlash', 'Karimov Jasur', 'Salimova Nodira', 'Omborxona', 'Oddiy', 'Bajarildi', 100, -2],
        ['Korporativ veb-sayt yangilash', 'Yangi dizayn va mahsulot sahifalarini qo\'shish', 'Yusupova Malika', 'Rahimova Dilnoza', 'IT Bo\'limi', 'Past', 'Yangi', 0, 21],
        ['Xodimlar o\'quv seminari', 'Microsoft 365 va korporativ dasturlar bo\'yicha trening', 'Xolmatov Sherzod', 'Salimova Nodira', 'Marketing Bo\'limi', 'Oddiy', 'Bekor qilindi', 0, 3],
        ['Q3 Marketing strategiyasi', 'Keyingi chorak uchun reklama va SMM rejasi tuzish', 'Xolmatov Sherzod', 'Azimov Behruz', 'Marketing Bo\'limi', 'Yuqori', 'Yangi', 0, 18],
        ['Server zaxira nusxasini sozlash', 'Har kuni avtomatik backup tizimini o\'rnatish', 'Yusupova Malika', 'Yusupova Malika', 'IT Bo\'limi', 'Yuqori', 'Jarayonda', 60, 5],
      ];
      for (const [title, desc, assignTo, assignBy, dept, priority, status, progress, days] of tasks) {
        await c.query(`INSERT INTO bc_tasks (title,description,assigned_to,assigned_by,department,priority,status,progress,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE+$9)`,
          [title, desc, assignTo, assignBy, dept, priority, status, progress, days]);
      }

      // Clients
      const clients = [
        ['GlobalTrade LLC', 'Alisher Umarov', 'alisher@globaltrade.uz', '+998 71 234 56 78', 'Toshkent, Yunusobod tumani, 15-uy', 'Savdo va logistika', 'Faol', 42000000, 'Referral', 'VIP mijoz, yillik hamkorlik'],
        ['UzTech Solutions', 'Mirzo Kamolov', 'mirzo@uztech.uz', '+998 71 345 67 89', 'Toshkent, Chilonzor, Bunyodkor ko\'ch.', 'Axborot texnologiyalari', 'Faol', 25000000, 'Veb-sayt', 'IT xizmat shartnomasi'],
        ['Anor Group', 'Sherzod Tursunov', 'info@anorgroup.uz', '+998 71 456 78 90', 'Samarqand, Registon ko\'ch.', 'Oziq-ovqat sanoati', 'Faol', 28000000, 'Ko\'rgazma', 'Mahsulot yetkazib berish'],
        ['NovaTech Industries', 'Elena Smirnova', 'elena@novatech.ru', '+7 926 123 45 67', 'Toshkent, Mirzo Ulugbek', 'Ishlab chiqarish', 'Faol', 18000000, 'Sovuq murojaat', 'Oylik xizmat shartnomasi'],
        ['Silk Road Partners', 'Bahrom Nazarov', 'bahrom@silkroad.uz', '+998 93 567 89 01', 'Buxoro, Mustaqillik ko\'ch.', 'Turizm va mehmonxona', 'Kutilmoqda', 0, 'Tavsiya', 'Yangi aloqa, muzokaralar jarayonida'],
        ['AgroUz Farm', 'Dilshod Ergashev', 'dilshod@agro.uz', '+998 95 678 90 12', 'Farg\'ona viloyati', 'Qishloq xo\'jaligi', 'Faol', 12000000, 'Ko\'rgazma', 'Qishloq xo\'jaligi texnologiyalari'],
        ['ZaminSoft', 'Kamol Xasanov', 'kamol@zaminsoft.uz', '+998 94 789 01 23', 'Toshkent, IT Park', 'Dasturiy ta\'minot', 'Nofaol', 0, 'Veb-sayt', 'Eski hamkor, faollik yo\'q'],
      ];
      for (const [cn, cp, em, ph, addr, ind, status, cv, src, notes] of clients) {
        await c.query(`INSERT INTO bc_clients (company_name,contact_person,email,phone,address,industry,status,contract_value,source,notes,last_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_DATE-FLOOR(RANDOM()*30)::INT)`,
          [cn, cp, em, ph, addr, ind, status, cv, src, notes]);
      }

      // Contracts
      const contracts = [
        ['GlobalTrade Yillik Hamkorlik Shartnomasi', 'GlobalTrade LLC', 'SHN-2024-001', 42000000, 38000000, -60, 305, 'Faol', 'Xizmat', 'Yillik IT va logistika qo\'llab-quvvatlash', 'Rahimova Dilnoza'],
        ['UzTech IT Support Shartnomasi', 'UzTech Solutions', 'SHN-2024-002', 25000000, 20000000, -30, 335, 'Faol', 'Xizmat', 'IT infratuzilma monitoring va qo\'llab-quvvatlash', 'Yusupova Malika'],
        ['Anor Group Mahsulot Yetkazib Berish', 'Anor Group', 'SHN-2024-003', 28000000, 28000000, -90, 275, 'Bajarildi', 'Yetkazib berish', 'Mahsulot yetkazib berish 6 oylik shartnoma', 'Karimov Jasur'],
        ['NovaTech Konsalting Shartnomasi', 'NovaTech Industries', 'SHN-2024-004', 18000000, 9000000, 15, 195, 'Faol', 'Konsalting', 'Biznes tahlil va tashkiliy maslahat', 'Rahimova Dilnoza'],
        ['Silk Road Partners - Dastlabki Shartnoma', 'Silk Road Partners', 'SHN-2024-005', 8500000, 0, 20, 200, 'Kutilmoqda', 'Xizmat', 'Turizm menejmenti dasturlash xizmati', 'Yusupova Malika'],
        ['AgroUz Qishloq Xo\'jaligi Shartnomasi', 'AgroUz Farm', 'SHN-2024-006', 12000000, 12000000, -120, 245, 'Faol', 'Yetkazib berish', 'Agro texnologiyalar va monitoring', 'Karimov Jasur'],
      ];
      for (const [title, cn, cno, amount, paid, startDay, endDay, status, type, desc, resp] of contracts) {
        await c.query(`INSERT INTO bc_contracts (title,client_name,contract_no,amount,paid_amount,start_date,end_date,status,type,description,responsible) VALUES ($1,$2,$3,$4,$5,CURRENT_DATE+$6,CURRENT_DATE+$7,$8,$9,$10,$11)`,
          [title, cn, cno, amount, paid, startDay, endDay, status, type, desc, resp]);
      }

      // Activity log seed
      const logs = [
        ['Azimov Behruz', 'login', 'Autentifikatsiya', 'Tizimga muvaffaqiyatli kirdi'],
        ['Salimova Nodira', 'create', 'Xodimlar', '8 ta yangi xodim qo\'shildi'],
        ['Toshmatov Bekzod', 'create', 'Moliya', '10 ta moliyaviy tranzaksiya kiritildi'],
        ['Rahimova Dilnoza', 'create', 'Mijozlar', '7 ta yangi mijoz ro\'yxatga olindi'],
        ['Karimov Jasur', 'update', 'Inventar', 'Mahsulotlar ro\'yxati yangilandi'],
      ];
      for (const [user, action, module, desc] of logs) {
        await c.query(`INSERT INTO bc_activity_log (user_name,action,module,description) VALUES ($1,$2,$3,$4)`, [user, action, module, desc]);
      }

      console.log('✅ Seed data inserted successfully');
    }

    console.log('✅ BizCore DB ready');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  } finally {
    c.release();
  }
}

/* ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────── */
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Autentifikatsiya talab etiladi' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati o\'tgan' });
  }
};

/* ─── ACTIVITY LOG ─────────────────────────────────────────────────────────── */
const logActivity = async (userName, action, module, description) => {
  try { await pool.query('INSERT INTO bc_activity_log (user_name,action,module,description) VALUES ($1,$2,$3,$4)', [userName, action, module, description]); }
  catch {}
};

/* ─── AUTH ROUTES ──────────────────────────────────────────────────────────── */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email va parol kerak' });
  try {
    const r = await pool.query('SELECT * FROM bc_users WHERE email=$1', [email.toLowerCase().trim()]);
    if (!r.rows[0]) return res.status(401).json({ error: 'Bunday foydalanuvchi topilmadi' });
    const valid = await bcrypt.compare(password, r.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Parol noto\'g\'ri' });
    if (r.rows[0].status === 'Nofaol') return res.status(403).json({ error: 'Hisobingiz faol emas' });
    const { password: _, ...user } = r.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.full_name }, JWT_SECRET, { expiresIn: '24h' });
    await logActivity(user.full_name, 'login', 'Autentifikatsiya', `${user.role} tizimga kirdi`);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const r = await pool.query('SELECT id,full_name,email,role,department,phone,salary,status,hire_date,created_at FROM bc_users WHERE id=$1', [req.user.id]);
  res.json(r.rows[0] || null);
});

/* ─── DASHBOARD ────────────────────────────────────────────────────────────── */
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const [users, depts, products, finance, tasks, clients, contracts, logs, monthlyFinance, lowStock] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status=\'Faol\' THEN 1 END) as active FROM bc_users'),
      pool.query('SELECT COUNT(*) FROM bc_departments WHERE status=\'Faol\''),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status=\'Kam qoldi\' THEN 1 END) as low FROM bc_products'),
      pool.query('SELECT COALESCE(SUM(CASE WHEN type=\'Kirim\' AND status=\'Tasdiqlangan\' THEN amount ELSE 0 END),0) as income, COALESCE(SUM(CASE WHEN type=\'Chiqim\' AND status=\'Tasdiqlangan\' THEN amount ELSE 0 END),0) as expense FROM bc_finance'),
      pool.query('SELECT status, COUNT(*) as count FROM bc_tasks GROUP BY status'),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status=\'Faol\' THEN 1 END) as active FROM bc_clients'),
      pool.query('SELECT COUNT(*) as total, COALESCE(SUM(amount),0) as value, COALESCE(SUM(paid_amount),0) as paid FROM bc_contracts WHERE status IN (\'Faol\',\'Kutilmoqda\')'),
      pool.query('SELECT user_name, action, module, description, created_at FROM bc_activity_log ORDER BY created_at DESC LIMIT 10'),
      pool.query(`SELECT TO_CHAR(date,'Mon') as month, SUM(CASE WHEN type='Kirim' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='Chiqim' THEN amount ELSE 0 END) as expense FROM bc_finance WHERE date >= CURRENT_DATE - 180 AND status='Tasdiqlangan' GROUP BY TO_CHAR(date,'Mon'), DATE_TRUNC('month',date) ORDER BY DATE_TRUNC('month',date)`),
      pool.query("SELECT name, quantity, min_quantity, unit FROM bc_products WHERE status='Kam qoldi' OR quantity <= min_quantity LIMIT 5"),
    ]);

    const taskStats = {};
    tasks.rows.forEach(r => { taskStats[r.status] = parseInt(r.count); });
    const inc = parseFloat(finance.rows[0].income);
    const exp = parseFloat(finance.rows[0].expense);

    res.json({
      users: { total: parseInt(users.rows[0].total), active: parseInt(users.rows[0].active) },
      departments: parseInt(depts.rows[0].count),
      products: { total: parseInt(products.rows[0].total), low: parseInt(products.rows[0].low) },
      finance: { income: inc, expense: exp, profit: inc - exp, margin: inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0 },
      tasks: taskStats,
      clients: { total: parseInt(clients.rows[0].total), active: parseInt(clients.rows[0].active) },
      contracts: { total: parseInt(contracts.rows[0].total), value: parseFloat(contracts.rows[0].value), paid: parseFloat(contracts.rows[0].paid) },
      recentActivity: logs.rows,
      monthlyFinance: monthlyFinance.rows.map(r => ({ month: r.month, income: parseFloat(r.income), expense: parseFloat(r.expense) })),
      lowStock: lowStock.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── RELATIONAL INTEGRITY SYNC HELPER ──────────────────────────────────────── */
async function syncRelationalData(table) {
  try {
    if (table === 'bc_users') {
      await pool.query(`UPDATE bc_departments d SET employee_count = (SELECT COUNT(*) FROM bc_users u WHERE u.department = d.name)`);
    } else if (table === 'bc_contracts') {
      await pool.query(`UPDATE bc_clients c SET contract_value = (SELECT COALESCE(SUM(amount), 0) FROM bc_contracts con WHERE con.client_name = c.company_name)`);
    }
  } catch (err) {
    console.error('Error syncing relational data:', err.message);
  }
}

/* ─── GENERIC CRUD FACTORY ─────────────────────────────────────────────────── */
function makeCrud(table, fields, searchCols, insertFn, updateFn, label) {
  const router = express.Router();

  router.get('/', auth, async (req, res) => {
    try {
      const { search, status, department, type } = req.query;
      let q = `SELECT * FROM ${table}`;
      const conditions = [];
      const vals = [];
      let idx = 1;
      if (search && searchCols.length) {
        conditions.push(`(${searchCols.map(c => `${c}::TEXT ILIKE $${idx}`).join(' OR ')})`);
        vals.push(`%${search}%`); idx++;
      }
      if (status) { conditions.push(`status = $${idx}`); vals.push(status); idx++; }
      if (department) { conditions.push(`department = $${idx}`); vals.push(department); idx++; }
      if (type) { conditions.push(`type = $${idx}`); vals.push(type); idx++; }
      if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
      q += ' ORDER BY created_at DESC';
      const r = await pool.query(q, vals);
      res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/:id', auth, async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Topilmadi' });
      res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/', auth, async (req, res) => {
    try {
      const r = await insertFn(req.body, pool, req.user);
      await syncRelationalData(table);
      await logActivity(req.user.name || req.user.email, 'create', label, `Yangi ${label.toLowerCase()} qo'shildi`);
      res.status(201).json(r);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  router.put('/:id', auth, async (req, res) => {
    try {
      const r = await updateFn(req.params.id, req.body, pool, req.user);
      await syncRelationalData(table);
      await logActivity(req.user.name || req.user.email, 'update', label, `${label} ma'lumotlari yangilandi`);
      res.json(r);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  router.delete('/:id', auth, async (req, res) => {
    try {
      if (table === 'bc_departments') {
        const dept = await pool.query('SELECT name FROM bc_departments WHERE id=$1', [req.params.id]);
        if (dept.rows[0]) {
          const deptName = dept.rows[0].name;
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            await client.query('UPDATE bc_users SET department=\'Boshqaruv\' WHERE department=$1', [deptName]);
            await client.query('UPDATE bc_tasks SET department=\'Boshqaruv\' WHERE department=$1', [deptName]);
            await client.query('UPDATE bc_finance SET department=\'Boshqaruv\' WHERE department=$1', [deptName]);
            await client.query('DELETE FROM bc_departments WHERE id=$1', [req.params.id]);
            await client.query('COMMIT');
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        } else {
          return res.status(404).json({ error: 'Topilmadi' });
        }
      } else if (table === 'bc_clients') {
        const clientRow = await pool.query('SELECT company_name FROM bc_clients WHERE id=$1', [req.params.id]);
        if (clientRow.rows[0]) {
          const compName = clientRow.rows[0].company_name;
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            await client.query('UPDATE bc_contracts SET client_name=NULL WHERE client_name=$1', [compName]);
            await client.query('DELETE FROM bc_clients WHERE id=$1', [req.params.id]);
            await client.query('COMMIT');
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        } else {
          return res.status(404).json({ error: 'Topilmadi' });
        }
      } else {
        await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
      }
      await syncRelationalData(table);
      await logActivity(req.user.name || req.user.email, 'delete', label, `${label} o'chirildi`);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
}

/* ─── USERS ────────────────────────────────────────────────────────────────── */
app.use('/api/users', makeCrud(
  'bc_users',
  ['id','full_name','email','role','department','phone','salary','status','hire_date','created_at'],
  ['full_name','email','role','department','phone'],
  async (data, pool, user) => {
    const { full_name, email, password, role, department, phone, salary, status, hire_date } = data;
    if (!full_name || !email) throw new Error('F.I.O va email majburiy');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Email manzili noto\'g\'ri formatda');
    if (parseFloat(salary) < 0) throw new Error('Maosh manfiy bo\'lishi mumkin emas');
    const hash = await bcrypt.hash(password || '123456', 10);
    const r = await pool.query(`INSERT INTO bc_users (full_name,email,password,role,department,phone,salary,status,hire_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,full_name,email,role,department,phone,salary,status,hire_date,created_at`,
      [full_name, email.toLowerCase().trim(), hash, role || 'Xodim', department || 'Boshqaruv', phone, parseFloat(salary) || 0, status || 'Faol', hire_date || new Date().toISOString().split('T')[0]]);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { full_name, email, role, department, phone, salary, status, hire_date } = data;
    if (!full_name || !email) throw new Error('F.I.O va email majburiy');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Email manzili noto\'g\'ri formatda');
    if (parseFloat(salary) < 0) throw new Error('Maosh manfiy bo\'lishi mumkin emas');
    const r = await pool.query(`UPDATE bc_users SET full_name=$1,email=$2,role=$3,department=$4,phone=$5,salary=$6,status=$7,hire_date=$8 WHERE id=$9 RETURNING id,full_name,email,role,department,phone,salary,status,hire_date,created_at`,
      [full_name, email.toLowerCase().trim(), role, department, phone, parseFloat(salary) || 0, status, hire_date, id]);
    if (!r.rows[0]) throw new Error('Topilmadi');
    await pool.query(`UPDATE bc_departments d SET employee_count = (SELECT COUNT(*) FROM bc_users u WHERE u.department = d.name)`);
    return r.rows[0];
  },
  'Xodimlar'
));

/* ─── DEPARTMENTS ──────────────────────────────────────────────────────────── */
app.use('/api/departments', makeCrud(
  'bc_departments', [], ['name','manager_name','location'],
  async (data, pool) => {
    const { name, manager_name, budget, description, location, status } = data;
    if (!name) throw new Error('Bo\'lim nomi majburiy');
    if (parseFloat(budget) < 0) throw new Error('Byudjet manfiy bo\'lishi mumkin emas');
    const r = await pool.query(`INSERT INTO bc_departments (name,manager_name,budget,description,location,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, manager_name, parseFloat(budget) || 0, description, location, status || 'Faol']);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { name, manager_name, budget, description, location, status } = data;
    if (!name) throw new Error('Bo\'lim nomi majburiy');
    if (parseFloat(budget) < 0) throw new Error('Byudjet manfiy bo\'lishi mumkin emas');

    // Check cascade renaming
    const oldDept = await pool.query('SELECT name FROM bc_departments WHERE id=$1', [id]);
    if (!oldDept.rows[0]) throw new Error('Topilmadi');
    const oldName = oldDept.rows[0].name;

    if (name !== oldName) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE bc_users SET department=$1 WHERE department=$2', [name, oldName]);
        await client.query('UPDATE bc_tasks SET department=$1 WHERE department=$2', [name, oldName]);
        await client.query('UPDATE bc_finance SET department=$1 WHERE department=$2', [name, oldName]);
        await client.query('UPDATE bc_departments SET name=$1,manager_name=$2,budget=$3,description=$4,location=$5,status=$6 WHERE id=$7',
          [name, manager_name, parseFloat(budget) || 0, description, location, status, id]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      await pool.query(`UPDATE bc_departments SET name=$1,manager_name=$2,budget=$3,description=$4,location=$5,status=$6 WHERE id=$7`,
        [name, manager_name, parseFloat(budget) || 0, description, location, status, id]);
    }
    return { id, name, manager_name, budget, description, location, status };
  },
  'Bo\'limlar'
));

/* ─── PRODUCTS ─────────────────────────────────────────────────────────────── */
app.use('/api/products', makeCrud(
  'bc_products', [], ['name','category','supplier','location'],
  async (data, pool) => {
    const { name, category, quantity, min_quantity, unit, price, supplier, location, status, notes } = data;
    if (!name) throw new Error('Mahsulot nomi majburiy');
    const qty = parseInt(quantity) || 0;
    const minQ = parseInt(min_quantity) || 5;
    const prc = parseFloat(price) || 0;
    if (qty < 0) throw new Error('Miqdor manfiy bo\'lishi mumkin emas');
    if (minQ < 0) throw new Error('Minimal zaxira manfiy bo\'lishi mumkin emas');
    if (prc < 0) throw new Error('Narx manfiy bo\'lishi mumkin emas');
    const autoStatus = qty === 0 ? 'Tugagan' : qty <= minQ ? 'Kam qoldi' : status || 'Mavjud';
    const r = await pool.query(`INSERT INTO bc_products (name,category,quantity,min_quantity,unit,price,supplier,location,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, category, qty, minQ, unit || 'dona', prc, supplier, location, autoStatus, notes]);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { name, category, quantity, min_quantity, unit, price, supplier, location, status, notes } = data;
    if (!name) throw new Error('Mahsulot nomi majburiy');
    const qty = parseInt(quantity) || 0;
    const minQ = parseInt(min_quantity) || 5;
    const prc = parseFloat(price) || 0;
    if (qty < 0) throw new Error('Miqdor manfiy bo\'lishi mumkin emas');
    if (minQ < 0) throw new Error('Minimal zaxira manfiy bo\'lishi mumkin emas');
    if (prc < 0) throw new Error('Narx manfiy bo\'lishi mumkin emas');
    const autoStatus = qty === 0 ? 'Tugagan' : qty <= minQ ? 'Kam qoldi' : status || 'Mavjud';
    const r = await pool.query(`UPDATE bc_products SET name=$1,category=$2,quantity=$3,min_quantity=$4,unit=$5,price=$6,supplier=$7,location=$8,status=$9,notes=$10 WHERE id=$11 RETURNING *`,
      [name, category, qty, minQ, unit, prc, supplier, location, autoStatus, notes, id]);
    if (!r.rows[0]) throw new Error('Topilmadi'); return r.rows[0];
  },
  'Inventar'
));

/* ─── FINANCE ──────────────────────────────────────────────────────────────── */
app.use('/api/finance', makeCrud(
  'bc_finance', [], ['type','category','description','department','reference_no'],
  async (data, pool, user) => {
    const { type, category, amount, description, department, payment_method, reference_no, date, status } = data;
    if (!type || !amount) throw new Error('Tur va summa majburiy');
    if (!['Kirim', 'Chiqim'].includes(type)) throw new Error('Tur: Kirim yoki Chiqim bo\'lishi kerak');
    if (parseFloat(amount) <= 0) throw new Error('Summa noldan katta bo\'lishi kerak');
    const r = await pool.query(`INSERT INTO bc_finance (type,category,amount,description,department,payment_method,reference_no,date,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [type, category, parseFloat(amount), description, department, payment_method || 'Naqd', reference_no, date || new Date().toISOString().split('T')[0], status || 'Tasdiqlangan', user?.name]);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { type, category, amount, description, department, payment_method, reference_no, date, status } = data;
    if (!type || !amount) throw new Error('Tur va summa majburiy');
    if (!['Kirim', 'Chiqim'].includes(type)) throw new Error('Tur: Kirim yoki Chiqim bo\'lishi kerak');
    if (parseFloat(amount) <= 0) throw new Error('Summa noldan katta bo\'lishi kerak');
    const r = await pool.query(`UPDATE bc_finance SET type=$1,category=$2,amount=$3,description=$4,department=$5,payment_method=$6,reference_no=$7,date=$8,status=$9 WHERE id=$10 RETURNING *`,
      [type, category, parseFloat(amount), description, department, payment_method, reference_no, date, status, id]);
    if (!r.rows[0]) throw new Error('Topilmadi'); return r.rows[0];
  },
  'Moliya'
));

/* ─── TASKS ────────────────────────────────────────────────────────────────── */
app.use('/api/tasks', makeCrud(
  'bc_tasks', [], ['title','assigned_to','assigned_by','department'],
  async (data, pool) => {
    const { title, description, assigned_to, assigned_by, department, priority, status, progress, due_date, tags } = data;
    if (!title) throw new Error('Vazifa nomi majburiy');
    const prog = parseInt(progress) || 0;
    if (prog < 0 || prog > 100) throw new Error('Bajarilish progressi 0 va 100 orasida bo\'lishi kerak');
    const r = await pool.query(`INSERT INTO bc_tasks (title,description,assigned_to,assigned_by,department,priority,status,progress,due_date,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description, assigned_to, assigned_by, department, priority || 'Oddiy', status || 'Yangi', prog, due_date || null, tags]);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { title, description, assigned_to, assigned_by, department, priority, status, progress, due_date, tags } = data;
    const prog = parseInt(progress) || 0;
    if (prog < 0 || prog > 100) throw new Error('Bajarilish progressi 0 va 100 orasida bo\'lishi kerak');
    const r = await pool.query(`UPDATE bc_tasks SET title=$1,description=$2,assigned_to=$3,assigned_by=$4,department=$5,priority=$6,status=$7,progress=$8,due_date=$9,tags=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,
      [title, description, assigned_to, assigned_by, department, priority, status, prog, due_date || null, tags, id]);
    if (!r.rows[0]) throw new Error('Topilmadi'); return r.rows[0];
  },
  'Vazifalar'
));

/* ─── CLIENTS ──────────────────────────────────────────────────────────────── */
app.use('/api/clients', makeCrud(
  'bc_clients', [], ['company_name','contact_person','email','phone','industry'],
  async (data, pool) => {
    const { company_name, contact_person, email, phone, address, industry, status, contract_value, source, notes, last_contact } = data;
    if (!company_name) throw new Error('Kompaniya nomi majburiy');
    if (parseFloat(contract_value) < 0) throw new Error('Shartnoma qiymati manfiy bo\'lishi mumkin emas');
    const r = await pool.query(`INSERT INTO bc_clients (company_name,contact_person,email,phone,address,industry,status,contract_value,source,notes,last_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [company_name, contact_person, email, phone, address, industry, status || 'Faol', parseFloat(contract_value) || 0, source, notes, last_contact || null]);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { company_name, contact_person, email, phone, address, industry, status, contract_value, source, notes, last_contact } = data;
    if (!company_name) throw new Error('Kompaniya nomi majburiy');
    if (parseFloat(contract_value) < 0) throw new Error('Shartnoma qiymati manfiy bo\'lishi mumkin emas');

    // Cascade rename
    const oldClient = await pool.query('SELECT company_name FROM bc_clients WHERE id=$1', [id]);
    if (!oldClient.rows[0]) throw new Error('Topilmadi');
    const oldName = oldClient.rows[0].company_name;

    if (company_name !== oldName) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE bc_contracts SET client_name=$1 WHERE client_name=$2', [company_name, oldName]);
        await client.query('UPDATE bc_clients SET company_name=$1,contact_person=$2,email=$3,phone=$4,address=$5,industry=$6,status=$7,contract_value=$8,source=$9,notes=$10,last_contact=$11 WHERE id=$12',
          [company_name, contact_person, email, phone, address, industry, status, parseFloat(contract_value) || 0, source, notes, last_contact || null, id]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      await pool.query(`UPDATE bc_clients SET company_name=$1,contact_person=$2,email=$3,phone=$4,address=$5,industry=$6,status=$7,contract_value=$8,source=$9,notes=$10,last_contact=$11 WHERE id=$12`,
        [company_name, contact_person, email, phone, address, industry, status, parseFloat(contract_value) || 0, source, notes, last_contact || null, id]);
    }
    return { id, company_name, contact_person, email, phone, address, industry, status, contract_value, source, notes, last_contact };
  },
  'Mijozlar'
));

/* ─── CONTRACTS ────────────────────────────────────────────────────────────── */
app.use('/api/contracts', makeCrud(
  'bc_contracts', [], ['title','client_name','contract_no','responsible'],
  async (data, pool) => {
    const { title, client_name, contract_no, amount, paid_amount, start_date, end_date, status, type, description, responsible } = data;
    if (!title) throw new Error('Shartnoma nomi majburiy');
    const amt = parseFloat(amount) || 0;
    const paid = parseFloat(paid_amount) || 0;
    if (amt < 0) throw new Error('Shartnoma summasi manfiy bo\'lishi mumkin emas');
    if (paid < 0) throw new Error('To\'langan summa manfiy bo\'lishi mumkin emas');
    if (paid > amt) throw new Error('To\'langan summa shartnoma summasidan katta bo\'lishi mumkin emas');
    const r = await pool.query(`INSERT INTO bc_contracts (title,client_name,contract_no,amount,paid_amount,start_date,end_date,status,type,description,responsible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, client_name, contract_no, amt, paid, start_date || null, end_date || null, status || 'Kutilmoqda', type, description, responsible]);
    return r.rows[0];
  },
  async (id, data, pool) => {
    const { title, client_name, contract_no, amount, paid_amount, start_date, end_date, status, type, description, responsible } = data;
    if (!title) throw new Error('Shartnoma nomi majburiy');
    const amt = parseFloat(amount) || 0;
    const paid = parseFloat(paid_amount) || 0;
    if (amt < 0) throw new Error('Shartnoma summasi manfiy bo\'lishi mumkin emas');
    if (paid < 0) throw new Error('To\'langan summa manfiy bo\'lishi mumkin emas');
    if (paid > amt) throw new Error('To\'langan summa shartnoma summasidan katta bo\'lishi mumkin emas');
    const r = await pool.query(`UPDATE bc_contracts SET title=$1,client_name=$2,contract_no=$3,amount=$4,paid_amount=$5,start_date=$6,end_date=$7,status=$8,type=$9,description=$10,responsible=$11 WHERE id=$12 RETURNING *`,
      [title, client_name, contract_no, amt, paid, start_date || null, end_date || null, status, type, description, responsible, id]);
    if (!r.rows[0]) throw new Error('Topilmadi'); return r.rows[0];
  },
  'Shartnomalar'
));

/* ─── ACTIVITY LOG ─────────────────────────────────────────────────────────── */
app.get('/api/activity', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM bc_activity_log ORDER BY created_at DESC LIMIT 50');
  res.json(r.rows);
});

/* ─── STATS ─────────────────────────────────────────────────────────────────── */
app.get('/api/stats/finance-monthly', auth, async (req, res) => {
  const r = await pool.query(`
    SELECT TO_CHAR(date,'YYYY-MM') as month,
      SUM(CASE WHEN type='Kirim' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='Chiqim' THEN amount ELSE 0 END) as expense
    FROM bc_finance WHERE status='Tasdiqlangan'
    GROUP BY TO_CHAR(date,'YYYY-MM') ORDER BY month DESC LIMIT 6`);
  res.json(r.rows.reverse());
});

/* ─── START ─────────────────────────────────────────────────────────────────── */
// Run initDB on startup regardless of environment
initDB().catch(err => console.error('DB init error:', err));

if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 BizCore API → http://localhost:${PORT}`);
  });
}

module.exports = app;
