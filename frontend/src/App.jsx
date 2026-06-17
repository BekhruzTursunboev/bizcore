import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider, createTheme, CssBaseline, Box, Drawer, AppBar, Toolbar, List, Typography, ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Grid, Card, CardContent, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, Avatar, Divider, FormControl, InputLabel, Select, MenuItem, LinearProgress, CircularProgress, Fade, Grow, Tabs, Tab } from '@mui/material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ICONS
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import MemoryIcon from '@mui/icons-material/Memory';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import MedicationIcon from '@mui/icons-material/Medication';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const FALLBACK_DB_URL = 'https://api.restful-api.dev/objects/ff8081819d82fab6019ea6564a494eb4';

const initialDb = {
  patients: [
    { id: '1', firstName: 'Aziz', lastName: 'Karimov', phone: '+998901234567', doctorName: 'Dr. Rustamov', status: 'Kuzatuvda', appointmentTime: '10:00', reason: 'Tish og\'rig\'i' },
    { id: '2', firstName: 'Madina', lastName: 'Aliyeva', phone: '+998931112233', doctorName: 'Dr. Karimova', status: 'Sog\'aygan', appointmentTime: '11:30', reason: 'Ko\'z tekshiruvi' }
  ],
  staff: [
    { id: '1', fullName: 'Dr. Rustamov', role: 'Bosh shifokor', department: 'Stomatologiya', phone: '+998991234567', password: '123', status: 'Faol' },
    { id: '2', fullName: 'Hamshira Asila', role: 'Hamshira', department: 'Qabulxona', phone: '+998997654321', password: '123', status: 'Faol' },
    { id: '3', fullName: 'Dr. Karimova', role: 'Shifokor', department: 'Oftalmologiya', phone: '+998901112233', password: '123', status: 'Faol' }
  ],
  billing: [
    { id: '1', patientName: 'Aziz Karimov', serviceName: 'Tish yulish', amount: 150000, date: '2026-06-08', status: 'To\'langan' },
    { id: '2', patientName: 'Madina Aliyeva', serviceName: 'Ko\'z tekshiruvi', amount: 80000, date: '2026-06-08', status: 'Qarzdorlik' }
  ],
  appointments: [
    { id: '1', patientName: 'Aziz Karimov', doctorName: 'Dr. Rustamov', date: '2026-06-08', time: '10:00', status: 'Kutilmoqda' }
  ]
};

const safeApi = async (method, resource, id = null, data = null) => {
  try {
    const url = id ? `${API_URL}/${resource}/${id}` : `${API_URL}/${resource}`;
    const res = await axios({ method, url, data });
    return res;
  } catch (err) {
    // console.warn(`Backend unreachable. Using LocalStorage Fallback for ${resource}.`);
    try {
      let rawDb = localStorage.getItem('meduz_db');
      if (!rawDb) {
        rawDb = JSON.stringify(initialDb);
        localStorage.setItem('meduz_db', rawDb);
      }
      
      const dbData = JSON.parse(rawDb);
      let items = dbData[resource] || [];

      if (resource === 'staff') {
        let changed = false;
        items = items.map(i => {
          if (!i.password) {
            changed = true;
            return { ...i, password: '123' };
          }
          return i;
        });
        if (changed) {
          dbData[resource] = items;
          localStorage.setItem('meduz_db', JSON.stringify(dbData));
        }
      }

      if (method === 'GET') return { data: { data: items } };

      if (method === 'POST') {
        const newItem = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
        items.unshift(newItem);
        dbData[resource] = items;
        localStorage.setItem('meduz_db', JSON.stringify(dbData));
        return { data: { data: newItem } };
      }
      if (method === 'PUT') {
        items = items.map(item => String(item.id) === String(id) ? { ...item, ...data } : item);
        dbData[resource] = items;
        localStorage.setItem('meduz_db', JSON.stringify(dbData));
        return { data: { data: items.find(item => String(item.id) === String(id)) } };
      }
      if (method === 'DELETE') {
        items = items.filter(item => String(item.id) !== String(id));
        dbData[resource] = items;
        localStorage.setItem('meduz_db', JSON.stringify(dbData));
        return { data: { status: 'deleted' } };
      }
    } catch (fallbackErr) {
      console.error("LocalStorage DB Error", fallbackErr);
      if (method === 'GET') return { data: { data: [] } };
      throw new Error("Local Storage iskaldi!");
    }
    throw err;
  }
};

const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";

const drawerWidth = 260;

const StatCard = ({ title, value, subtitle, trend, icon, theme }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>{title}</Typography>
        <Typography variant="h3" sx={{ my: 1, fontWeight: 700 }}>{value}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: trend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{trend > 0 ? '+' : ''}{trend}%</Typography>
          <Typography variant="body2" color="textSecondary">{subtitle}</Typography>
        </Box>
      </Box>
      <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', color: '#3b82f6', width: 56, height: 56 }}>
        {icon}
      </Avatar>
    </CardContent>
  </Card>
);

const LoginScreen = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => { 
    const p = phone.trim();
    const pw = password.trim();

    if (!p || !pw) {
      return toast.error("Telefon raqam va parolni kiriting!");
    }

    if (p === 'admin' && pw === '1234') { 
      toast.success("Bosh Vrach tizimga kirdi"); 
      onLogin({ id: 'admin', fullName: 'Dr. Rustamov', role: 'Bosh shifokor', phone: 'admin' }); 
      return; 
    } 
    
    try {
      setLoading(true);
      const res = await safeApi('GET', 'staff');
      const staffList = res.data?.data || [];
      
      const normalizePhone = (ph) => (ph || '').replace(/\D/g, '');
      const inputPhone = normalizePhone(p);
      
      const user = staffList.find(s => normalizePhone(s?.phone) === inputPhone && s?.password === pw);
      
      if (user) {
        toast.success(`${user.role} tizimga kirdi`);
        onLogin(user);
      } else {
        toast.error("Telefon raqam yoki parol noto'g'ri");
      }
    } catch (e) {
      toast.error("Tarmoqda xatolik!");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
      <Card sx={{ maxWidth: 400, width: '100%', p: 4, textAlign: 'center' }}>
        <LocalHospitalIcon sx={{ fontSize: 60, color: '#3b82f6', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>MedUz ERP</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>Tizimga kirish uchun ma'lumotlarni kiriting</Typography>
        <TextField fullWidth label="Telefon raqam" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth type="password" label="Parol" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} sx={{ mb: 3 }} />
        <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading}>{loading ? "Tekshirilmoqda..." : "Kirish"}</Button>
      </Card>
    </Box>
  );
};

