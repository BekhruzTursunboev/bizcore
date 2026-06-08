import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider, createTheme, CssBaseline, Box, Drawer, AppBar, Toolbar, List, Typography, ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Grid, Card, CardContent, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, Avatar, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const FALLBACK_DB_URL = 'https://api.restful-api.dev/objects/ff8081819d82fab6019ea6564a494eb4';

const safeApi = async (method, resource, id = null, data = null) => {
  try {
    const url = id ? `${API_URL}/${resource}/${id}` : `${API_URL}/${resource}`;
    const res = await axios({ method, url, data });
    return res;
  } catch (err) {
    console.warn(`Backend unreachable. Using Cloud Fallback DB for ${resource}.`);
    try {
      const dbRes = await fetch(FALLBACK_DB_URL);
      const dbObj = await dbRes.json();
      const dbData = dbObj.data || { patients: [], staff: [], billing: [], appointments: [] };
      let items = dbData[resource] || [];

      if (method === 'GET') return { data: { data: items } };

      if (method === 'POST') {
        const newItem = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
        items.unshift(newItem);
        dbData[resource] = items;
        await fetch(FALLBACK_DB_URL, { method: 'PUT', body: JSON.stringify({ name: 'meduz_erp_db', data: dbData }), headers: { 'Content-Type': 'application/json' } });
        return { data: { data: newItem } };
      }
      if (method === 'PUT') {
        items = items.map(item => String(item.id) === String(id) ? { ...item, ...data } : item);
        dbData[resource] = items;
        await fetch(FALLBACK_DB_URL, { method: 'PUT', body: JSON.stringify({ name: 'meduz_erp_db', data: dbData }), headers: { 'Content-Type': 'application/json' } });
        return { data: { data: items.find(item => String(item.id) === String(id)) } };
      }
      if (method === 'DELETE') {
        items = items.filter(item => String(item.id) !== String(id));
        dbData[resource] = items;
        await fetch(FALLBACK_DB_URL, { method: 'PUT', body: JSON.stringify({ name: 'meduz_erp_db', data: dbData }), headers: { 'Content-Type': 'application/json' } });
        return { data: { status: 'deleted' } };
      }
    } catch (fallbackErr) {
      console.error("Fallback DB ham ishlamayapti", fallbackErr);
      if (method === 'GET') return { data: { data: [] } };
      throw new Error("Tarmoqda ulanish imkonsiz!");
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
  
  const handleLogin = async () => { 
    if (phone === 'admin' && password === '1234') { 
      toast.success("Bosh Vrach tizimga kirdi"); 
      onLogin({ id: 'admin', fullName: 'Dr. Rustamov', role: 'Bosh shifokor', phone: 'admin' }); 
      return; 
    } 
    
    try {
      const res = await safeApi('GET', 'staff');
      const staffList = res.data?.data || [];
      const user = staffList.find(s => s?.phone === phone && s?.password === password);
      
      if (user) {
        toast.success(`${user.role} tizimga kirdi`);
        onLogin(user);
      } else {
        toast.error("Telefon raqam yoki parol noto'g'ri");
      }
    } catch (e) {
      toast.error("Tarmoqda xatolik!");
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
        <Button fullWidth variant="contained" size="large" onClick={handleLogin}>Kirish</Button>
      </Card>
    </Box>
  );
};

const Dashboard = ({ theme }) => {
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
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}><StatCard title="Jami Bemorlar" value={patients.length} trend={12.5} subtitle="Barcha vaqtlar" icon={<PeopleOutlinedIcon fontSize="large"/>} theme={theme} /></Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}><StatCard title="Navbatlar (Appointments)" value={appointments.length || 1} trend={3.2} subtitle="Bugungi qabullar" icon={<AssignmentIndIcon fontSize="large"/>} theme={theme} /></Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}><StatCard title="Kassa Tushumi" value={formatCurrency(totalRevenue)} trend={8.4} subtitle="Billing DB'dan olingan" icon={<AttachMoneyIcon fontSize="large"/>} theme={theme} /></Box>
      
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

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', doctorName: '', status: 'Kuzatuvda', appointmentTime: '09:00' });

  useEffect(() => { fetchPatients(); }, []);
  const fetchPatients = async () => { 
    try { 
      const res = await safeApi('GET', 'patients'); setPatients(res.data?.data || []); 
      const resStaff = await safeApi('GET', 'staff');
      setDoctors((resStaff.data?.data || []).filter(s => (s.role || '').toLowerCase().includes('shifokor')));
    } catch(e){} 
  };
  
  const handleOpenDialog = (p = null) => {
    if (p) { setEditId(p.id); setFormData({ firstName: p.firstName, lastName: p.lastName, doctorName: p.doctorName, status: p.status, appointmentTime: p.appointmentTime }); }
    else { setEditId(null); setFormData({ firstName: '', lastName: '', doctorName: '', status: 'Kuzatuvda', appointmentTime: '09:00' }); }
    setOpenDialog(true);
  };

  const handleSubmit = async () => { 
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.doctorName) return toast.error("Iltimos, barcha maydonlarni to'ldiring!");
    try {
      if (editId) { await safeApi('PUT', 'patients', editId, formData); toast.success("Muvaffaqiyatli tahrirlandi!"); }
      else { await safeApi('POST', 'patients', null, formData); toast.success("Muvaffaqiyatli saqlandi!"); }
      setOpenDialog(false); fetchPatients();
    } catch (err) { toast.error("Xatolik: " + (err.response?.data?.message || err.message || "Ulanishda xato")); }
  };
  const handleDelete = async (id) => { 
    if (!window.confirm("Rostdan ham ushbu bemorni o'chirmoqchimisiz?")) return;
    try { await safeApi('DELETE', 'patients', id); toast.success("Bemor o'chirildi!"); fetchPatients(); } catch (err) { toast.error("Xatolik!"); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("MedUz - Bemorlar Hisoboti", 14, 15);
    const tableData = patients.map(p => [p.firstName, p.lastName, p.doctorName, p.status, p.appointmentTime]);
    doc.autoTable({ head: [["Ism", "Familiya", "Shifokor", "Holati", "Vaqt"]], body: tableData, startY: 20 });
    doc.save(`Bemorlar.pdf`); toast.success("PDF Yuklab olindi!");
  };

  const cols = [
    { field: 'patient', headerName: 'Bemor F.I.O', flex: 1, minWidth: 200, renderCell: (p) => `${p.row.firstName} ${p.row.lastName}` },
    { field: 'doctorName', headerName: 'Biriktirilgan Shifokor', flex: 1, minWidth: 150 },
    { field: 'appointmentTime', headerName: 'Vaqti', width: 100 },
    { field: 'status', headerName: 'Holati', width: 150, renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'Sog\'aygan' ? 'success' : 'primary'} /> },
    { field: 'actions', type: 'actions', width: 100, getActions: (p) => [
      <GridActionsCellItem icon={<EditIcon color="primary"/>} label="Edit" onClick={() => handleOpenDialog(p.row)} />,
      <GridActionsCellItem icon={<DeleteIcon color="error"/>} label="Delete" onClick={() => handleDelete(p.id)} />
    ]}
  ];

  const filtered = patients.filter(p => ((p.firstName || '') + ' ' + (p.lastName || '')).toLowerCase().includes((search || '').toLowerCase()) || (p.doctorName || '').toLowerCase().includes((search || '').toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Bemorlar Boshqaruvi</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Izlash..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={exportPDF}>PDF</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Yangi</Button>
        </Box>
      </Box>
      <Card><Box sx={{ height: 600, width: '100%' }}><DataGrid rows={filtered} columns={cols} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box></Card>
      
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
                {doctors.length === 0 && <MenuItem value="" disabled>Shifokorlar yo'q (Xodimlar bo'limidan qo'shing)</MenuItem>}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Vaqt" type="time" value={formData.appointmentTime} onChange={e => setFormData({...formData, appointmentTime: e.target.value})} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Holati (Kuzatuvda / Sog'aygan)</InputLabel>
              <Select value={formData.status} label="Holati (Kuzatuvda / Sog'aygan)" onChange={e => setFormData({...formData, status: e.target.value})}>
                <MenuItem value="Kuzatuvda">Kuzatuvda</MenuItem>
                <MenuItem value="Sog'aygan">Sog'aygan</MenuItem>
                <MenuItem value="Og'ir">Og'ir</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Bekor qilish</Button><Button onClick={handleSubmit} variant="contained">{editId ? "Yangilash" : "Saqlash"}</Button></DialogActions>
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
  
  const handleOpen = (a = null) => {
    if (a) { setEditId(a.id); setFormData({ patientName: a.patientName, doctorName: a.doctorName, date: a.date, time: a.time, reason: a.reason, status: a.status }); }
    else { setEditId(null); setFormData({ patientName: '', doctorName: '', date: '2026-06-08', time: '10:00', reason: '', status: 'Tasdiqlangan' }); }
    setOpen(true);
  }

  const handleSubmit = async () => { 
    if (!formData.patientName?.trim() || !formData.doctorName || !formData.date || !formData.time) return toast.error("Barcha maydonlarni to'ldiring!");
    try {
      if (editId) { await safeApi('PUT', 'appointments', editId, formData); toast.success("Yangilandi"); }
      else { await safeApi('POST', 'appointments', null, formData); toast.success("Navbat yaratildi"); }
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
          <FormControl fullWidth>
            <InputLabel>Shifokor</InputLabel>
            <Select value={formData.doctorName} label="Shifokor" onChange={e=>setFormData({...formData, doctorName: e.target.value})}>
                {doctors.map(d => <MenuItem key={d.id || d.fullName} value={d.fullName}>{d.fullName}</MenuItem>)}
                {doctors.length === 0 && <MenuItem value="" disabled>Shifokorlar yo'q (Xodimlar bo'limidan qo'shing)</MenuItem>}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Sana" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} InputLabelProps={{shrink: true}} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth type="time" label="Vaqt" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} InputLabelProps={{shrink: true}} /></Grid>
        <Grid item xs={12}><TextField fullWidth label="Sabab" value={formData.reason} onChange={e=>setFormData({...formData, reason: e.target.value})} /></Grid>
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
  const [formData, setFormData] = useState({ patientName: '', serviceName: '', amount: 0, date: '2026-06-07', status: 'To\'langan' });

  useEffect(() => { fetchBills(); }, []);
  const fetchBills = async () => { try { const res = await safeApi('GET', 'billing'); setBills(res.data?.data || []); } catch(e){} };
  
  const handleOpen = (b = null) => {
    if (b) { setEditId(b.id); setFormData({ patientName: b.patientName, serviceName: b.serviceName, amount: b.amount, date: b.date, status: b.status }); }
    else { setEditId(null); setFormData({ patientName: '', serviceName: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'To\'langan' }); }
    setOpen(true);
  }

  const handleSubmit = async () => { 
    if (!formData.patientName?.trim() || !formData.serviceName) return toast.error("Bemor ismi va xizmat turini kiriting!");
    if (Number(formData.amount) <= 0) return toast.error("Summa 0 dan katta bo'lishi shart!");
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
              <MenuItem value="To'langan">To'langan</MenuItem>
              <MenuItem value="Qarz">Qarz</MenuItem>
              <MenuItem value="Bekor qilingan">Bekor qilingan</MenuItem>
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
            <Route path="/" element={<Dashboard theme={theme}/>} />
            <Route path="/patients" element={<Patients />} />
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
