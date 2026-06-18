import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, Drawer, AppBar, Toolbar,
  Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Chip, Card, CardContent, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, Tooltip, Badge, Divider,
  LinearProgress, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Fade, Grow, Collapse,
  Alert, Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  AccountBalance as FinanceIcon,
  Assignment as TaskIcon,
  Handshake as ClientIcon,
  Description as ContractIcon,
  DarkMode, LightMode, Logout, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, Search as SearchIcon, TrendingUp, TrendingDown,
  CheckCircle, PendingActions, Warning, Groups, MonetizationOn,
  Storefront, AssignmentTurnedIn, Close as CloseIcon,
  PictureAsPdf as PdfIcon, Refresh as RefreshIcon,
  ArrowUpward, ArrowDownward, BarChart as ChartIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Toaster, toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from './api.js';

const DRAWER_WIDTH = 260;
const ROLES = ['Direktor', 'HR Menejer', 'Moliya Menejeri', 'Savdo Menejeri', 'Ombor Boshlig\'i', 'Xodim'];
const DEPTS = ['Boshqaruv', 'HR Bo\'limi', 'Moliya Bo\'limi', 'Savdo Bo\'limi', 'Omborxona', 'IT Bo\'limi'];
const PRIORITIES = ['Yuqori', 'Oddiy', 'Past'];
const TASK_STATUSES = ['Yangi', 'Jarayonda', 'Bajarildi', 'Bekor qilindi'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── FORMAT ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0)) + ' so\'m';
const fmtShort = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mln';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' ming';
  return n;
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, sub, trend }) => (
  <Grow in timeout={600}>
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`, border: `1px solid ${color}30`, borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${color}25` } }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ bgcolor: `${color}20`, borderRadius: 2, p: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
          </Box>
          {trend !== undefined && (
            <Chip
              size="small"
              icon={trend >= 0 ? <ArrowUpward sx={{ fontSize: '14px !important' }} /> : <ArrowDownward sx={{ fontSize: '14px !important' }} />}
              label={`${Math.abs(trend)}%`}
              sx={{ bgcolor: trend >= 0 ? '#10b98120' : '#ef444420', color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, border: 'none' }}
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color, mb: 0.5 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
        {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
      </CardContent>
    </Card>
  </Grow>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@bizcore.uz');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return toast.error('Email va parolni kiriting!');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('bizcore_token', res.data.token);
      localStorage.setItem('bizcore_user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      toast.success(`Xush kelibsiz, ${res.data.user.full_name}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login xatosi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <Fade in timeout={800}>
        <Card sx={{ width: 420, p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 8px 20px rgba(99,102,241,0.4)' }}>
              <BusinessIcon sx={{ color: '#fff', fontSize: 36 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>BizCore</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>Korxona Boshqaruv Tizimi</Typography>
          </Box>
          <TextField fullWidth label="Email" variant="outlined" value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', '&.Mui-focused': { color: '#6366f1' } } }} />
          <TextField fullWidth label="Parol" type="password" variant="outlined" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} sx={{ mb: 3, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', '&.Mui-focused': { color: '#6366f1' } } }} />
          <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', transform: 'translateY(-1px)', boxShadow: '0 8px 25px rgba(99,102,241,0.4)' }, transition: 'all 0.2s' }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Kirish'}
          </Button>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center' }}>
              Demo: admin@bizcore.uz / admin123
            </Typography>
          </Box>
        </Card>
      </Fade>
    </Box>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const barData = stats ? [
    { name: 'Yanvar', daromad: stats.totalIncome * 0.12, xarajat: stats.totalExpense * 0.10 },
    { name: 'Fevral', daromad: stats.totalIncome * 0.14, xarajat: stats.totalExpense * 0.13 },
    { name: 'Mart', daromad: stats.totalIncome * 0.16, xarajat: stats.totalExpense * 0.15 },
    { name: 'Aprel', daromad: stats.totalIncome * 0.18, xarajat: stats.totalExpense * 0.17 },
    { name: 'May', daromad: stats.totalIncome * 0.20, xarajat: stats.totalExpense * 0.20 },
    { name: 'Iyun', daromad: stats.totalIncome, xarajat: stats.totalExpense },
  ] : [];

  const pieData = stats ? [
    { name: 'Yangi', value: stats.taskStats?.['Yangi'] || 0 },
    { name: 'Jarayonda', value: stats.taskStats?.['Jarayonda'] || 0 },
    { name: 'Bajarildi', value: stats.taskStats?.['Bajarildi'] || 0 },
    { name: 'Bekor', value: stats.taskStats?.['Bekor qilindi'] || 0 },
  ].filter(d => d.value > 0) : [];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress sx={{ color: '#6366f1' }} size={50} /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Boshqaruv Paneli</Typography>
        <Typography color="text.secondary">Xush kelibsiz, {user?.full_name} — {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Jami Xodimlar" value={stats?.totalUsers || 0} icon={<PeopleIcon />} color="#6366f1" trend={12} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Jami Daromad" value={fmtShort(stats?.totalIncome)} icon={<TrendingUp />} color="#10b981" trend={8} sub="Joriy oy" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Jami Xarajat" value={fmtShort(stats?.totalExpense)} icon={<TrendingDown />} color="#f59e0b" trend={-3} sub="Joriy oy" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Sof Foyda" value={fmtShort(stats?.netProfit)} icon={<MonetizationOn />} color="#8b5cf6" trend={15} /></Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Bo'limlar" value={stats?.totalDepartments || 0} icon={<BusinessIcon />} color="#06b6d4" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Mahsulotlar" value={stats?.totalProducts || 0} icon={<InventoryIcon />} color="#f97316" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Mijozlar" value={stats?.totalClients || 0} icon={<ClientIcon />} color="#ec4899" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Faol Shartnomalar" value={stats?.activeContracts || 0} icon={<ContractIcon />} color="#14b8a6" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Moliyaviy Ko'rsatkichlar (6 oy)</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtShort(v)} />
                <RTooltip formatter={v => fmt(v)} />
                <Bar dataKey="daromad" name="Daromad" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="xarajat" name="Xarajat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Vazifalar Holati</Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <Typography color="text.secondary" textAlign="center" mt={6}>Vazifalar yo'q</Typography>}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── GENERIC CRUD TABLE ───────────────────────────────────────────────────────
const CrudPage = ({ title, endpoint, columns, FormComponent, searchKeys = [], pdfTitle, pdfColumns }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [delId, setDelId] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/api/${endpoint}`); setRows(r.data || []); }
    catch (e) { toast.error('Ma\'lumot yuklashda xato'); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = useMemo(() =>
    rows.filter(r => searchKeys.some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
  , [rows, search, searchKeys]);

  const handleSave = async (data) => {
    try {
      if (editRow?.id) {
        await api.put(`/api/${endpoint}/${editRow.id}`, data);
        toast.success('Yangilandi!');
      } else {
        await api.post(`/api/${endpoint}`, data);
        toast.success('Qo\'shildi!');
      }
      setOpen(false); setEditRow(null); fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Xato yuz berdi'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/${endpoint}/${delId}`);
      toast.success("O'chirildi!"); setDelId(null); fetch();
    } catch { toast.error("O'chirishda xato"); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(pdfTitle || title, 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, 14, 26);
    const body = filtered.map(r => (pdfColumns || columns.filter(c => c.key)).map(c => r[c.key] || ''));
    autoTable(doc, {
      head: [(pdfColumns || columns.filter(c => c.key)).map(c => c.label)],
      body,
      startY: 32,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 255] }
    });
    doc.save(`${pdfTitle || title}.pdf`);
    toast.success('PDF tayyor!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={800}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Izlash..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ width: 220 }} />
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={exportPDF} sx={{ borderColor: '#6366f1', color: '#6366f1', '&:hover': { borderColor: '#4f46e5', bgcolor: '#6366f110' } }}>PDF</Button>
          <Tooltip title={`Yangilash`}><IconButton onClick={fetch} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRow(null); setOpen(true); }}
            sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', '&:hover': { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }, fontWeight: 700 }}>
            Yangi
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(99,102,241,0.05)' }}>
                {columns.map(c => <TableCell key={c.key || c.label} sx={{ fontWeight: 700, color: '#6366f1', borderBottom: '2px solid rgba(99,102,241,0.2)', whiteSpace: 'nowrap' }}>{c.label}</TableCell>)}
                <TableCell sx={{ fontWeight: 700, color: '#6366f1', borderBottom: '2px solid rgba(99,102,241,0.2)', width: 100 }}>Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && !loading ? (
                <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              ) : filtered.map((row, i) => (
                <TableRow key={row.id || i} sx={{ '&:hover': { bgcolor: 'rgba(99,102,241,0.03)' }, transition: 'background 0.15s' }}>
                  {columns.map(c => (
                    <TableCell key={c.key || c.label} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                    </TableCell>
                  ))}
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tooltip title="Tahrirlash">
                      <IconButton size="small" onClick={() => { setEditRow(row); setOpen(true); }} sx={{ color: '#6366f1', mr: 0.5 }}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="O'chirish">
                      <IconButton size="small" onClick={() => setDelId(row.id)} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">Jami: {filtered.length} ta yozuv</Typography>
        </Box>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); setEditRow(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editRow ? 'Tahrirlash' : 'Yangi qo\'shish'}
          <IconButton onClick={() => { setOpen(false); setEditRow(null); }} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <FormComponent initial={editRow} onSave={handleSave} onClose={() => { setOpen(false); setEditRow(null); }} />
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!delId} onClose={() => setDelId(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle fontWeight={700}>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent><Typography>Bu yozuvni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDelId(null)}>Bekor qilish</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ fontWeight: 700 }}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── STATUS CHIP ──────────────────────────────────────────────────────────────
const StatusChip = ({ value }) => {
  const map = {
    'Faol': { color: '#10b981', bg: '#10b98115' },
    'Yangi': { color: '#6366f1', bg: '#6366f115' },
    'Jarayonda': { color: '#f59e0b', bg: '#f59e0b15' },
    'Bajarildi': { color: '#10b981', bg: '#10b98115' },
    'Bekor qilindi': { color: '#ef4444', bg: '#ef444415' },
    'Kutilmoqda': { color: '#f59e0b', bg: '#f59e0b15' },
    'Tasdiqlangan': { color: '#10b981', bg: '#10b98115' },
    'Mavjud': { color: '#10b981', bg: '#10b98115' },
    'Kam qoldi': { color: '#f59e0b', bg: '#f59e0b15' },
    'Tugagan': { color: '#ef4444', bg: '#ef444415' },
  };
  const c = map[value] || { color: '#64748b', bg: '#64748b15' };
  return <Chip label={value || '—'} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, border: 'none', fontSize: 11 }} />;
};

// ─── PRIORITY CHIP ────────────────────────────────────────────────────────────
const PriorityChip = ({ value }) => {
  const map = { 'Yuqori': '#ef4444', 'Oddiy': '#6366f1', 'Past': '#10b981' };
  const c = map[value] || '#64748b';
  return <Chip label={value} size="small" sx={{ bgcolor: `${c}15`, color: c, fontWeight: 600, border: 'none', fontSize: 11 }} />;
};

// ─── FORMS ────────────────────────────────────────────────────────────────────
const UserForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ full_name: '', email: '', password: '', role: 'Xodim', department: 'Boshqaruv', phone: '', salary: '', status: 'Faol', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12}><TextField fullWidth label="F.I.O" value={d.full_name} onChange={e => setD({ ...d, full_name: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={d.email} onChange={e => setD({ ...d, email: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Parol" type="password" placeholder={initial ? '(o\'zgartirmaslik uchun bo\'sh)' : ''} value={d.password} onChange={e => setD({ ...d, password: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Lavozim</InputLabel><Select value={d.role} label="Lavozim" onChange={e => setD({ ...d, role: e.target.value })}>{ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Bo'lim</InputLabel><Select value={d.department} label="Bo'lim" onChange={e => setD({ ...d, department: e.target.value })}>{DEPTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Telefon" value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Maosh (so'm)" type="number" value={d.salary} onChange={e => setD({ ...d, salary: e.target.value })} /></Grid>
      <Grid item xs={12}><FormControl fullWidth><InputLabel>Holat</InputLabel><Select value={d.status} label="Holat" onChange={e => setD({ ...d, status: e.target.value })}>{['Faol', 'Nofaol', 'Ta\'tilda'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

const DeptForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ name: '', manager_name: '', budget: '', description: '', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12}><TextField fullWidth label="Bo'lim nomi" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Rahbar" value={d.manager_name} onChange={e => setD({ ...d, manager_name: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Byudjet (so'm)" type="number" value={d.budget} onChange={e => setD({ ...d, budget: e.target.value })} /></Grid>
      <Grid item xs={12}><TextField fullWidth label="Tavsif" multiline rows={3} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} /></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

const ProductForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ name: '', category: '', quantity: '', unit: 'dona', price: '', supplier: '', status: 'Mavjud', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12}><TextField fullWidth label="Mahsulot nomi" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Kategoriya" value={d.category} onChange={e => setD({ ...d, category: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Yetkazib beruvchi" value={d.supplier} onChange={e => setD({ ...d, supplier: e.target.value })} /></Grid>
      <Grid item xs={12} sm={4}><TextField fullWidth label="Miqdor" type="number" value={d.quantity} onChange={e => setD({ ...d, quantity: e.target.value })} /></Grid>
      <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>O'lchov</InputLabel><Select value={d.unit} label="O'lchov" onChange={e => setD({ ...d, unit: e.target.value })}>{['dona', 'kg', 'litr', 'metr', 'paket', 'quti'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12} sm={4}><TextField fullWidth label="Narx (so'm)" type="number" value={d.price} onChange={e => setD({ ...d, price: e.target.value })} /></Grid>
      <Grid item xs={12}><FormControl fullWidth><InputLabel>Holat</InputLabel><Select value={d.status} label="Holat" onChange={e => setD({ ...d, status: e.target.value })}>{['Mavjud', 'Kam qoldi', 'Tugagan'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

const FinanceForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ type: 'Kirim', category: '', amount: '', description: '', department: 'Boshqaruv', date: new Date().toISOString().split('T')[0], status: 'Tasdiqlangan', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Tur</InputLabel><Select value={d.type} label="Tur" onChange={e => setD({ ...d, type: e.target.value })}><MenuItem value="Kirim">Kirim</MenuItem><MenuItem value="Chiqim">Chiqim</MenuItem></Select></FormControl></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Kategoriya" value={d.category} onChange={e => setD({ ...d, category: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Summa (so'm)" type="number" value={d.amount} onChange={e => setD({ ...d, amount: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Bo'lim</InputLabel><Select value={d.department} label="Bo'lim" onChange={e => setD({ ...d, department: e.target.value })}>{DEPTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12}><TextField fullWidth label="Tavsif" multiline rows={2} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Sana" type="date" value={d.date} onChange={e => setD({ ...d, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
      <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Holat</InputLabel><Select value={d.status} label="Holat" onChange={e => setD({ ...d, status: e.target.value })}>{['Tasdiqlangan', 'Kutilmoqda', 'Bekor qilindi'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

const TaskForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ title: '', description: '', assigned_to: '', assigned_by: '', department: 'Boshqaruv', priority: 'Oddiy', status: 'Yangi', due_date: '', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12}><TextField fullWidth label="Vazifa nomi" value={d.title} onChange={e => setD({ ...d, title: e.target.value })} /></Grid>
      <Grid item xs={12}><TextField fullWidth label="Tavsif" multiline rows={2} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Kimga berildi" value={d.assigned_to} onChange={e => setD({ ...d, assigned_to: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Kim berdi" value={d.assigned_by} onChange={e => setD({ ...d, assigned_by: e.target.value })} /></Grid>
      <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Bo'lim</InputLabel><Select value={d.department} label="Bo'lim" onChange={e => setD({ ...d, department: e.target.value })}>{DEPTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Muhimlik</InputLabel><Select value={d.priority} label="Muhimlik" onChange={e => setD({ ...d, priority: e.target.value })}>{PRIORITIES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Holat</InputLabel><Select value={d.status} label="Holat" onChange={e => setD({ ...d, status: e.target.value })}>{TASK_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12}><TextField fullWidth label="Muddat" type="date" value={d.due_date ? d.due_date.split('T')[0] : ''} onChange={e => setD({ ...d, due_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

const ClientForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ company_name: '', contact_person: '', email: '', phone: '', address: '', status: 'Faol', contract_value: '', notes: '', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12}><TextField fullWidth label="Kompaniya nomi" value={d.company_name} onChange={e => setD({ ...d, company_name: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Mas'ul shaxs" value={d.contact_person} onChange={e => setD({ ...d, contact_person: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={d.email} onChange={e => setD({ ...d, email: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Telefon" value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Shartnoma summasi" type="number" value={d.contract_value} onChange={e => setD({ ...d, contract_value: e.target.value })} /></Grid>
      <Grid item xs={12}><TextField fullWidth label="Manzil" value={d.address} onChange={e => setD({ ...d, address: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Holat</InputLabel><Select value={d.status} label="Holat" onChange={e => setD({ ...d, status: e.target.value })}>{['Faol', 'Kutilmoqda', 'Nofaol'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12}><TextField fullWidth label="Izoh" multiline rows={2} value={d.notes} onChange={e => setD({ ...d, notes: e.target.value })} /></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

const ContractForm = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState({ title: '', client_name: '', amount: '', start_date: '', end_date: '', status: 'Kutilmoqda', description: '', ...initial });
  return (
    <><DialogContent dividers><Grid container spacing={2} pt={1}>
      <Grid item xs={12}><TextField fullWidth label="Shartnoma nomi" value={d.title} onChange={e => setD({ ...d, title: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Mijoz" value={d.client_name} onChange={e => setD({ ...d, client_name: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Summa (so'm)" type="number" value={d.amount} onChange={e => setD({ ...d, amount: e.target.value })} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Boshlanish" type="date" value={d.start_date ? d.start_date.split('T')[0] : ''} onChange={e => setD({ ...d, start_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
      <Grid item xs={12} sm={6}><TextField fullWidth label="Tugash" type="date" value={d.end_date ? d.end_date.split('T')[0] : ''} onChange={e => setD({ ...d, end_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
      <Grid item xs={12}><FormControl fullWidth><InputLabel>Holat</InputLabel><Select value={d.status} label="Holat" onChange={e => setD({ ...d, status: e.target.value })}>{['Faol', 'Kutilmoqda', 'Tugagan', 'Bekor qilindi'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
      <Grid item xs={12}><TextField fullWidth label="Tavsif" multiline rows={2} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} /></Grid>
    </Grid></DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose}>Bekor</Button>
      <Button variant="contained" onClick={() => onSave(d)} sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>Saqlash</Button>
    </DialogActions></>
  );
};

// ─── PAGES ────────────────────────────────────────────────────────────────────
const UsersPage = () => <CrudPage title="Xodimlar (HR)" endpoint="users" FormComponent={UserForm} searchKeys={['full_name', 'email', 'role', 'department']} pdfTitle="Xodimlar Ro'yxati"
  columns={[
    { key: 'full_name', label: 'F.I.O', render: (v, r) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 13, fontWeight: 700 }}>{v?.[0]}</Avatar><Box><Typography variant="body2" fontWeight={600}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></Box></Box> },
    { key: 'role', label: 'Lavozim' },
    { key: 'department', label: 'Bo\'lim' },
    { key: 'phone', label: 'Telefon' },
    { key: 'salary', label: 'Maosh', render: v => <Typography fontWeight={600} sx={{ color: '#10b981' }}>{fmt(v)}</Typography> },
    { key: 'status', label: 'Holat', render: v => <StatusChip value={v} /> },
  ]}
/>;

const DeptsPage = () => <CrudPage title="Bo'limlar" endpoint="departments" FormComponent={DeptForm} searchKeys={['name', 'manager_name']} pdfTitle="Bo'limlar"
  columns={[
    { key: 'name', label: 'Bo\'lim nomi', render: v => <Typography fontWeight={700}>{v}</Typography> },
    { key: 'manager_name', label: 'Rahbar' },
    { key: 'budget', label: 'Byudjet', render: v => <Typography fontWeight={600} sx={{ color: '#6366f1' }}>{fmt(v)}</Typography> },
    { key: 'description', label: 'Tavsif' },
  ]}
/>;

const ProductsPage = () => <CrudPage title="Inventar va Omborxona" endpoint="products" FormComponent={ProductForm} searchKeys={['name', 'category', 'supplier']} pdfTitle="Inventar Ro'yxati"
  columns={[
    { key: 'name', label: 'Mahsulot nomi', render: v => <Typography fontWeight={600}>{v}</Typography> },
    { key: 'category', label: 'Kategoriya' },
    { key: 'quantity', label: 'Miqdor', render: (v, r) => <Chip label={`${v} ${r.unit}`} size="small" sx={{ fontWeight: 600 }} /> },
    { key: 'price', label: 'Narx', render: v => fmt(v) },
    { key: 'supplier', label: 'Yetkazib beruvchi' },
    { key: 'status', label: 'Holat', render: v => <StatusChip value={v} /> },
  ]}
/>;

const FinancePage = () => <CrudPage title="Moliya va Hisobot" endpoint="finance" FormComponent={FinanceForm} searchKeys={['type', 'category', 'description', 'department']} pdfTitle="Moliyaviy Hisobot"
  columns={[
    { key: 'type', label: 'Tur', render: v => <Chip label={v} size="small" sx={{ bgcolor: v === 'Kirim' ? '#10b98120' : '#ef444420', color: v === 'Kirim' ? '#10b981' : '#ef4444', fontWeight: 700, border: 'none' }} /> },
    { key: 'category', label: 'Kategoriya' },
    { key: 'amount', label: 'Summa', render: (v, r) => <Typography fontWeight={700} sx={{ color: r.type === 'Kirim' ? '#10b981' : '#ef4444' }}>{r.type === 'Kirim' ? '+' : '-'}{fmt(v)}</Typography> },
    { key: 'description', label: 'Tavsif' },
    { key: 'department', label: 'Bo\'lim' },
    { key: 'date', label: 'Sana', render: v => v ? new Date(v).toLocaleDateString('uz-UZ') : '—' },
    { key: 'status', label: 'Holat', render: v => <StatusChip value={v} /> },
  ]}
/>;

const TasksPage = () => <CrudPage title="Vazifalar Boshqaruvi" endpoint="tasks" FormComponent={TaskForm} searchKeys={['title', 'assigned_to', 'department']} pdfTitle="Vazifalar Ro'yxati"
  columns={[
    { key: 'title', label: 'Vazifa', render: v => <Typography fontWeight={600}>{v}</Typography> },
    { key: 'assigned_to', label: 'Ijrochi' },
    { key: 'department', label: 'Bo\'lim' },
    { key: 'priority', label: 'Muhimlik', render: v => <PriorityChip value={v} /> },
    { key: 'status', label: 'Holat', render: v => <StatusChip value={v} /> },
    { key: 'due_date', label: 'Muddat', render: v => v ? new Date(v).toLocaleDateString('uz-UZ') : '—' },
  ]}
/>;

const ClientsPage = () => <CrudPage title="Mijozlar (CRM)" endpoint="clients" FormComponent={ClientForm} searchKeys={['company_name', 'contact_person', 'email']} pdfTitle="Mijozlar Ro'yxati"
  columns={[
    { key: 'company_name', label: 'Kompaniya', render: v => <Typography fontWeight={700}>{v}</Typography> },
    { key: 'contact_person', label: 'Mas\'ul' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefon' },
    { key: 'contract_value', label: 'Qiymat', render: v => <Typography fontWeight={600} sx={{ color: '#6366f1' }}>{fmt(v)}</Typography> },
    { key: 'status', label: 'Holat', render: v => <StatusChip value={v} /> },
  ]}
/>;

const ContractsPage = () => <CrudPage title="Shartnomalar" endpoint="contracts" FormComponent={ContractForm} searchKeys={['title', 'client_name']} pdfTitle="Shartnomalar Ro'yxati"
  columns={[
    { key: 'title', label: 'Shartnoma', render: v => <Typography fontWeight={600}>{v}</Typography> },
    { key: 'client_name', label: 'Mijoz' },
    { key: 'amount', label: 'Summa', render: v => <Typography fontWeight={700} sx={{ color: '#10b981' }}>{fmt(v)}</Typography> },
    { key: 'start_date', label: 'Boshlanish', render: v => v ? new Date(v).toLocaleDateString('uz-UZ') : '—' },
    { key: 'end_date', label: 'Tugash', render: v => v ? new Date(v).toLocaleDateString('uz-UZ') : '—' },
    { key: 'status', label: 'Holat', render: v => <StatusChip value={v} /> },
  ]}
/>;

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV = [
  { key: 'dashboard', label: 'Boshqaruv Paneli', icon: <DashboardIcon /> },
  { key: 'users', label: 'Xodimlar (HR)', icon: <PeopleIcon /> },
  { key: 'departments', label: 'Bo\'limlar', icon: <BusinessIcon /> },
  { key: 'products', label: 'Inventar & Ombor', icon: <InventoryIcon /> },
  { key: 'finance', label: 'Moliya', icon: <FinanceIcon /> },
  { key: 'tasks', label: 'Vazifalar', icon: <TaskIcon /> },
  { key: 'clients', label: 'Mijozlar (CRM)', icon: <ClientIcon /> },
  { key: 'contracts', label: 'Shartnomalar', icon: <ContractIcon /> },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bizcore_user')); } catch { return null; }
  });
  const [mode, setMode] = useState('light');
  const [page, setPage] = useState('dashboard');

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#6366f1' },
      secondary: { main: '#8b5cf6' },
      background: { default: mode === 'light' ? '#f8faff' : '#0a0a1a', paper: mode === 'light' ? '#ffffff' : '#12121f' },
    },
    typography: { fontFamily: 'Inter, sans-serif', h4: { fontWeight: 800 }, h6: { fontWeight: 700 } },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: { styleOverrides: { root: { boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.3)' } } },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 } } },
    }
  }), [mode]);

  const handleLogout = () => {
    localStorage.removeItem('bizcore_token');
    localStorage.removeItem('bizcore_user');
    setUser(null);
    window.location.href = '/';
  };

  if (!user) return <ThemeProvider theme={theme}><CssBaseline /><Toaster position="top-right" /><Login onLogin={u => { setUser(u); }} /></ThemeProvider>;

  const pageComponent = {
    dashboard: <Dashboard user={user} />,
    users: <UsersPage />,
    departments: <DeptsPage />,
    products: <ProductsPage />,
    finance: <FinancePage />,
    tasks: <TasksPage />,
    clients: <ClientsPage />,
    contracts: <ContractsPage />,
  }[page] || <Dashboard user={user} />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500 } }} />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 'none', bgcolor: mode === 'light' ? '#fff' : '#12121f', boxShadow: mode === 'light' ? '2px 0 20px rgba(0,0,0,0.06)' : '2px 0 20px rgba(0,0,0,0.3)' } }}>
          {/* Logo */}
          <Box sx={{ px: 3, py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BusinessIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: '-0.3px' }}>BizCore</Typography>
                <Typography variant="caption" color="text.secondary">Ko'p Modulli Tizim</Typography>
              </Box>
            </Box>
          </Box>

          {/* Nav */}
          <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
            <List disablePadding>
              {NAV.map(n => {
                const active = page === n.key;
                return (
                  <ListItem key={n.key} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                    <ListItemButton onClick={() => setPage(n.key)} selected={active}
                      sx={{ borderRadius: 2, '&.Mui-selected': { bgcolor: '#6366f115', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }, '&:hover': { bgcolor: '#6366f108' }, transition: 'all 0.15s' }}>
                      <ListItemIcon sx={{ minWidth: 38, color: active ? '#6366f1' : 'text.secondary' }}>{n.icon}</ListItemIcon>
                      <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }} />
                      {active && <Box sx={{ width: 3, height: 24, bgcolor: '#6366f1', borderRadius: 2 }} />}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* User */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.06)' }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366f1', fontSize: 14, fontWeight: 700 }}>{user?.full_name?.[0]}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
              </Box>
              <Tooltip title="Chiqish">
                <IconButton size="small" onClick={handleLogout} sx={{ color: '#ef4444' }}><Logout fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Drawer>

        {/* Main */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Topbar */}
          <AppBar position="sticky" elevation={0} sx={{ bgcolor: mode === 'light' ? 'rgba(248,250,255,0.9)' : 'rgba(10,10,26,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Typography fontWeight={600} color="text.secondary" fontSize={14}>
                {NAV.find(n => n.key === page)?.label || 'Boshqaruv Paneli'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={user?.role} size="small" sx={{ bgcolor: '#6366f115', color: '#6366f1', fontWeight: 600, border: 'none', fontSize: 11 }} />
                <Chip label={user?.department || 'Boshqaruv'} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                <Tooltip title={mode === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}>
                  <IconButton onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')} size="small" sx={{ ml: 0.5 }}>
                    {mode === 'dark' ? <LightMode /> : <DarkMode />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Content */}
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Fade in key={page} timeout={300}>
              <Box>{pageComponent}</Box>
            </Fade>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