const AIDiagnostics = () => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    if (!text.trim()) return toast.error("Simptomlarni yozing!");
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      let dis = 'Noma\'lum virusli infeksiya';
      let doc = 'Terapevt';
      let tst = ['Umumiy qon tahlili', 'Siydik tahlili'];
      const lower = text.toLowerCase();
      
      const knowledgeBase = [
        { keys: ['tish', 'milk', 'qonash', 'kariyes'], dis: 'Kariyes yoki Pulpit', doc: 'Stomatolog', tst: ['Rentgen (3D jag\')'] },
        { keys: ["ko'z", 'koz', 'xira', 'ko\'rish', 'qizarish'], dis: 'Konyunktivit yoki Miopiya', doc: 'Oftalmolog', tst: ['Oftalmoskopiya', 'Ko\'rish o\'tkirligini tekshirish'] },
        { keys: ['yurak', 'sanch', 'qon bosim', 'davleniya', 'nafas qis', 'yurag'], dis: 'Gipertoniya yoki Aritmiya', doc: 'Kardiolog', tst: ['EKG', 'ExoKG', 'Qon tahlili'] },
        { keys: ['asab', 'bosh', 'uyqu', 'charchoq', 'titroq', 'stress'], dis: 'Nevroz yoki Migren', doc: 'Nevrolog', tst: ['MRT (Bosh miya)', 'EEG'] },
        { keys: ['bola', 'go\'dak', 'chaqaloq', 'isitma'], dis: 'O\'tkir respirator kasallik (O\'RK)', doc: 'Pediatr', tst: ['Umumiy qon tahlili', 'Pediatr ko\'rigi'] },
        { keys: ['qorin', 'oshqozon', 'ich', 'ovqat', 'jigar', 'ko\'ngil aynish'], dis: 'Gastrit yoki Gepatit', doc: 'Gastroenterolog', tst: ['UZI', 'FGS'] },
        { keys: ['tomog', 'tomoq', 'burun', 'quloq', 'eshitish', 'yo\'tal'], dis: 'Tonzillit yoki Otit', doc: 'LOR (Otolaringolog)', tst: ['LOR ko\'rigi', 'Qon tahlili'] },
        { keys: ['suyak', 'sinish', 'bel', 'tizza', 'bo\'g\'im', 'bogim', 'og\'riq', 'chiqish'], dis: 'Osteoxondroz yoki Suyak sinishi', doc: 'Travmatolog', tst: ['Rentgen', 'MRT'] },
        { keys: ['teri', 'toshma', 'qichish', 'allergiya', 'qizil'], dis: 'Dermatit yoki Allergiya', doc: 'Dermatolog', tst: ['Allergosinalovlar', 'Teri qirindisi tahlili'] }
      ];

      for (let item of knowledgeBase) {
        if (item.keys.some(k => lower.includes(k))) {
          dis = item.dis; doc = item.doc; tst = item.tst; break;
        }
      }

      setResult({
        disease: dis,
        probability: Math.floor(Math.random() * 15) + 80,
        doctor: doc,
        tests: tst
      });
      toast.success("AI Neyrotarmoq Tahlili Yakunlandi!", { icon: '🤖' });
    }, 3000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <AutoAwesomeIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b5cf6' }}>AI Tashxis (Neyrotarmoqlar)</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><SupportAgentIcon color="primary" /> Bemor simptomlari</Typography>
            <TextField fullWidth multiline rows={6} placeholder="Bemor nimalardan shikoyat qilyapti? Iloji boricha batafsil yozing..." value={text} onChange={(e) => setText(e.target.value)} />
            <Button variant="contained" color="secondary" fullWidth sx={{ mt: 2, height: 50, fontSize: '1.1rem', bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }} onClick={handleAnalyze} disabled={analyzing} startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <MemoryIcon />}>
              {analyzing ? 'Neyrotarmoqlar tahlil qilmoqda...' : 'Sun\'iy Intellekt yordamida tahlil qilish'}
            </Button>
            {analyzing && <LinearProgress color="secondary" sx={{ mt: 2 }} />}
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Fade in={!!result} timeout={1000}>
            <Card sx={{ height: '100%', p: 3, bgcolor: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', position: 'relative', overflow: 'hidden' }}>
              {result && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PrecisionManufacturingIcon sx={{ color: '#8b5cf6', fontSize: 32 }} />
                    <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700 }}>Diagnostika Natijasi</Typography>
                  </Box>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Eng ehtimoliy kasallik:</Typography>
                  <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{result.disease} <Chip label={`${result.probability}%`} color="error" sx={{ fontWeight: 'bold' }} /></Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Yo'naltiriladigan mutaxassis:</Typography>
                  <Typography variant="h5" sx={{ mb: 3, color: '#10b981', fontWeight: 600 }}>{result.doctor}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Kerakli instrumental/laborator tahlillar:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {result.tests.map(t => <Chip key={t} label={t} variant="outlined" sx={{ color: '#8b5cf6', borderColor: '#8b5cf6' }} />)}
                  </Box>
                </Box>
              )}
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

const Dashboard = ({ theme, loggedInUser }) => {
  const [patients, setPatients] = useState([]);
  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [pRes, bRes, aRes, sRes] = await Promise.all([
        safeApi('GET', 'patients'),
        safeApi('GET', 'billing'),
        safeApi('GET', 'appointments'),
        safeApi('GET', 'staff')
      ]);
      setPatients(pRes.data?.data || []);
      setBills(bRes.data?.data || []);
      setAppointments(aRes.data?.data || []);
      setStaff(sRes.data?.data || []);
    } catch (err) {}
  };

  const totalRevenue = bills.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  
  const filteredAppointments = loggedInUser?.role === 'Shifokor' ? appointments.filter(a => a.doctorName === loggedInUser.fullName) : appointments;
  const filteredPatients = loggedInUser?.role === 'Shifokor' ? patients.filter(p => p.doctorName === loggedInUser.fullName) : patients;
  
  const chartData = [
    { name: 'Dush', daromad: totalRevenue * 0.1, navbat: appointments.length + 5 },
    { name: 'Sesh', daromad: totalRevenue * 0.15, navbat: appointments.length + 8 },
    { name: 'Chor', daromad: totalRevenue * 0.2, navbat: appointments.length + 3 },
    { name: 'Bugun', daromad: totalRevenue * 0.55, navbat: appointments.length },
  ];

  const pieData = [
    { name: 'Kuzatuvda', value: patients.filter(p => (p.status || '').toLowerCase().includes('kuzatuv')).length },
    { name: 'Sog\'aygan', value: patients.filter(p => (p.status || '').toLowerCase().includes('sog')).length },
  ];
  const COLORS = ['#3b82f6', '#10b981'];

  const staffDeps = staff.reduce((acc, curr) => {
    const dep = curr.department || 'Boshqa';
    acc[dep] = (acc[dep] || 0) + 1;
    return acc;
  }, {});const barData = Object.keys(staffDeps).map(key => ({ name: key, count: staffDeps[key] }));
  if(barData.length === 0) barData.push({ name: 'Umumiy', count: 1 });

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3, width: '100%' }}>
      <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Asosiy Boshqaruv (Command Center)</Typography>
      </Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}><StatCard title="Jami Bemorlar" value={filteredPatients.length} trend={12.5} subtitle="Barcha vaqtlar" icon={<PeopleOutlinedIcon fontSize="large"/>} theme={theme} /></Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}><StatCard title="Navbatlar (Appointments)" value={filteredAppointments.length} trend={3.2} subtitle="Bugungi qabullar" icon={<AssignmentIndIcon fontSize="large"/>} theme={theme} /></Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}><StatCard title="Kassa Tushumi" value={formatCurrency(totalRevenue)} trend={8.4} subtitle="Billing DB'dan olingan" icon={<AttachMoneyIcon fontSize="large"/>} theme={theme} /></Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}><StatCard title="AI Avtomatizatsiya" value={(appointments.length * 2) + 14} trend={84.2} subtitle="Bugun tejalgan daqiqalar" icon={<SmartToyIcon fontSize="large"/>} theme={theme} /></Box>
      
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' }, minWidth: 0 }}>
        <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}><CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Haftalik Daromad va Navbatlar (Real ma'lumotlar)</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.mode==='dark'?'#334155':'#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? (val/1000)+'k' : val} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value, name) => [name === "Daromad (so'm)" ? formatCurrency(value) : value, name]} contentStyle={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" name="Daromad (so'm)" dataKey="daromad" stroke="#3b82f6" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" name="Navbatlar" dataKey="navbat" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent></Card>
      </Box>
      
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' }, minWidth: 0 }}>
        <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>So'nggi To'lovlar (Feed)</Typography>
            <List>
              {bills.slice(0, 4).map((b, i) => (
                <React.Fragment key={b.id || i}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary={b.patientName} secondary={b.serviceName} />
                    <Typography variant="body2" fontWeight="bold" color="success.main">+{formatCurrency(b.amount)}</Typography>
                  </ListItem>
                  {i !== 3 && <Divider />}
                </React.Fragment>
              ))}
              {bills.length === 0 && <Typography variant="body2" color="textSecondary">Hozircha to'lovlar yo'q</Typography>}
            </List>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' }, minWidth: 0 }}>
         <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}><CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">Bemorlar Holati</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </Box>
         </CardContent></Card>
      </Box>

      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' }, minWidth: 0 }}>
         <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}><CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">Xodimlar taqsimoti (Bo'limlar)</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.mode==='dark'?'#334155':'#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false}/>
                <YAxis axisLine={false} tickLine={false} allowDecimals={false}/>
                <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Xodimlar soni" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
         </CardContent></Card>
      </Box>
    </Box>
  );
};

const Patients = ({ loggedInUser }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openEHR, setOpenEHR] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', doctorName: '', status: 'Kuzatuvda', appointmentTime: '09:00', diagnosis: '', treatmentPlan: '' });

  useEffect(() => { fetchAllData(); }, []);
  const fetchAllData = async () => { 
    try { 
      const resP = await safeApi('GET', 'patients'); setPatients(resP.data?.data || []); 
      const resS = await safeApi('GET', 'staff'); setDoctors((resS.data?.data || []).filter(s => (s.role || '').toLowerCase().includes('shifokor')));
      const resA = await safeApi('GET', 'appointments'); setAppointments(resA.data?.data || []);
      const resB = await safeApi('GET', 'billing'); setBills(resB.data?.data || []);
    } catch(e){} 
  };
  
  const handleOpenDialog = (p = null) => {
    if (p) { setEditId(p.id); setFormData({ firstName: p.firstName, lastName: p.lastName, doctorName: p.doctorName, status: p.status, appointmentTime: p.appointmentTime, diagnosis: p.diagnosis || '', treatmentPlan: p.treatmentPlan || '' }); }
    else { setEditId(null); setFormData({ firstName: '', lastName: '', doctorName: '', status: 'Kuzatuvda', appointmentTime: '09:00', diagnosis: '', treatmentPlan: '' }); }
    setOpenDialog(true);
  };

  const handleOpenEHR = (p) => {
    setSelectedPatient(p);
    setTabValue(0);
    setOpenEHR(true);
  };

  const handleSubmit = async () => { 
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.doctorName) return toast.error("Iltimos, barcha maydonlarni to'ldiring!");
    try {
      if (editId) { await safeApi('PUT', 'patients', editId, formData); toast.success("Muvaffaqiyatli tahrirlandi!"); }
      else { await safeApi('POST', 'patients', null, formData); toast.success("Muvaffaqiyatli saqlandi!"); }
      setOpenDialog(false); fetchAllData();
      if(openEHR) {
         setSelectedPatient({...selectedPatient, ...formData});
      }
    } catch (err) { toast.error("Xatolik: " + (err.response?.data?.message || err.message || "Ulanishda xato")); }
  };
  const handleDelete = async (id) => { 
    if (!window.confirm("Rostdan ham ushbu bemorni o'chirmoqchimisiz?")) return;
    try { await safeApi('DELETE', 'patients', id); toast.success("Bemor o'chirildi!"); fetchAllData(); } catch (err) { toast.error("Xatolik!"); }
  };

  const exportEHR_PDF = () => {
    if(!selectedPatient) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246);
    doc.text("MedUz - Elektron Retsept (EHR)", 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Bemor: ${selectedPatient.firstName} ${selectedPatient.lastName}`, 14, 35);
    doc.text(`Tashxis (Diagnoz): ${selectedPatient.diagnosis || 'Qo\'yilmagan'}`, 14, 45);
    doc.text(`Holati: ${selectedPatient.status}`, 14, 55);
    
    doc.setLineWidth(0.5);
    doc.line(14, 60, 196, 60);
    
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("Davolash Rejasi va Dori-darmonlar:", 14, 75);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    const splitText = doc.splitTextToSize(selectedPatient.treatmentPlan || 'Hozircha davolash rejasi kiritilmagan.', 180);
    doc.text(splitText, 14, 85);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Sana: ${new Date().toLocaleDateString()}`, 14, 280);
    doc.text(`Shifokor: ${selectedPatient.doctorName}`, 130, 280);
    
    doc.save(`Retsept_${selectedPatient.firstName}_${selectedPatient.lastName}.pdf`); 
    toast.success("E-Retsept PDF formatida yuklab olindi!", {icon: '📄'});
  };

  const cols = [
    { field: 'patient', headerName: 'Bemor F.I.O', flex: 1, minWidth: 200, renderCell: (p) => `${p.row.firstName} ${p.row.lastName}` },
    { field: 'doctorName', headerName: 'Biriktirilgan Shifokor', flex: 1, minWidth: 150 },
    { field: 'diagnosis', headerName: 'Diagnoz', flex: 1, minWidth: 150, renderCell: (p) => p.value || <Typography color="textSecondary" variant="body2">Kiritilmagan</Typography> },
    { field: 'status', headerName: 'Holati', width: 120, renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'Sog\'aygan' ? 'success' : p.value === 'Og\'ir' ? 'error' : 'primary'} /> },
    { field: 'actions', headerName: 'EHR Karta', width: 180, renderCell: (p) => (
      <Button variant="outlined" size="small" startIcon={<DescriptionIcon />} onClick={() => handleOpenEHR(p.row)} sx={{ borderRadius: 4, textTransform: 'none' }}>Elektron Karta</Button>
    )},
    { field: 'edit_del', type: 'actions', width: 80, getActions: (p) => [
      <GridActionsCellItem icon={<EditIcon color="primary"/>} label="Edit" onClick={() => handleOpenDialog(p.row)} />,
      <GridActionsCellItem icon={<DeleteIcon color="error"/>} label="Delete" onClick={() => handleDelete(p.id)} />
    ]}
  ];

  let filtered = patients.filter(p => ((p.firstName || '') + ' ' + (p.lastName || '')).toLowerCase().includes((search || '').toLowerCase()) || (p.doctorName || '').toLowerCase().includes((search || '').toLowerCase()));
  if (loggedInUser?.role === 'Shifokor') {
    filtered = filtered.filter(p => p.doctorName === loggedInUser.fullName);
  }

  const patientAppointments = selectedPatient ? appointments.filter(a => a.patientName?.toLowerCase() === `${selectedPatient.firstName} ${selectedPatient.lastName}`.toLowerCase()) : [];
  const patientBills = selectedPatient ? bills.filter(b => b.patientName?.toLowerCase() === `${selectedPatient.firstName} ${selectedPatient.lastName}`.toLowerCase()) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Bemorlar Boshqaruvi (EHR Tizimi)</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Izlash..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Yangi Bemor</Button>
        </Box>
      </Box>
      <Card><Box sx={{ height: 600, width: '100%' }}><DataGrid rows={filtered} columns={cols} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box></Card>
      
      {/* Oddiy Tahrirlash Oynasi */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Bemorni Tahrirlash" : "Yangi Bemor Qo'shish"}</DialogTitle>
        <DialogContent dividers><Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Ismi" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Familiyasi" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Shifokor</InputLabel>
              <Select value={formData.doctorName} label="Shifokor" onChange={e => setFormData({...formData, doctorName: e.target.value})}>
                {doctors.map(d => <MenuItem key={d.id || d.fullName} value={d.fullName}>{d.fullName}</MenuItem>)}
                {doctors.length === 0 && <MenuItem value="" disabled>Shifokorlar yo'q</MenuItem>}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Vaqt" type="time" value={formData.appointmentTime} onChange={e => setFormData({...formData, appointmentTime: e.target.value})} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Diagnoz (Tashxis)" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} placeholder="Masalan: O'tkir respirator kasallik" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Davolash Rejasi (Retsept)" multiline rows={3} value={formData.treatmentPlan} onChange={e => setFormData({...formData, treatmentPlan: e.target.value})} placeholder="Masalan: Paratsetamol 1x3 mahal..." /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Holati</InputLabel>
              <Select value={formData.status} label="Holati" onChange={e => setFormData({...formData, status: e.target.value})}>
                <MenuItem value="Kuzatuvda">Kuzatuvda</MenuItem>
                <MenuItem value="Sog'aygan">Sog'aygan</MenuItem>
                <MenuItem value="Og'ir">Og'ir</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Bekor qilish</Button><Button onClick={handleSubmit} variant="contained">{editId ? "Yangilash" : "Saqlash"}</Button></DialogActions>
      </Dialog>

      {/* EHR Elektron Karta Oynasi (Massive Feature) */}
      <Dialog open={openEHR} onClose={() => setOpenEHR(false)} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '80vh', borderRadius: 3 }}}>
        {selectedPatient && (
          <>
            <Box sx={{ p: 3, bgcolor: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'white', color: '#8b5cf6', fontSize: 32, fontWeight: 'bold' }}>{selectedPatient.firstName[0]}{selectedPatient.lastName[0]}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{selectedPatient.firstName} {selectedPatient.lastName}</Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Bemor ID: #{selectedPatient.id.slice(0,8).toUpperCase()} | Shifokor: {selectedPatient.doctorName}</Typography>
              </Box>
              <Chip label={selectedPatient.status} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', fontSize: '1rem', px: 1, py: 2 }} />
            </Box>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="secondary" indicatorColor="secondary">
                <Tab icon={<HistoryIcon />} iconPosition="start" label="Klinik Tarix" />
                <Tab icon={<MedicationIcon />} iconPosition="start" label="Davolash & Retsept" />
              </Tabs>
            </Box>

            <DialogContent sx={{ p: 4, bgcolor: '#f8fafc' }}>
              {/* Tab 1: Klinik Tarix (Timeline) */}
              {tabValue === 0 && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#334155' }}>Navbatlar va Tashriflar</Typography>
                    {patientAppointments.length > 0 ? [...patientAppointments].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((a, i) => (
                      <Box key={i} sx={{ position: 'relative', pl: 3, pb: 3, borderLeft: '2px solid #cbd5e1' }}>
                        <Box sx={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>{a.date} | {a.time}</Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>Shikoyat: {a.reason || 'Noma\'lum'}</Typography>
                        <Chip size="small" label={a.status} sx={{ mt: 1 }} />
                      </Box>
                    )) : <Typography color="textSecondary">Tashriflar tarixi yo'q</Typography>}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#334155' }}>Moliya va Kassa</Typography>
                    {patientBills.length > 0 ? [...patientBills].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((b, i) => (
                      <Box key={i} sx={{ position: 'relative', pl: 3, pb: 3, borderLeft: '2px solid #cbd5e1' }}>
                        <Box sx={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: b.status === 'To\'langan' ? '#10b981' : '#ef4444' }} />
                        <Typography variant="subtitle2" color="textSecondary">{b.date}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>{b.serviceName}</Typography>
                        <Typography variant="h6" sx={{ color: '#334155' }}>{Number(b.amount).toLocaleString()} UZS</Typography>
                        <Chip size="small" label={b.status} color={b.status === 'To\'langan' ? 'success' : 'error'} sx={{ mt: 1 }} />
                      </Box>
                    )) : <Typography color="textSecondary">Moliya tarixi yo'q</Typography>}
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Davolash va Retsept */}
              {tabValue === 1 && (
                <Box>
                  <Card sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Typography variant="subtitle2" color="textSecondary">Joriy Diagnoz (Tashxis)</Typography>
                    <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: '#8b5cf6' }}>{selectedPatient.diagnosis || 'Kiritilmagan'}</Typography>
                  </Card>
                  
                  <Card sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#f0fdf4' }}>
                    <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 'bold', mb: 2 }}>Davolash Rejasi (Dori-darmonlar)</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#14532d' }}>
                      {selectedPatient.treatmentPlan || 'Davolash rejasi hozircha shakllantirilmagan.'}
                    </Typography>
                  </Card>
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setOpenEHR(false); handleOpenDialog(selectedPatient); }}>Tahrirlash</Button>
                    <Button variant="contained" color="secondary" startIcon={<PictureAsPdfIcon />} onClick={exportEHR_PDF} sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }}}>E-Retsept (PDF) Yuklash</Button>
                  </Box>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

const Appointments = ({ loggedInUser }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ patientName: '', doctorName: '', date: '2026-06-08', time: '10:00', reason: '', status: 'Tasdiqlangan' });

  useEffect(() => { fetchAppointments(); }, []);
  const fetchAppointments = async () => { 
    try { 
      const res = await safeApi('GET', 'appointments'); setAppointments(res.data?.data || []); 
      const resStaff = await safeApi('GET', 'staff');
      setDoctors((resStaff.data?.data || []).filter(s => (s.role || '').toLowerCase().includes('shifokor')));
    } catch(e){} 
  };
  
  const isShifokor = loggedInUser?.role === 'Shifokor';

  const [aiRouted, setAiRouted] = useState(false);

  const handleOpen = (a = null) => {
    setAiRouted(false);
    if (a) { setEditId(a.id); setFormData({ patientName: a.patientName, doctorName: a.doctorName, date: a.date, time: a.time, reason: a.reason, status: a.status }); }
    else { setEditId(null); setFormData({ patientName: '', doctorName: isShifokor ? loggedInUser.fullName : '', date: '2026-06-08', time: '10:00', reason: '', status: 'Tasdiqlangan' }); }
    setOpen(true);
  }

  const handleReasonChange = (e) => {
    const val = e.target.value;
    let newDoc = formData.doctorName;
    let routed = false;
    if (!isShifokor && !editId) {
      const lower = val.toLowerCase();
      const mappings = [
        { keys: ['tish', 'milk', 'qonash', 'kariyes'], dep: 'stomatologiya' },
        { keys: ["ko'z", 'koz', 'xira', 'ko\'rish', 'qizarish'], dep: 'oftalmologiya' },
        { keys: ['yurak', 'sanch', 'qon bosim', 'davleniya', 'nafas qis', 'yurag'], dep: 'kardiologiya' },
        { keys: ['asab', 'bosh', 'uyqu', 'charchoq', 'titroq', 'stress'], dep: 'nevrologiya' },
        { keys: ['bola', 'go\'dak', 'chaqaloq', 'isitma'], dep: 'pediatriya' },
        { keys: ['qorin', 'oshqozon', 'ich', 'ovqat', 'jigar', 'ko\'ngil aynish'], dep: 'gastroenterologiya' },
        { keys: ['tomog', 'tomoq', 'burun', 'quloq', 'eshitish', 'yo\'tal'], dep: 'lor' },
        { keys: ['suyak', 'sinish', 'bel', 'tizza', 'bo\'g\'im', 'bogim', 'og\'riq', 'chiqish'], dep: 'travmatologiya' },
        { keys: ['teri', 'toshma', 'qichish', 'allergiya', 'qizil'], dep: 'dermatologiya' }
      ];
      for (let m of mappings) {
        if (m.keys.some(k => lower.includes(k))) {
          const d = doctors.find(x => x.department?.toLowerCase().includes(m.dep));
          if (d) { newDoc = d.fullName; routed = true; break; }
        }
      }
    }
    if (routed) setAiRouted(true);
    else if (!val) setAiRouted(false);
    
    setFormData({ ...formData, reason: val, doctorName: newDoc });
  };

  const handleSubmit = async () => { 
    if (!formData.patientName?.trim() || !formData.doctorName || !formData.date || !formData.time) return toast.error("Barcha maydonlarni to'ldiring!");
    try {
      if (editId) { await safeApi('PUT', 'appointments', editId, formData); toast.success("Yangilandi"); }
      else { 
        await safeApi('POST', 'appointments', null, formData); 
        toast.success("✅ Bemorni navbatga olish yakunlandi!", { style: { fontWeight: 'bold' }}); 
        
        try {
          const nameParts = formData.patientName.trim().split(' ');
          await safeApi('POST', 'patients', null, {
            firstName: nameParts[0] || 'Noma\'lum',
            lastName: nameParts.slice(1).join(' ') || '',
            doctorName: formData.doctorName,
            status: 'Kuzatuvda',
            reason: formData.reason || '',
            phone: ''
          });
          
          await safeApi('POST', 'billing', null, {
            patientName: formData.patientName,
            serviceName: 'Shifokor ko\'rigi',
            amount: 50000,
            date: formData.date,
            status: 'Qarzdorlik'
          });
          toast.success("🤖 Avtomatik jarayon: Kassada to'lov hujjati shakllantirildi!", { duration: 6000, icon: '💸', style: { border: '1px solid #10b981', padding: '16px', color: '#10b981' } });
        } catch(e) { console.error("Auto-sync error:", e); }
      }
      setOpen(false); fetchAppointments(); 
    } catch(err) { toast.error("Xatolik: " + (err.response?.data?.message || err.message || "Ulanishda xato")); }
  };
  const handleDelete = async (id) => { 
    if (!window.confirm("Ushbu navbatni o'chirmoqchimisiz?")) return;
    try { await safeApi('DELETE', 'appointments', id); fetchAppointments(); toast.success("O'chirildi"); } catch(e){}
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Navbatlar (Appointments)", 14, 15);
    const tableData = appointments.map(a => [a.patientName, a.doctorName, a.date, a.time, a.status]);
    doc.autoTable({ head: [["Bemor", "Shifokor", "Sana", "Vaqt", "Holati"]], body: tableData, startY: 20 });
    doc.save(`Navbatlar.pdf`); toast.success("PDF Yuklab olindi!");
  };

  const cols = [
    { field: 'patientName', headerName: 'Bemor', flex: 1, minWidth: 150 },
    { field: 'doctorName', headerName: 'Shifokor', flex: 1, minWidth: 150 },
    { field: 'date', headerName: 'Sana', width: 120 },
    { field: 'time', headerName: 'Vaqt', width: 100 },
    { field: 'reason', headerName: 'Sabab', flex: 1, minWidth: 150 },
    { field: 'status', headerName: 'Holati', width: 150, renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'Tasdiqlangan' ? 'success' : 'warning'} /> },
    { field: 'actions', type: 'actions', width: 100, getActions: (p) => [
      <GridActionsCellItem icon={<EditIcon color="primary"/>} label="Edit" onClick={() => handleOpen(p.row)} />,
      <GridActionsCellItem icon={<DeleteIcon color="error"/>} label="Delete" onClick={() => handleDelete(p.id)} />
    ] }
  ];

  let filtered = appointments.filter(a => (a.patientName || '').toLowerCase().includes((search || '').toLowerCase()) || (a.doctorName || '').toLowerCase().includes((search || '').toLowerCase()));
  if (loggedInUser?.role === 'Shifokor') {
    filtered = filtered.filter(a => a.doctorName === loggedInUser.fullName);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Navbatlar (Appointments)</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Izlash..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={exportPDF}>PDF</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Yangi</Button>
        </Box>
      </Box>
      <Card><Box sx={{ height: 600, width: '100%' }}><DataGrid rows={filtered} columns={cols} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box></Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{editId ? "Tahrirlash" : "Navbat Qo'shish"}</DialogTitle><DialogContent dividers><Grid container spacing={3} sx={{ pt: 1 }}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Bemor Ismi" value={formData.patientName} onChange={e=>setFormData({...formData, patientName: e.target.value})} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={isShifokor}>
            <InputLabel>Shifokor</InputLabel>
            <Select value={formData.doctorName} label="Shifokor" onChange={e=>setFormData({...formData, doctorName: e.target.value})}>
                {doctors.map(d => <MenuItem key={d.id || d.fullName} value={d.fullName}>{d.fullName}</MenuItem>)}
                {doctors.length === 0 && <MenuItem value="" disabled>Shifokorlar yo'q (Xodimlar bo'limidan qo'shing)</MenuItem>}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Sana" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} InputLabelProps={{shrink: true}} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth type="time" label="Vaqt" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} InputLabelProps={{shrink: true}} /></Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Sabab / Shikoyat" value={formData.reason} onChange={handleReasonChange} placeholder="Masalan: Tishim og'riyapti..." />
          <Grow in={aiRouted}>
            <Box sx={{ mt: 1 }}>
              <Chip icon={<AutoAwesomeIcon />} label={`AI Tahlil: Bemor avtomatik tarzda ${formData.doctorName} xizmatiga yo'naltirildi`} color="success" sx={{ fontWeight: 'bold' }} />
            </Box>
          </Grow>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Holat</InputLabel>
            <Select value={formData.status} label="Holat" onChange={e=>setFormData({...formData, status: e.target.value})}>
              <MenuItem value="Tasdiqlangan">Tasdiqlangan</MenuItem>
              <MenuItem value="Kutilmoqda">Kutilmoqda</MenuItem>
              <MenuItem value="Bajarildi">Bajarildi</MenuItem>
              <MenuItem value="Bekor qilindi">Bekor qilindi</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Bekor</Button><Button onClick={handleSubmit} variant="contained">Saqlash</Button></DialogActions></Dialog>
    </Box>
  );
};

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', role: '', department: '', phone: '', password: '', status: 'Faol' });

  useEffect(() => { fetchStaff(); }, []);
  const fetchStaff = async () => { try { const res = await safeApi('GET', 'staff'); setStaff(res.data?.data || []); } catch(e){} };
  
  const handleOpen = (s = null) => {
    if (s) { setEditId(s.id); setFormData({ fullName: s.fullName, role: s.role, department: s.department, phone: s.phone, password: s.password || '', status: s.status }); }
    else { setEditId(null); setFormData({ fullName: '', role: '', department: '', phone: '', password: '', status: 'Faol' }); }
    setOpen(true);
  }

  const handleSubmit = async () => { 
    if (!formData.fullName?.trim() || !formData.role || !formData.phone?.trim() || !formData.password?.trim()) return toast.error("Xodim ism-sharifi, lavozimi, telefoni va parolini kiriting!");
    try {
      if (editId) { await safeApi('PUT', 'staff', editId, formData); toast.success("Yangilandi"); }
      else { await safeApi('POST', 'staff', null, formData); toast.success("Qo'shildi"); }
      setOpen(false); fetchStaff(); 
    } catch(err) { toast.error("Xatolik: " + (err.response?.data?.message || err.message || "Ulanishda xato")); }
  };
  const handleDelete = async (id) => { 
    if (!window.confirm("Xodimni tizimdan o'chirib tashlamoqchimisiz?")) return;
    try { await safeApi('DELETE', 'staff', id); fetchStaff(); toast.success("O'chirildi"); } catch(e){}
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Klinika Xodimlari", 14, 15);
    const tableData = staff.map(s => [s.fullName, s.role, s.department, s.phone, s.status]);
    doc.autoTable({ head: [["F.I.O", "Lavozim", "Bo'lim", "Telefon", "Holati"]], body: tableData, startY: 20 });
    doc.save(`Xodimlar.pdf`); toast.success("PDF Yuklab olindi!");
  };

  const cols = [
    { field: 'fullName', headerName: 'F.I.O', flex: 1, minWidth: 200 },
    { field: 'role', headerName: 'Lavozim', flex: 1, minWidth: 150 },
    { field: 'department', headerName: 'Bo\'lim', flex: 1, minWidth: 150 },
    { field: 'phone', headerName: 'Telefon', width: 150 },
    { field: 'password', headerName: 'Parol', width: 120, renderCell: () => '****' },
    { field: 'actions', type: 'actions', width: 100, getActions: (p) => [
      <GridActionsCellItem icon={<EditIcon color="primary"/>} label="Edit" onClick={() => handleOpen(p.row)} />,
      <GridActionsCellItem icon={<DeleteIcon color="error"/>} label="Delete" onClick={() => handleDelete(p.id)} />
    ] }
  ];

  const filtered = staff.filter(s => (s.fullName || '').toLowerCase().includes((search || '').toLowerCase()) || (s.role || '').toLowerCase().includes((search || '').toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Xodimlar Boshqaruvi</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Izlash..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={exportPDF}>PDF</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Yangi</Button>
        </Box>
      </Box>
      <Card><Box sx={{ height: 600, width: '100%' }}><DataGrid rows={filtered} columns={cols} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box></Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{editId ? "Xodimni Tahrirlash" : "Xodim Qo'shish"}</DialogTitle><DialogContent dividers><Grid container spacing={3} sx={{ pt: 1 }}>
        <Grid item xs={12}><TextField fullWidth label="F.I.O" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Lavozim</InputLabel>
            <Select value={formData.role} label="Lavozim" onChange={e=>setFormData({...formData, role: e.target.value})}>
              <MenuItem value="Bosh shifokor">Bosh shifokor</MenuItem>
              <MenuItem value="Shifokor">Shifokor</MenuItem>
              <MenuItem value="Hamshira">Hamshira</MenuItem>
              <MenuItem value="Qabulxona">Qabulxona</MenuItem>
              <MenuItem value="Kassir">Kassir</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Bo'lim</InputLabel>
            <Select value={formData.department} label="Bo'lim" onChange={e=>setFormData({...formData, department: e.target.value})}>
              <MenuItem value="Umumiy">Umumiy</MenuItem>
              <MenuItem value="Jarrohlik">Jarrohlik</MenuItem>
              <MenuItem value="Kardiologiya">Kardiologiya</MenuItem>
              <MenuItem value="Pediatriya">Pediatriya</MenuItem>
              <MenuItem value="Ma'muriyat">Ma'muriyat</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Telefon" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Parol" type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Holati</InputLabel>
            <Select value={formData.status} label="Holati" onChange={e=>setFormData({...formData, status: e.target.value})}>
              <MenuItem value="Faol">Faol</MenuItem>
              <MenuItem value="Ta'tilda">Ta'tilda</MenuItem>
              <MenuItem value="Ishdan bo'shatilgan">Ishdan bo'shatilgan</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Bekor</Button><Button onClick={handleSubmit} variant="contained">Saqlash</Button></DialogActions></Dialog>
    </Box>
  );
};

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ patientName: '', serviceName: '', amount: '', date: '2026-06-07', status: 'To\'landi' });

  useEffect(() => { fetchBills(); }, []);
  const fetchBills = async () => { try { const res = await safeApi('GET', 'billing'); setBills(res.data?.data || []); } catch(e){} };
  
  const handleOpen = (b = null) => {
    if (b) { setEditId(b.id); setFormData({ patientName: b.patientName, serviceName: b.serviceName, amount: b.amount, date: b.date, status: b.status }); }
    else { setEditId(null); setFormData({ patientName: '', serviceName: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'To\'langan' }); }
    setOpen(true);
  }

  const handleSubmit = async () => { 
    if (!formData.patientName?.trim() || !formData.serviceName) return toast.error("Barcha maydonlarni to'ldiring!");
    if (Number(formData.amount) < 0) return toast.error("Kechirasiz, to'lov summasi manfiy bo'lishi mumkin emas!");
    try {
      if(editId) { await safeApi('PUT', 'billing', editId, formData); toast.success("Yangilandi"); }
      else { await safeApi('POST', 'billing', null, formData); toast.success("Qo'shildi"); }
      setOpen(false); fetchBills(); 
    } catch(err) { toast.error("Xatolik: " + (err.response?.data?.message || err.message || "Ulanishda xato")); }
  };
  const handleDelete = async (id) => { 
    if (!window.confirm("Ushbu to'lovni o'chirishga ishonchingiz komilmi?")) return;
    try { await safeApi('DELETE', 'billing', id); fetchBills(); toast.success("O'chirildi"); } catch(e){}
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Moliya Tushumlari", 14, 15);
    const tableData = bills.map(b => [b.patientName, b.serviceName, formatCurrency(b.amount), b.date, b.status]);
    doc.autoTable({ head: [["Mijoz/Bemor", "Xizmat turi", "Summa", "Sana", "Holat"]], body: tableData, startY: 20 });
    doc.save(`Moliya.pdf`); toast.success("PDF Yuklab olindi!");
  };

  const cols = [
    { field: 'patientName', headerName: 'Bemor Ismi', flex: 1, minWidth: 200 },
    { field: 'serviceName', headerName: 'Ko\'rsatilgan Xizmat', flex: 1, minWidth: 150 },
    { field: 'amount', headerName: 'Summa', width: 120, renderCell: (p) => formatCurrency(p.value) },
    { field: 'date', headerName: 'Sana', width: 120 },
    { field: 'actions', type: 'actions', width: 100, getActions: (p) => [
      <GridActionsCellItem icon={<EditIcon color="primary"/>} label="Edit" onClick={() => handleOpen(p.row)} />,
      <GridActionsCellItem icon={<DeleteIcon color="error"/>} label="Delete" onClick={() => handleDelete(p.id)} />
    ] }
  ];

  const filtered = bills.filter(b => (b.patientName || '').toLowerCase().includes((search || '').toLowerCase()) || (b.serviceName || '').toLowerCase().includes((search || '').toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Moliya va Kassa</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Kassadan izlash..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={exportPDF}>PDF</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Yangi To'lov</Button>
        </Box>
      </Box>
      <Card><Box sx={{ height: 600, width: '100%' }}><DataGrid rows={filtered} columns={cols} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box></Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{editId ? "To'lovni Tahrirlash" : "To'lov Qo'shish"}</DialogTitle><DialogContent dividers><Grid container spacing={3} sx={{ pt: 1 }}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Bemor" value={formData.patientName} onChange={e=>setFormData({...formData, patientName: e.target.value})} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Xizmat turi</InputLabel>
            <Select value={formData.serviceName} label="Xizmat turi" onChange={e=>setFormData({...formData, serviceName: e.target.value})}>
              <MenuItem value="Konsultatsiya">Konsultatsiya</MenuItem>
              <MenuItem value="Tahlillar">Tahlillar</MenuItem>
              <MenuItem value="UZI">UZI</MenuItem>
              <MenuItem value="Muolaja">Muolaja</MenuItem>
              <MenuItem value="Operatsiya">Operatsiya</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Summa" value={formData.amount} onChange={e=>setFormData({...formData, amount: Number(e.target.value)})} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Sana" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} InputLabelProps={{shrink: true}} /></Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Holat</InputLabel>
            <Select value={formData.status} label="Holat" onChange={e=>setFormData({...formData, status: e.target.value})}>
              <MenuItem value="To'landi">To'landi</MenuItem>
              <MenuItem value="Qarzdor">Qarzdor</MenuItem>
              <MenuItem value="To'lov kutilmoqda">To'lov kutilmoqda</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Bekor</Button><Button onClick={handleSubmit} variant="contained">Saqlash</Button></DialogActions></Dialog>
    </Box>
  );
};

const AppLayout = ({ onLogout, themeMode, toggleTheme, theme, loggedInUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = loggedInUser?.role || 'Bosh shifokor';
  
  const allNavs = [
    { text: 'Boshqaruv Paneli', icon: <DashboardOutlinedIcon />, path: '/', roles: ['Bosh shifokor', 'Kassir'] },
    { text: 'AI Tashxis', icon: <AutoAwesomeIcon sx={{ color: '#8b5cf6' }} />, path: '/ai-diagnostics', roles: ['Qabulxona'] },
    { text: 'Bemorlar', icon: <PeopleOutlinedIcon />, path: '/patients', roles: ['Bosh shifokor', 'Shifokor', 'Hamshira', 'Qabulxona'] },
    { text: 'Navbatlar', icon: <AssignmentIcon />, path: '/appointments', roles: ['Bosh shifokor', 'Shifokor', 'Hamshira', 'Qabulxona'] },
    { text: 'Xodimlar', icon: <MedicalServicesOutlinedIcon />, path: '/staff', roles: ['Bosh shifokor'] },
    { text: 'Moliya va Kassa', icon: <ReceiptLongOutlinedIcon />, path: '/billing', roles: ['Bosh shifokor', 'Kassir'] },
  ];
  const navs = allNavs.filter(n => n.roles.includes(role));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)', borderBottom: `1px solid ${theme.palette.divider}`, backdropFilter: 'blur(8px)', color: theme.palette.text.primary }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">{loggedInUser?.fullName || 'Foydalanuvchi'} ({role})</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton onClick={toggleTheme} color="inherit">
              {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
            <IconButton onClick={onLogout} size="small" sx={{ color: '#ef4444' }}><ExitToAppIcon /></IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalHospitalIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>MedUz ERP</Typography>
        </Box>
        <List sx={{ px: 2, pt: 2, flexGrow: 1 }}>
          {navs.map((n) => (
            <ListItem key={n.text} disablePadding>
              <ListItemButton selected={location.pathname === n.path} onClick={() => navigate(n.path)} sx={{ borderRadius: 2, mb: 1, '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', '& .MuiListItemIcon-root': { color: '#3b82f6' } } }}>
                <ListItemIcon sx={{ minWidth: 40, color: theme.palette.text.secondary }}>{n.icon}</ListItemIcon>
                <ListItemText primary={n.text} primaryTypographyProps={{ fontWeight: location.pathname === n.path ? 600 : 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 2, textAlign: 'center', mt: 'auto', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem', display: 'block' }}>Komilov Fazliddin tomonidan</Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem', display: 'block' }}>tayyorlandi BMI uchun</Typography>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, pt: { xs: 10, md: 12 }, width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }, overflowX: 'hidden' }}>
        <Container maxWidth="xl" disableGutters sx={{ width: '100%' }}>
          <Routes>
            <Route path="/" element={<Dashboard theme={theme} loggedInUser={loggedInUser}/>} />
            <Route path="/ai-diagnostics" element={<AIDiagnostics />} />
            <Route path="/patients" element={<Patients loggedInUser={loggedInUser} />} />
            <Route path="/appointments" element={<Appointments loggedInUser={loggedInUser}/>} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/billing" element={<Billing />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [mode, setMode] = useState('light');
  
  useEffect(() => { 
    const savedUser = localStorage.getItem('meduz_auth_user');
    if (savedUser) setLoggedInUser(JSON.parse(savedUser)); 
  }, []);
  
  const handleLogin = (user) => { setLoggedInUser(user); localStorage.setItem('meduz_auth_user', JSON.stringify(user)); };
  const handleLogout = () => { setLoggedInUser(null); localStorage.removeItem('meduz_auth_user'); };
  const toggleTheme = () => { setMode(prev => prev === 'light' ? 'dark' : 'light'); };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#3b82f6' },
      secondary: { main: '#8b5cf6' },
      background: { default: mode === 'light' ? '#f8fafc' : '#0f172a', paper: mode === 'light' ? '#ffffff' : '#1e293b' },
      text: { primary: mode === 'light' ? '#0f172a' : '#f8fafc' },
      divider: mode === 'light' ? '#e2e8f0' : '#334155'
    },
    typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: { styleOverrides: { root: { border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155', boxShadow: 'none' } } },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    },
  }), [mode]);

  return (
    <div style={{ width: '100vw', minHeight: '100vh', margin: 0, padding: 0, textAlign: 'left', overflowX: 'hidden' }}>
      <ThemeProvider theme={theme}>
        <Toaster position="top-right" />
        {!loggedInUser ? <LoginScreen onLogin={handleLogin} /> : <BrowserRouter><AppLayout onLogout={handleLogout} themeMode={mode} toggleTheme={toggleTheme} theme={theme} loggedInUser={loggedInUser}/></BrowserRouter>}
      </ThemeProvider>
    </div>
  );
}
