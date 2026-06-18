import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from './api.js';

/* ─── UTILS ──────────────────────────────────────────────────────────────── */
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0)) + ' so\'m';
const fmtK = n => { if (!n) return '0'; if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mln'; if (n >= 1000) return (n / 1000).toFixed(0) + ' ming'; return String(Math.round(n)); };
const dateStr = d => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
const timeAgo = d => { if (!d) return ''; const s = Math.round((Date.now() - new Date(d)) / 1000); if (s < 60) return `${s}s oldin`; if (s < 3600) return `${Math.round(s / 60)}m oldin`; if (s < 86400) return `${Math.round(s / 3600)}s oldin`; return dateStr(d); };

/* ─── INLINE SVG ICONS ───────────────────────────────────────────────────── */
const Ic = ({ d, size = 18, stroke = 'currentColor', sw = 1.8, fill = 'none', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const IC = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 7m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0'],
  building: ['M3 21h18', 'M5 21V7l8-4v18', 'M19 21V11l-6-4'],
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  dollar: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  check_sq: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  handshake: ['M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  sun: 'M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  plus: 'M12 5v14M5 12h14',
  edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'],
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  pdf: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  up: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  down: ['M23 18l-9.5-9.5-5 5L1 6', 'M17 18h6v-6'],
  warn: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  chevR: 'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  activity: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3'],
  info: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 8h.01', 'M12 12v4'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  calendar: ['M3 4h18v18H3z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  layers: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
};

/* ─── COLOR TOKENS ───────────────────────────────────────────────────────── */
const STATUS_COLORS = {
  'Faol':         { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  'Yangi':        { bg: '#dbeafe', fg: '#1e40af', dot: '#3b82f6' },
  'Jarayonda':    { bg: '#fef9c3', fg: '#854d0e', dot: '#eab308' },
  'Bajarildi':    { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  'Bekor qilindi':{ bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  'Kutilmoqda':   { bg: '#fef9c3', fg: '#854d0e', dot: '#eab308' },
  'Tasdiqlangan': { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  'Mavjud':       { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  'Kam qoldi':    { bg: '#fef9c3', fg: '#854d0e', dot: '#eab308' },
  'Tugagan':      { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  'Nofaol':       { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  'Ta\'tilda':    { bg: '#faf5ff', fg: '#6b21a8', dot: '#a855f7' },
};
const PIE_C = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#db2777'];
const DEP_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#0891b2','#db2777','#16a34a'];

/* ─── MICRO COMPONENTS ───────────────────────────────────────────────────── */
const Badge = ({ value }) => {
  const c = STATUS_COLORS[value] || { bg:'#f1f5f9', fg:'#475569', dot:'#94a3b8' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:c.bg, color:c.fg, padding:'3px 10px', borderRadius:99, fontSize:11.5, fontWeight:700, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, display:'inline-block' }} />{value||'—'}
    </span>
  );
};

const PriBadge = ({ v }) => {
  const m = { 'Yuqori':{ bg:'#fee2e2',fg:'#991b1b' }, 'Oddiy':{ bg:'#dbeafe',fg:'#1e40af' }, 'Past':{ bg:'#dcfce7',fg:'#166534' } };
  const c = m[v]||{ bg:'#f1f5f9',fg:'#475569' };
  return <span style={{ background:c.bg, color:c.fg, padding:'3px 10px', borderRadius:99, fontSize:11.5, fontWeight:700 }}>{v}</span>;
};

const Av = ({ name='', size=34 }) => {
  const cols=['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
  const bg = cols[(name.charCodeAt(0)||0)%cols.length];
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:size*.36, flexShrink:0 }}>{name?.[0]?.toUpperCase()||'?'}</div>;
};

const Skel = ({ w='100%', h=18, r=8 }) => <div className="skeleton" style={{ width:w, height:h, borderRadius:r }} />;

const ProgBar = ({ value=0, color='#2563eb' }) => (
  <div style={{ width:'100%', height:6, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
    <div style={{ width:`${Math.min(100,Math.max(0,value))}%`, height:'100%', background:color, borderRadius:99, transition:'width .4s cubic-bezier(.16,1,.3,1)' }} />
  </div>
);

/* ─── FORM PRIMITIVES ────────────────────────────────────────────────────── */
const base = { width:'100%', padding:'10px 13px', border:'1.5px solid var(--border)', borderRadius:10, background:'var(--bg)', color:'var(--text-1)', fontSize:14, fontFamily:'Outfit,sans-serif', outline:'none', transition:'border-color .15s,box-shadow .15s', boxSizing:'border-box' };
const focusEvt = e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,.12)'; };
const blurEvt  = e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; };

const FL = ({ label, required, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    <label style={{ fontSize:12.5, fontWeight:600, color:'var(--text-2)' }}>{label}{required&&<span style={{ color:'#dc2626' }}> *</span>}</label>
    {children}
  </div>
);
const Inp = ({ label, type='text', value, onChange, placeholder, required, readOnly }) => (
  <FL label={label} required={required}><input type={type} value={value||''} onChange={onChange} placeholder={placeholder} required={required} readOnly={readOnly} style={{ ...base, cursor:readOnly?'default':undefined }} onFocus={focusEvt} onBlur={blurEvt} /></FL>
);
const Sel = ({ label, value, onChange, opts, required }) => (
  <FL label={label} required={required}><select value={value||''} onChange={onChange} style={{ ...base, cursor:'pointer' }} onFocus={focusEvt} onBlur={blurEvt}>{opts.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}</select></FL>
);
const TA = ({ label, value, onChange, rows=3 }) => (
  <FL label={label}><textarea value={value||''} onChange={onChange} rows={rows} style={{ ...base, resize:'vertical' }} onFocus={focusEvt} onBlur={blurEvt} /></FL>
);

/* ─── BUTTON ─────────────────────────────────────────────────────────────── */
const Btn = ({ children, onClick, variant='primary', size='md', icon, disabled, type='button', full }) => {
  const vs = { primary:{bg:'#2563eb',fg:'#fff',hov:'#1d4ed8',border:'none'}, secondary:{bg:'transparent',fg:'var(--text-1)',hov:'var(--accent-muted)',border:'1.5px solid var(--border)'}, danger:{bg:'#fee2e2',fg:'#dc2626',hov:'#fca5a5',border:'1.5px solid #fca5a5'}, ghost:{bg:'transparent',fg:'var(--text-2)',hov:'var(--border)',border:'none'} };
  const ss = { sm:{p:'5px 11px',fs:12}, md:{p:'8px 17px',fs:13.5}, lg:{p:'12px 24px',fs:15} };
  const v = vs[variant]; const s = ss[size];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display:'inline-flex', alignItems:'center', gap:7, padding:s.p, fontSize:s.fs, fontWeight:700, fontFamily:'Outfit,sans-serif', borderRadius:10, border:v.border, background:v.bg, color:v.fg, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.6:1, width:full?'100%':undefined, justifyContent:full?'center':undefined, transition:'all .15s' }}
      onMouseEnter={e=>{ if(!disabled){e.currentTarget.style.background=v.hov;} }}
      onMouseLeave={e=>{ if(!disabled){e.currentTarget.style.background=v.bg;} }}
      onMouseDown={e=>{ if(!disabled)e.currentTarget.style.transform='scale(0.97)'; }}
      onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
      {icon&&<Ic d={icon} size={14} />}{children}
    </button>
  );
};

/* ─── MODAL ──────────────────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, children, maxW=560 }) => {
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    if(open) { document.addEventListener('keydown',h); document.body.style.overflow='hidden'; }
    return () => { document.removeEventListener('keydown',h); document.body.style.overflow=''; };
  }, [open,onClose]);
  if(!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(8px)' }} />
      <div style={{ position:'relative', width:'100%', maxWidth:maxW, background:'var(--bg-card)', borderRadius:20, boxShadow:'0 30px 70px rgba(0,0,0,.2)', animation:'fadeUp .28s cubic-bezier(.16,1,.3,1) both', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h3 style={{ fontWeight:700, fontSize:16, color:'var(--text-1)' }}>{title}</h3>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', padding:6, borderRadius:8, color:'var(--text-3)', display:'flex', alignItems:'center' }} onMouseEnter={e=>e.currentTarget.style.background='var(--border)'} onMouseLeave={e=>e.currentTarget.style.background='none'}><Ic d={IC.x} size={17} /></button>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>{children}</div>
      </div>
    </div>
  );
};

const ConfirmDlg = ({ open, onClose, onConfirm, msg='Bu amalni qaytarib bo\'lmaydi.' }) => (
  <Modal open={open} onClose={onClose} title="Tasdiqlang" maxW={400}>
    <div style={{ padding:'18px 22px' }}>
      <p style={{ color:'var(--text-2)', fontSize:14, marginBottom:20, lineHeight:1.7 }}>{msg}</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>Bekor qilish</Btn>
        <Btn variant="danger" icon={IC.trash} onClick={()=>{ onConfirm(); onClose(); }}>O'chirish</Btn>
      </div>
    </div>
  </Modal>
);

/* ─── TABLE ──────────────────────────────────────────────────────────────── */
const DataTable = ({ cols, rows, loading, empty='Ma\'lumot topilmadi' }) => (
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
      <thead>
        <tr style={{ borderBottom:'2px solid var(--border)' }}>
          {cols.map(c=><th key={c.key||c.label} style={{ padding:'11px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.07em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {loading ? Array(6).fill(0).map((_,i)=>(
          <tr key={i}>{cols.map(c=><td key={c.key||c.label} style={{ padding:'13px 14px', borderBottom:'1px solid var(--border)' }}><Skel h={16} w={`${50+Math.random()*40}%`} /></td>)}</tr>
        )) : rows.length===0 ? (
          <tr><td colSpan={cols.length} style={{ padding:'60px 14px', textAlign:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'var(--text-3)' }}>
              <Ic d={IC.warn} size={40} stroke="var(--text-3)" />
              <span style={{ fontSize:14, fontWeight:500 }}>{empty}</span>
            </div>
          </td></tr>
        ) : rows.map((row,i)=>(
          <tr key={row.id||i} style={{ borderBottom:'1px solid var(--border)', transition:'background .1s' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--accent-muted)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {cols.map(c=><td key={c.key||c.label} style={{ padding:'12px 14px', fontSize:13.5, color:'var(--text-1)', whiteSpace:'nowrap' }}>{c.render?c.render(row[c.key],row):(row[c.key]??'—')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─── CRUD HOOK ──────────────────────────────────────────────────────────── */
const useCrud = endpoint => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fetch = useCallback(async (params={})=>{ setLoading(true); try { const r=await api.get(`/api/${endpoint}`,{params}); setRows(r.data||[]); } catch { toast.error('Yuklashda xato'); } finally { setLoading(false); } },[endpoint]);
  useEffect(()=>{ fetch(); },[fetch]);
  const save = async (data, id) => { setSaving(true); try { if(id){await api.put(`/api/${endpoint}/${id}`,data);toast.success('Yangilandi!');}else{await api.post(`/api/${endpoint}`,data);toast.success('Qo\'shildi!');} await fetch(); return true; } catch(e){ toast.error(e.response?.data?.error||'Xato'); return false; } finally{setSaving(false);} };
  const remove = async id => { try{await api.delete(`/api/${endpoint}/${id}`);toast.success('O\'chirildi!');await fetch();}catch{toast.error('O\'chirishda xato');} };
  return { rows, loading, saving, fetch, save, remove };
};

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const ROLES = ['Direktor','Bosh Menejer','HR Menejer','Moliya Menejeri','Savdo Menejeri','Ombor Boshlig\'i','Dasturchi','Dizayner','Marketolog','Buxgalter','Xodim'];
const DEPTS = ['Boshqaruv','HR Bo\'limi','Moliya Bo\'limi','Savdo Bo\'limi','Omborxona','IT Bo\'limi','Marketing Bo\'limi'];
const STATUSES = ['Faol','Nofaol','Ta\'tilda'];
const PRIOS = ['Yuqori','Oddiy','Past'];
const TASK_ST = ['Yangi','Jarayonda','Bajarildi','Bekor qilindi'];
const FIN_ST = ['Tasdiqlangan','Kutilmoqda','Bekor qilindi'];
const CONTRACT_ST = ['Faol','Kutilmoqda','Bajarildi','Bekor qilindi'];

/* ─── FORM COMPONENTS ────────────────────────────────────────────────────── */
const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };
const span2 = { gridColumn:'1/-1' };

const UserForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ full_name:'',email:'',password:'',role:'Xodim',department:'Boshqaruv',phone:'',salary:'',status:'Faol',hire_date:new Date().toISOString().split('T')[0],...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    if (d.salary < 0) {
      toast.error("Maosh manfiy bo'lishi mumkin emas!");
      return;
    }
    onSave(d);
  };
  return <form onSubmit={handleSubmit}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <div style={grid2}>
      <div style={span2}><Inp label="F.I.O" value={d.full_name} onChange={u('full_name')} required /></div>
      <Inp label="Email" type="email" value={d.email} onChange={u('email')} required />
      <Inp label={init?'Yangi parol (ixtiyoriy)':'Parol'} type="password" value={d.password} onChange={u('password')} required={!init} />
      <Sel label="Lavozim" value={d.role} onChange={u('role')} opts={ROLES} />
      <Sel label="Bo'lim" value={d.department} onChange={u('department')} opts={DEPTS} />
      <Inp label="Telefon" value={d.phone} onChange={u('phone')} placeholder="+998 90 000 00 00" />
      <Inp label="Maosh (so'm)" type="number" value={d.salary} onChange={u('salary')} />
      <Inp label="Ishga kirgan sana" type="date" value={d.hire_date?.split('T')[0]||''} onChange={u('hire_date')} />
      <div style={span2}><Sel label="Holat" value={d.status} onChange={u('status')} opts={STATUSES} /></div>
    </div>
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10 }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

const DeptForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ name:'',manager_name:'',budget:'',description:'',location:'',status:'Faol',...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    if (d.budget < 0) {
      toast.error("Byudjet manfiy bo'lishi mumkin emas!");
      return;
    }
    onSave(d);
  };
  return <form onSubmit={handleSubmit}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <Inp label="Bo'lim nomi" value={d.name} onChange={u('name')} required />
    <div style={grid2}>
      <Inp label="Rahbar" value={d.manager_name} onChange={u('manager_name')} />
      <Inp label="Byudjet (so'm)" type="number" value={d.budget} onChange={u('budget')} />
      <Inp label="Joylashuv" value={d.location} onChange={u('location')} placeholder="A-blok, 2-qavat" />
      <Sel label="Holat" value={d.status} onChange={u('status')} opts={['Faol','Nofaol']} />
    </div>
    <TA label="Tavsif" value={d.description} onChange={u('description')} rows={2} />
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

const ProductForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ name:'',category:'',quantity:'0',min_quantity:'5',unit:'dona',price:'',supplier:'',location:'',notes:'',...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    if (d.quantity < 0) {
      toast.error("Miqdor manfiy bo'lishi mumkin emas!");
      return;
    }
    if (d.min_quantity < 0) {
      toast.error("Minimal zaxira manfiy bo'lishi mumkin emas!");
      return;
    }
    if (d.price < 0) {
      toast.error("Narx manfiy bo'lishi mumkin emas!");
      return;
    }
    onSave(d);
  };
  return <form onSubmit={handleSubmit}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <Inp label="Mahsulot nomi" value={d.name} onChange={u('name')} required />
    <div style={grid2}>
      <Inp label="Kategoriya" value={d.category} onChange={u('category')} placeholder="Elektronika, Mebel..." />
      <Inp label="Yetkazib beruvchi" value={d.supplier} onChange={u('supplier')} />
      <Inp label="Miqdor" type="number" value={d.quantity} onChange={u('quantity')} />
      <Inp label="Minimum zaxira" type="number" value={d.min_quantity} onChange={u('min_quantity')} />
      <Inp label="Narx (so'm)" type="number" value={d.price} onChange={u('price')} />
      <Sel label="O'lchov" value={d.unit} onChange={u('unit')} opts={['dona','kg','litr','metr','paket','quti','juft','to\'plam']} />
      <div style={span2}><Inp label="Joylashuv" value={d.location} onChange={u('location')} placeholder="IT xonasi, Ombor..." /></div>
    </div>
    <TA label="Izoh" value={d.notes} onChange={u('notes')} rows={2} />
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

const FinanceForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ type:'Kirim',category:'',amount:'',description:'',department:'Boshqaruv',payment_method:'Bank o\'tkazmasi',reference_no:'',date:new Date().toISOString().split('T')[0],status:'Tasdiqlangan',...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    if (d.amount <= 0) {
      toast.error("Summa noldan katta bo'lishi kerak!");
      return;
    }
    onSave(d);
  };
  return <form onSubmit={handleSubmit}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <div style={grid2}>
      <Sel label="Tur" value={d.type} onChange={u('type')} opts={['Kirim','Chiqim']} required />
      <Inp label="Kategoriya" value={d.category} onChange={u('category')} placeholder="Maosh, Xizmat, Ijara..." />
      <Inp label="Summa (so'm)" type="number" value={d.amount} onChange={u('amount')} required />
      <Sel label="To'lov usuli" value={d.payment_method} onChange={u('payment_method')} opts={['Bank o\'tkazmasi','Naqd','Plastik karta','Kriptovalyuta']} />
      <Sel label="Bo'lim" value={d.department} onChange={u('department')} opts={DEPTS} />
      <Inp label="Havola raqami" value={d.reference_no} onChange={u('reference_no')} placeholder="INV-2024-001" />
      <Inp label="Sana" type="date" value={d.date} onChange={u('date')} />
      <Sel label="Holat" value={d.status} onChange={u('status')} opts={FIN_ST} />
      <div style={span2}><TA label="Tavsif" value={d.description} onChange={u('description')} rows={2} /></div>
    </div>
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

const TaskForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ title:'',description:'',assigned_to:'',assigned_by:'',department:'Boshqaruv',priority:'Oddiy',status:'Yangi',progress:0,due_date:'',...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  return <form onSubmit={e=>{e.preventDefault();onSave(d);}}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <Inp label="Vazifa nomi" value={d.title} onChange={u('title')} required />
    <TA label="Tavsif" value={d.description} onChange={u('description')} rows={2} />
    <div style={grid2}>
      <Inp label="Ijrochi" value={d.assigned_to} onChange={u('assigned_to')} />
      <Inp label="Topshiruvchi" value={d.assigned_by} onChange={u('assigned_by')} />
      <Sel label="Bo'lim" value={d.department} onChange={u('department')} opts={DEPTS} />
      <Sel label="Muhimlik" value={d.priority} onChange={u('priority')} opts={PRIOS} />
      <Sel label="Holat" value={d.status} onChange={u('status')} opts={TASK_ST} />
      <Inp label="Muddat" type="date" value={d.due_date?.split('T')[0]||''} onChange={u('due_date')} />
      <div style={span2}>
        <FL label={`Bajarilish: ${d.progress}%`}><input type="range" min="0" max="100" value={d.progress} onChange={u('progress')} style={{ width:'100%', accentColor:'#2563eb', cursor:'pointer' }} /></FL>
      </div>
    </div>
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

const ClientForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ company_name:'',contact_person:'',email:'',phone:'',address:'',industry:'',status:'Faol',contract_value:'',source:'',notes:'',last_contact:'',...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    if (d.contract_value < 0) {
      toast.error("Shartnoma qiymati manfiy bo'lishi mumkin emas!");
      return;
    }
    onSave(d);
  };
  return <form onSubmit={handleSubmit}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <Inp label="Kompaniya nomi" value={d.company_name} onChange={u('company_name')} required />
    <div style={grid2}>
      <Inp label="Mas'ul shaxs" value={d.contact_person} onChange={u('contact_person')} />
      <Inp label="Email" type="email" value={d.email} onChange={u('email')} />
      <Inp label="Telefon" value={d.phone} onChange={u('phone')} />
      <Inp label="Soha" value={d.industry} onChange={u('industry')} placeholder="IT, Savdo, Qishloq xo'jaligi..." />
      <Inp label="Shartnoma qiymati (so'm)" type="number" value={d.contract_value} onChange={u('contract_value')} />
      <Sel label="Manba" value={d.source||''} onChange={u('source')} opts={['','Referral','Veb-sayt','Ko\'rgazma','Sovuq murojaat','Tavsiya','Ijtimoiy tarmoq']} />
      <Sel label="Holat" value={d.status} onChange={u('status')} opts={['Faol','Kutilmoqda','Nofaol']} />
      <Inp label="Oxirgi aloqa" type="date" value={d.last_contact?.split('T')[0]||''} onChange={u('last_contact')} />
      <div style={span2}><Inp label="Manzil" value={d.address} onChange={u('address')} /></div>
      <div style={span2}><TA label="Izoh" value={d.notes} onChange={u('notes')} rows={2} /></div>
    </div>
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

const ContractForm = ({ init, onSave, saving }) => {
  const [d,setD] = useState({ title:'',client_name:'',contract_no:'',amount:'',paid_amount:'',start_date:'',end_date:'',status:'Kutilmoqda',type:'Xizmat',description:'',responsible:'',...init });
  const u = k => e => setD(p=>({...p,[k]:e.target.value}));
  const pct = d.amount>0 ? Math.round((d.paid_amount/d.amount)*100) : 0;
  
  const [clients, setClients] = useState([]);
  useEffect(() => {
    api.get('/api/clients').then(r => setClients(r.data || [])).catch(() => {});
  }, []);

  const handleSubmit = e => {
    e.preventDefault();
    if (d.amount < 0) {
      toast.error("Shartnoma summasi manfiy bo'lishi mumkin emas!");
      return;
    }
    if (d.paid_amount < 0) {
      toast.error("To'langan summa manfiy bo'lishi mumkin emas!");
      return;
    }
    if (parseFloat(d.paid_amount || 0) > parseFloat(d.amount || 0)) {
      toast.error("To'langan summa shartnoma summasidan oshishi mumkin emas!");
      return;
    }
    onSave(d);
  };

  return <form onSubmit={handleSubmit}><div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
    <Inp label="Shartnoma nomi" value={d.title} onChange={u('title')} required />
    <div style={grid2}>
      <Sel label="Mijoz nomi" value={d.client_name} onChange={u('client_name')} opts={['', ...clients.map(c => c.company_name)]} required />
      <Inp label="Shartnoma raqami" value={d.contract_no} onChange={u('contract_no')} placeholder="SHN-2024-001" />
      <Inp label="Umumiy summa (so'm)" type="number" value={d.amount} onChange={u('amount')} />
      <Inp label="To'langan summa (so'm)" type="number" value={d.paid_amount} onChange={u('paid_amount')} />
      {d.amount>0&&<div style={span2}><FL label={`To'lov holati: ${pct}%`}><ProgBar value={pct} color={pct>=100?'#059669':'#2563eb'} /></FL></div>}
      <Inp label="Boshlanish sanasi" type="date" value={d.start_date?.split('T')[0]||''} onChange={u('start_date')} />
      <Inp label="Tugash sanasi" type="date" value={d.end_date?.split('T')[0]||''} onChange={u('end_date')} />
      <Sel label="Tur" value={d.type||''} onChange={u('type')} opts={['Xizmat','Yetkazib berish','Konsalting','Litsenziya','Boshqa']} />
      <Sel label="Holat" value={d.status} onChange={u('status')} opts={CONTRACT_ST} />
      <div style={span2}><Inp label="Mas'ul xodim" value={d.responsible} onChange={u('responsible')} /></div>
      <div style={span2}><TA label="Tavsif" value={d.description} onChange={u('description')} rows={2} /></div>
    </div>
  </div>
  <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
    <Btn type="submit" disabled={saving} icon={IC.check}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
  </div></form>;
};

/* ─── CLIENT CONTRACTS RELATIONAL COMPONENT ───────────────────────────── */
const ClientContracts = ({ clientName }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/contracts').then(r => {
      const filtered = (r.data || []).filter(c => c.client_name === clientName);
      setContracts(filtered);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [clientName]);

  if (loading) return <div style={{ marginTop:16 }}><Skel h={40} /><Skel h={40} style={{marginTop:8}}/></div>;
  if (contracts.length === 0) return (
    <div style={{ marginTop:16, gridColumn:'1/-1', padding:'12px', background:'var(--bg)', borderRadius:10, fontSize:12.5, color:'var(--text-3)', textAlign:'center' }}>
      Ushbu mijoz bilan shartnomalar imzolanmagan.
    </div>
  );

  return (
    <div style={{ marginTop:16, gridColumn:'1/-1', borderTop:'1.5px dashed var(--border)', paddingTop:16 }}>
      <h4 style={{ fontSize:12.5, fontWeight:800, textTransform:'uppercase', color:'var(--text-2)', marginBottom:10, letterSpacing:'.05em' }}>Mijoz Shartnomalari ({contracts.length} ta)</h4>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {contracts.map(c => {
          const pct = c.amount > 0 ? Math.round((c.paid_amount / c.amount) * 100) : 0;
          return (
            <div key={c.id} style={{ padding:'10px 12px', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{c.title}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>№ {c.contract_no} · {fmt(c.amount)}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0, marginLeft:12 }}>
                <Badge value={c.status} />
                <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-2)' }}>{pct}% To'landi</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── KANBAN BOARD COMPONENT ─────────────────────────────────────────────── */
const KanbanBoard = ({ rows, onEdit, onDelete, onView, onStatusChange }) => {
  const columns = ['Yangi', 'Jarayonda', 'Bajarildi', 'Bekor qilindi'];
  const prioColors = { 'Yuqori': '#fee2e2', 'Oddiy': '#dbeafe', 'Past': '#dcfce7' };
  const prioText = { 'Yuqori': '#991b1b', 'Oddiy': '#1e40af', 'Past': '#166534' };
  const [draggedOver, setDraggedOver] = useState(null);

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDraggedOver(null);
    const taskId = e.dataTransfer.getData('taskId');
    const task = rows.find(r => r.id === taskId);
    if (task && task.status !== targetStatus) {
      onStatusChange(task, targetStatus);
    }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, padding:16, overflowX:'auto', background:'var(--bg)' }}>
      {columns.map(col => {
        const colRows = rows.filter(r => (r.status || 'Yangi') === col);
        const isOver = draggedOver === col;
        return (
          <div key={col}
            onDragOver={(e) => { e.preventDefault(); if (draggedOver !== col) setDraggedOver(col); }}
            onDragLeave={() => { if (draggedOver === col) setDraggedOver(null); }}
            onDrop={(e) => handleDrop(e, col)}
            style={{
              background: isOver ? 'var(--accent-muted)' : 'var(--bg-card)',
              borderRadius: 12,
              border: isOver ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 220,
              minHeight: 400,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isOver ? 'var(--shadow-md)' : 'none'
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>
              <span style={{ fontWeight:800, fontSize:13, color:'var(--text-1)' }}>{col}</span>
              <span style={{ fontSize:11, fontWeight:700, background:'var(--border)', padding:'2px 7px', borderRadius:99, color:'var(--text-2)' }}>{colRows.length}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, overflowY:'auto', maxHeight:'65vh' }}>
              {colRows.length === 0 ? (
                <div style={{ fontSize:12, color:'var(--text-3)', textAlign:'center', padding:'20px 0', border:'1px dashed var(--border)', borderRadius:10 }}>Loyiha tashlang...</div>
              ) : colRows.map(r => (
                <div key={r.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, r)}
                  style={{
                    background: 'var(--bg)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: 'grab',
                    transition: 'transform 0.1s, box-shadow 0.1s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  onDragEnd={e => { e.currentTarget.style.cursor = 'grab'; }}
                  onMouseDown={e => { e.currentTarget.style.cursor = 'grabbing'; }}
                  onMouseUp={e => { e.currentTarget.style.cursor = 'grab'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:prioColors[r.priority]||'#f1f5f9', color:prioText[r.priority]||'#475569' }}>{r.priority}</span>
                    <div style={{ display:'flex', gap:2 }}>
                      <button onClick={()=>onView(r)} style={{ border:'none', background:'none', cursor:'pointer', padding:3, color:'var(--text-3)' }} title="Ko'rish"><Ic d={IC.eye} size={11} /></button>
                      <button onClick={()=>onEdit(r)} style={{ border:'none', background:'none', cursor:'pointer', padding:3, color:'var(--text-3)' }} title="Tahrirlash"><Ic d={IC.edit} size={11} /></button>
                      <button onClick={()=>onDelete(r.id)} style={{ border:'none', background:'none', cursor:'pointer', padding:3, color:'var(--text-3)' }} title="O'chirish"><Ic d={IC.trash} size={11} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', lineHeight:1.35 }}>{r.title}</div>
                  {r.description && <div style={{ fontSize:11.5, color:'var(--text-2)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{r.description}</div>}
                  
                  {r.assigned_to && (
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Av name={r.assigned_to} size={20} />
                      <span style={{ fontSize:11.5, color:'var(--text-2)', fontWeight:500 }}>{r.assigned_to}</span>
                    </div>
                  )}

                  {r.progress > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-3)', fontWeight:700 }}>
                        <span>Bajarilish</span>
                        <span>{r.progress}%</span>
                      </div>
                      <ProgBar value={r.progress} />
                    </div>
                  )}

                  {r.due_date && (
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:'var(--text-3)' }}>
                      <Ic d={IC.calendar} size={10} stroke="var(--text-3)" />
                      <span>{dateStr(r.due_date)}</span>
                    </div>
                  )}

                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, marginTop:4, display:'flex', gap:4, justifyContent:'flex-end' }}>
                    {columns.filter(c => c !== col).map(c => (
                      <button key={c} onClick={()=>onStatusChange(r, c)}
                        style={{ border:'none', background:'var(--border)', borderRadius:4, padding:'2px 6px', fontSize:9.5, fontWeight:700, color:'var(--text-2)', cursor:'pointer' }}
                        title={`Holatni "${c}" ga o'zgartirish`}>
                        {c === 'Yangi' ? 'Yangi' : c === 'Jarayonda' ? 'Jara.' : c === 'Bajarildi' ? 'Bajar.' : 'Bekor'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── CRUD PAGE ──────────────────────────────────────────────────────────── */
const CrudPage = ({ title, subtitle, endpoint, cols, FormComp, searchKeys=[], pdfTitle, filters }) => {
  const { rows, loading, saving, save, remove, fetch } = useCrud(endpoint);
  const [search, setSearch] = useState('');
  const [filterVals, setFilterVals] = useState({});
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'

  const filtered = useMemo(()=>{
    let r = rows;
    if(search) r = r.filter(row => searchKeys.some(k=>(row[k]||'').toLowerCase().includes(search.toLowerCase())));
    Object.entries(filterVals).forEach(([k,v])=>{ if(v) r = r.filter(row=>(row[k]||'')===v); });
    return r;
  },[rows,search,filterVals,searchKeys]);

  const exportPDF = () => {
    const doc = new jsPDF('l','mm','a4');
    
    // Draw decorative blue block header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 24, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text("BIZCORE ENTERPRISE PLATFORM", 14, 11);
    
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.setTextColor(219, 234, 254);
    doc.text("Ko'p modulli korxona boshqaruv tizimi va hisoboti", 14, 17);
    
    let summaryText = `Jami: ${filtered.length} ta yozuv`;
    if (endpoint === 'finance') {
      const inc = filtered.filter(x=>x.type==='Kirim').reduce((acc,curr)=>acc+parseFloat(curr.amount||0), 0);
      const exp = filtered.filter(x=>x.type==='Chiqim').reduce((acc,curr)=>acc+parseFloat(curr.amount||0), 0);
      summaryText += ` | Jami Daromad: ${new Intl.NumberFormat('uz-UZ').format(inc)} so'm | Jami Xarajat: ${new Intl.NumberFormat('uz-UZ').format(exp)} so'm | Sof Balans: ${new Intl.NumberFormat('uz-UZ').format(inc-exp)} so'm`;
    } else if (endpoint === 'products') {
      const totalVal = filtered.reduce((acc,curr)=>acc+parseFloat(curr.total_value||0), 0);
      const totalQty = filtered.reduce((acc,curr)=>acc+parseInt(curr.quantity||0), 0);
      summaryText += ` | Jami miqdor: ${totalQty} dona | Ombordagi jami qiymat: ${new Intl.NumberFormat('uz-UZ').format(totalVal)} so'm`;
    } else if (endpoint === 'contracts') {
      const totalAmt = filtered.reduce((acc,curr)=>acc+parseFloat(curr.amount||0), 0);
      const totalPaid = filtered.reduce((acc,curr)=>acc+parseFloat(curr.paid_amount||0), 0);
      summaryText += ` | Shartnomalar jami qiymati: ${new Intl.NumberFormat('uz-UZ').format(totalAmt)} so'm | To'langan summa: ${new Intl.NumberFormat('uz-UZ').format(totalPaid)} so'm`;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text(pdfTitle||title, 14, 33);
    
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
    doc.text(summaryText, 14, 39);
    doc.text(`Chop etilgan sana: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}`, 200, 39);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 283, 42);

    const pdfCols = cols.filter(c=>c.key&&!c.noExport);
    autoTable(doc,{
      head:[pdfCols.map(c=>c.label)],
      body:filtered.map(r=>pdfCols.map(c=>{
        const v=r[c.key];
        if (c.key === 'amount' || c.key === 'price' || c.key === 'total_value' || c.key === 'salary') {
          return new Intl.NumberFormat('uz-UZ').format(v || 0) + " so'm";
        }
        return v!=null?String(v):'—';
      })),
      startY:46, styles:{fontSize:8.5,cellPadding:3.5},
      headStyles:{fillColor:[37,99,235],textColor:255,fontStyle:'bold'},
      alternateRowStyles:{fillColor:[245,248,255]},
      margin:{left:14,right:14},
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("BizCore ERP System - Korxona boshqaruvi hisoboti", 14, 202);
        doc.text(`Sahifa ${data.pageNumber}`, 270, 202);
      }
    });
    doc.save(`${pdfTitle||title} - ${new Date().toLocaleDateString('uz-UZ')}.pdf`);
    toast.success('PDF muvaffaqiyatli yaratildi!');
  };

  const fullCols = [...cols, {
    label:'Amallar', noExport:true,
    render:(_,row)=>(
      <div style={{ display:'flex', gap:5 }}>
        <button onClick={()=>setViewRow(row)} title="Ko'rish"
          style={{ padding:'5px 7px', border:'1.5px solid var(--border)', borderRadius:7, background:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center', transition:'all .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#059669';e.currentTarget.style.color='#059669';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';}}>
          <Ic d={IC.eye} size={13} />
        </button>
        <button onClick={()=>setModal({mode:'edit',data:row})} title="Tahrirlash"
          style={{ padding:'5px 7px', border:'1.5px solid var(--border)', borderRadius:7, background:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center', transition:'all .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.color='#2563eb';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';}}>
          <Ic d={IC.edit} size={13} />
        </button>
        <button onClick={()=>setConfirm(row.id)} title="O'chirish"
          style={{ padding:'5px 7px', border:'1.5px solid var(--border)', borderRadius:7, background:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center', transition:'all .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#dc2626';e.currentTarget.style.color='#dc2626';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';}}>
          <Ic d={IC.trash} size={13} />
        </button>
      </div>
    )
  }];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-.3px', marginBottom:4 }}>{title}</h1>
          {subtitle&&<p style={{ fontSize:13, color:'var(--text-2)' }}>{subtitle}</p>}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }}><Ic d={IC.search} size={14} /></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Izlash..." style={{ ...base, paddingLeft:32, width:200, height:36 }} onFocus={focusEvt} onBlur={blurEvt} />
          </div>
          {filters?.map(f=>(
            <select key={f.key} value={filterVals[f.key]||''} onChange={e=>setFilterVals(p=>({...p,[f.key]:e.target.value}))}
              style={{ ...base, width:'auto', height:36, paddingLeft:10, paddingRight:28 }} onFocus={focusEvt} onBlur={blurEvt}>
              <option value="">{f.label}</option>
              {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {endpoint === 'tasks' && (
            <div style={{ display:'flex', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:10, padding:2, gap:2 }}>
              <button onClick={()=>setViewMode('table')} style={{ padding:'5px 12px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', background:viewMode==='table'?'var(--bg-card)':'transparent', color:viewMode==='table'?'#2563eb':'var(--text-3)', transition:'all .15s' }}>Jadval</button>
              <button onClick={()=>setViewMode('kanban')} style={{ padding:'5px 12px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', background:viewMode==='kanban'?'var(--bg-card)':'transparent', color:viewMode==='kanban'?'#2563eb':'var(--text-3)', transition:'all .15s' }}>Kanban</button>
            </div>
          )}
          <Btn variant="secondary" size="sm" icon={IC.refresh} onClick={()=>fetch()}>Yangilash</Btn>
          <Btn variant="secondary" size="sm" icon={IC.pdf} onClick={exportPDF}>PDF</Btn>
          <Btn size="sm" icon={IC.plus} onClick={()=>setModal({mode:'add'})}>Yangi qo'shish</Btn>
        </div>
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
        {viewMode === 'table' ? (
          <DataTable cols={fullCols} rows={filtered} loading={loading} />
        ) : (
          <KanbanBoard rows={filtered} onEdit={row=>setModal({mode:'edit',data:row})} onDelete={id=>setConfirm(id)} onView={row=>setViewRow(row)} onStatusChange={async (row, newStatus)=>{
            const updated = { ...row, status: newStatus };
            await save(updated, row.id);
          }} />
        )}
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg)' }}>
          <span style={{ fontSize:12, color:'var(--text-3)' }}>Jami <strong style={{ color:'var(--text-1)' }}>{filtered.length}</strong> ta yozuv{search&&` · "${search}" filtri`}</span>
          <span style={{ fontSize:12, color:'var(--text-3)' }}>Jami bazada: {rows.length} ta</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.mode==='edit'?'Tahrirlash':'Yangi yozuv qo\'shish'} maxW={600}>
        <FormComp init={modal?.data} saving={saving} onSave={async data=>{ const ok=await save(data,modal?.data?.id); if(ok) setModal(null); }} />
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewRow} onClose={()=>setViewRow(null)} title="Batafsil ma'lumot" maxW={520}>
        {viewRow&&<div style={{ padding:'18px 22px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 24px' }}>
            {cols.filter(c=>c.key).map(c=>(
              <div key={c.key} style={{ paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{c.label}</div>
                <div style={{ fontSize:14, color:'var(--text-1)', fontWeight:500 }}>{c.render?c.render(viewRow[c.key],viewRow):(viewRow[c.key]??'—')}</div>
              </div>
            ))}
            {endpoint === 'clients' && <ClientContracts clientName={viewRow.company_name} />}
          </div>
          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end', gap:8 }}>
            <Btn variant="secondary" onClick={()=>setViewRow(null)}>Yopish</Btn>
            <Btn icon={IC.edit} onClick={()=>{ setModal({mode:'edit',data:viewRow}); setViewRow(null); }}>Tahrirlash</Btn>
          </div>
        </div>}
      </Modal>

      <ConfirmDlg open={!!confirm} onClose={()=>setConfirm(null)} onConfirm={()=>remove(confirm)} msg="Ushbu yozuvni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi." />
    </div>
  );
};


/* ─── PAGES ──────────────────────────────────────────────────────────────── */
const UsersPage = () => <CrudPage title="Xodimlar" subtitle="HR — Kadrlar boshqaruvi moduli" endpoint="users" FormComp={UserForm} searchKeys={['full_name','email','role','department']} pdfTitle="Xodimlar Ro'yxati"
  filters={[{key:'department',label:'Bo\'lim',opts:DEPTS},{key:'status',label:'Holat',opts:STATUSES}]}
  cols={[
    { key:'full_name', label:'Xodim', render:(v,r)=><div style={{ display:'flex', alignItems:'center', gap:9 }}><Av name={v} size={32}/><div><div style={{ fontWeight:700,fontSize:13.5 }}>{v}</div><div style={{ fontSize:11,color:'var(--text-3)' }}>{r.email}</div></div></div> },
    { key:'role', label:'Lavozim' },
    { key:'department', label:'Bo\'lim', render:v=><span style={{ background:'var(--accent-muted)',color:'var(--accent)',padding:'3px 9px',borderRadius:6,fontSize:12,fontWeight:600 }}>{v}</span> },
    { key:'phone', label:'Telefon' },
    { key:'salary', label:'Maosh', render:v=><span style={{ fontWeight:700,color:'#059669',fontVariantNumeric:'tabular-nums',fontSize:13 }}>{fmt(v)}</span> },
    { key:'hire_date', label:'Qabul sanasi', render:v=>dateStr(v) },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
  ]}
/>;

const DeptsPage = () => <CrudPage title="Bo'limlar" subtitle="Tashkilot tuzilmasi va bo'limlar" endpoint="departments" FormComp={DeptForm} searchKeys={['name','manager_name','location']} pdfTitle="Bo'limlar Ro'yxati"
  cols={[
    { key:'name', label:'Bo\'lim', render:v=><span style={{ fontWeight:700 }}>{v}</span> },
    { key:'manager_name', label:'Rahbar', render:v=>v?<div style={{ display:'flex',alignItems:'center',gap:8 }}><Av name={v} size={26}/><span style={{ fontSize:13.5 }}>{v}</span></div>:'—' },
    { key:'budget', label:'Byudjet', render:v=><span style={{ fontWeight:700,color:'#2563eb',fontVariantNumeric:'tabular-nums',fontSize:13 }}>{fmt(v)}</span> },
    { key:'employee_count', label:'Xodimlar', render:v=><span style={{ fontWeight:700 }}>{v||0} ta</span> },
    { key:'location', label:'Joylashuv' },
    { key:'description', label:'Tavsif', render:v=><span style={{ color:'var(--text-2)',fontSize:12,maxWidth:200,display:'block',overflow:'hidden',textOverflow:'ellipsis' }}>{v||'—'}</span> },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
  ]}
/>;

const ProductsPage = () => <CrudPage title="Inventar va Omborxona" subtitle="Mahsulotlar zaxirasi va inventar boshqaruvi" endpoint="products" FormComp={ProductForm} searchKeys={['name','category','supplier','location']} pdfTitle="Inventar Ro'yxati"
  filters={[{key:'category',label:'Kategoriya',opts:['Elektronika','Mebel','Sarflovlar','Jihozlar','Aksesuar']},{key:'status',label:'Holat',opts:['Mavjud','Kam qoldi','Tugagan']}]}
  cols={[
    { key:'name', label:'Mahsulot', render:v=><span style={{ fontWeight:600 }}>{v}</span> },
    { key:'category', label:'Kategoriya', render:v=><span style={{ background:'var(--accent-muted)',color:'var(--accent)',padding:'3px 9px',borderRadius:6,fontSize:12,fontWeight:600 }}>{v||'—'}</span> },
    { key:'quantity', label:'Miqdor', render:(v,r)=><span style={{ fontWeight:700,color:v<=r.min_quantity?'#dc2626':'var(--text-1)',fontVariantNumeric:'tabular-nums' }}>{v} <span style={{ fontWeight:400,color:'var(--text-3)' }}>{r.unit}</span></span> },
    { key:'price', label:'Narx', render:v=><span style={{ fontVariantNumeric:'tabular-nums',fontSize:13 }}>{fmt(v)}</span> },
    { key:'total_value', label:'Umumiy qiymat', render:v=><span style={{ fontWeight:700,color:'#7c3aed',fontVariantNumeric:'tabular-nums',fontSize:13 }}>{fmt(v)}</span> },
    { key:'supplier', label:'Yetkazuvchi' },
    { key:'location', label:'Joylashuv' },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
  ]}
/>;

const FinancePage = () => <CrudPage title="Moliya va Hisobotlar" subtitle="Daromad, xarajat va moliyaviy tranzaksiyalar" endpoint="finance" FormComp={FinanceForm} searchKeys={['type','category','description','department','reference_no']} pdfTitle="Moliyaviy Hisobot"
  filters={[{key:'type',label:'Tur',opts:['Kirim','Chiqim']},{key:'department',label:'Bo\'lim',opts:DEPTS},{key:'status',label:'Holat',opts:FIN_ST}]}
  cols={[
    { key:'type', label:'Tur', render:v=><span style={{ padding:'3px 11px',borderRadius:99,fontSize:12,fontWeight:700,background:v==='Kirim'?'#dcfce7':'#fee2e2',color:v==='Kirim'?'#166534':'#991b1b' }}>{v}</span> },
    { key:'category', label:'Kategoriya' },
    { key:'amount', label:'Summa', render:(v,r)=><span style={{ fontWeight:800,color:r.type==='Kirim'?'#059669':'#dc2626',fontVariantNumeric:'tabular-nums',fontSize:13 }}>{r.type==='Kirim'?'+':'−'}{fmt(v)}</span> },
    { key:'payment_method', label:'To\'lov usuli' },
    { key:'reference_no', label:'Havola' },
    { key:'department', label:'Bo\'lim' },
    { key:'date', label:'Sana', render:v=><span style={{ fontSize:12,color:'var(--text-2)' }}>{dateStr(v)}</span> },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
  ]}
/>;

const TasksPage = () => <CrudPage title="Vazifalar" subtitle="Topshiriqlar, muddatlar va bajarilish nazorati" endpoint="tasks" FormComp={TaskForm} searchKeys={['title','assigned_to','department']} pdfTitle="Vazifalar Ro'yxati"
  filters={[{key:'priority',label:'Muhimlik',opts:PRIOS},{key:'status',label:'Holat',opts:TASK_ST},{key:'department',label:'Bo\'lim',opts:DEPTS}]}
  cols={[
    { key:'title', label:'Vazifa', render:v=><span style={{ fontWeight:600,maxWidth:220,display:'block',overflow:'hidden',textOverflow:'ellipsis' }}>{v}</span> },
    { key:'assigned_to', label:'Ijrochi', render:v=>v?<div style={{ display:'flex',alignItems:'center',gap:7 }}><Av name={v} size={26}/><span style={{ fontSize:13 }}>{v}</span></div>:'—' },
    { key:'department', label:'Bo\'lim' },
    { key:'priority', label:'Muhimlik', render:v=><PriBadge v={v}/> },
    { key:'progress', label:'Bajarilish', render:v=><div style={{ display:'flex',alignItems:'center',gap:8,minWidth:100 }}><ProgBar value={v}/><span style={{ fontSize:12,fontWeight:700,color:'var(--text-2)',whiteSpace:'nowrap' }}>{v}%</span></div> },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
    { key:'due_date', label:'Muddat', render:v=>{ const isPast=v&&new Date(v)<new Date()&&v; return <span style={{ fontSize:12,color:isPast?'#dc2626':'var(--text-2)',fontWeight:isPast?700:400 }}>{dateStr(v)}</span>; } },
  ]}
/>;

const ClientsPage = () => <CrudPage title="Mijozlar (CRM)" subtitle="Mijozlar bazasi va munosabatlar boshqaruvi" endpoint="clients" FormComp={ClientForm} searchKeys={['company_name','contact_person','email','industry']} pdfTitle="Mijozlar Ro'yxati"
  filters={[{key:'status',label:'Holat',opts:['Faol','Kutilmoqda','Nofaol']},{key:'industry',label:'Soha',opts:['IT','Savdo','Ishlab chiqarish','Turizm','Qishloq xo\'jaligi']}]}
  cols={[
    { key:'company_name', label:'Kompaniya', render:(v,r)=><div style={{ display:'flex',alignItems:'center',gap:9 }}><Av name={v} size={32}/><div><div style={{ fontWeight:700 }}>{v}</div><div style={{ fontSize:11,color:'var(--text-3)' }}>{r.contact_person}</div></div></div> },
    { key:'industry', label:'Soha' },
    { key:'email', label:'Email' },
    { key:'phone', label:'Telefon' },
    { key:'contract_value', label:'Qiymat', render:v=><span style={{ fontWeight:700,color:'#2563eb',fontVariantNumeric:'tabular-nums',fontSize:13 }}>{fmt(v)}</span> },
    { key:'last_contact', label:'Oxirgi aloqa', render:v=><span style={{ fontSize:12,color:'var(--text-2)' }}>{dateStr(v)}</span> },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
  ]}
/>;

const ContractsPage = () => <CrudPage title="Shartnomalar" subtitle="Faol va kutilayotgan biznes shartnomalar" endpoint="contracts" FormComp={ContractForm} searchKeys={['title','client_name','contract_no','responsible']} pdfTitle="Shartnomalar Ro'yxati"
  filters={[{key:'status',label:'Holat',opts:CONTRACT_ST},{key:'type',label:'Tur',opts:['Xizmat','Yetkazib berish','Konsalting','Litsenziya']}]}
  cols={[
    { key:'title', label:'Shartnoma', render:(v,r)=><div><div style={{ fontWeight:700 }}>{v}</div><div style={{ fontSize:11,color:'var(--text-3)' }}>{r.contract_no}</div></div> },
    { key:'client_name', label:'Mijoz' },
    { key:'amount', label:'Umumiy summa', render:v=><span style={{ fontWeight:700,color:'#059669',fontVariantNumeric:'tabular-nums',fontSize:13 }}>{fmt(v)}</span> },
    { key:'paid_amount', label:'To\'langan', render:(v,r)=>{ const pct=r.amount>0?Math.round((v/r.amount)*100):0; return <div><div style={{ fontSize:13,fontWeight:700 }}>{fmt(v)}</div><ProgBar value={pct} color={pct>=100?'#059669':'#2563eb'}/></div>; } },
    { key:'end_date', label:'Muddat', render:v=><span style={{ fontSize:12,color:'var(--text-2)' }}>{dateStr(v)}</span> },
    { key:'responsible', label:'Mas\'ul' },
    { key:'status', label:'Holat', render:v=><Badge value={v}/> },
  ]}
/>;

/* ─── TIZIM JURNALI (AUDIT TRAIL) ────────────────────────────────────────── */
const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/activity');
      setLogs(r.data || []);
    } catch {
      toast.error('Audit jurnallarini yuklashda xato');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = (log.description || '').toLowerCase().includes(search.toLowerCase()) ||
                            (log.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (log.module || '').toLowerCase().includes(search.toLowerCase());
      const matchesAction = !filterAction || log.action === filterAction;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, filterAction]);

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text("BIZCORE ENTERPRISE PLATFORM", 14, 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.setTextColor(219, 234, 254);
    doc.text("Tizim audit va faoliyat jurnali hisoboti", 14, 17);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text("Tizim Audit Jurnali", 14, 33);
    
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.text(`Jami yozuvlar: ${filtered.length} ta`, 14, 39);
    doc.text(`Chop etilgan sana: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}`, 200, 39);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 283, 42);

    autoTable(doc, {
      head: [['Harakat', 'Modul', 'Tavsif', 'Foydalanuvchi', 'Sana']],
      body: filtered.map(log => [
        log.action?.toUpperCase(),
        log.module,
        log.description,
        log.user_name || '—',
        dateStr(log.created_at) + ' ' + new Date(log.created_at).toLocaleTimeString('uz-UZ')
      ]),
      startY: 46, styles: { fontSize: 8.5, cellPadding: 3.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("BizCore ERP System - Audit Trail Report", 14, 202);
        doc.text(`Sahifa ${data.pageNumber}`, 270, 202);
      }
    });

    doc.save(`Tizim_Jurnali_${new Date().toLocaleDateString('uz-UZ')}.pdf`);
    toast.success('PDF muvaffaqiyatli yuklab olindi!');
  };

  const actionColors = {
    'login': '#2563eb',
    'create': '#059669',
    'update': '#d97706',
    'delete': '#dc2626'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 4 }}>Tizim Audit Jurnali</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Tizimda foydalanuvchilar tomonidan bajarilgan barcha amallar jurnali (Audit Trail)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" icon={IC.refresh} onClick={fetchLogs}>Yangilash</Btn>
          <Btn variant="primary" icon={IC.pdf} onClick={exportPDF}>PDF Eksport</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', background: 'var(--bg-card)', padding: 14, borderRadius: 12, border: '1.5px solid var(--border)' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <input type="text" placeholder="Tavsif, foydalanuvchi yoki modul bo'yicha qidirish..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...base, paddingLeft: 38 }} onFocus={focusEvt} onBlur={blurEvt} />
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
            <Ic d={IC.search} size={15} />
          </div>
        </div>
        <div style={{ width: 180 }}>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={base} onFocus={focusEvt} onBlur={blurEvt}>
            <option value="">Barcha amallar</option>
            <option value="login">Tizimga kirish (login)</option>
            <option value="create">Yaratish (create)</option>
            <option value="update">Yangilash (update)</option>
            <option value="delete">O'chirish (delete)</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Harakat</th>
                <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Modul</th>
                <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Tavsif</th>
                <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Foydalanuvchi</th>
                <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Sana va Vaqt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}><Skel h={16} w="40%" /></td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}><Skel h={16} w="50%" /></td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}><Skel h={16} w="80%" /></td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}><Skel h={16} w="60%" /></td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}><Skel h={16} w="50%" /></td>
                </tr>
              )) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-3)' }}>
                      <Ic d={IC.warn} size={40} stroke="var(--text-3)" />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Audit jurnallari topilmadi</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((log, i) => (
                <tr key={log.id || i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: 13.5 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                      background: `${actionColors[log.action] || '#64748b'}18`,
                      color: actionColors[log.action] || '#64748b',
                      textTransform: 'uppercase'
                    }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13.5, fontWeight: 700 }}>{log.module}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13.5, color: 'var(--text-1)', whiteSpace: 'normal', wordBreak: 'break-word' }}>{log.description}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Av name={log.user_name} size={24} />
                    <span style={{ fontWeight: 500 }}>{log.user_name || 'Tizim'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
                    {dateStr(log.created_at)} {new Date(log.created_at).toLocaleTimeString('uz-UZ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/api/dashboard').then(r=>{ setStats(r.data); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  const hour = new Date().getHours();
  const greet = hour<12?'Xayrli tong':hour<17?'Xayrli kun':'Xayrli kech';

  const kpis = stats ? [
    { label:'Faol Xodimlar', val:`${stats.users?.active||0}/${stats.users?.total||0}`, icon:IC.users, color:'#2563eb', sub:'Jami xodimlar', trend:12, up:true },
    { label:'Daromad', val:fmtK(stats.finance?.income), icon:IC.up, color:'#059669', sub:'Tasdiqlangan', trend:8, up:true },
    { label:'Xarajat', val:fmtK(stats.finance?.expense), icon:IC.down, color:'#d97706', sub:'Tasdiqlangan', trend:3, up:false },
    { label:'Sof Foyda', val:fmtK(stats.finance?.profit), icon:IC.dollar, color:'#7c3aed', sub:`Marj: ${stats.finance?.margin||0}%`, trend:15, up:true },
    { label:'Bo\'limlar', val:stats.departments||0, icon:IC.building, color:'#0891b2', sub:'Faol bo\'limlar' },
    { label:'Inventar', val:`${stats.products?.total||0} ta`, icon:IC.box, color:'#d97706', sub:`${stats.products?.low||0} ta kam qoldi` },
    { label:'Mijozlar', val:`${stats.clients?.active||0}/${stats.clients?.total||0}`, icon:IC.handshake, color:'#db2777', sub:'Faol/Jami' },
    { label:'Shartnomalar', val:fmt(stats.contracts?.value), icon:IC.file, color:'#059669', sub:`${stats.contracts?.total||0} ta faol` },
  ] : Array(8).fill({});

  const taskData = stats ? Object.entries(stats.tasks||{}).map(([k,v])=>({name:k,value:v})) : [];
  const chartData = stats?.monthlyFinance||[];

  const actLog = { 'login':'#2563eb', 'create':'#059669', 'update':'#d97706', 'delete':'#dc2626' };

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-.4px', marginBottom:5 }}>{greet}, {user?.full_name?.split(' ')[0]}!</h1>
        <p style={{ color:'var(--text-2)', fontSize:13.5 }}>{new Date().toLocaleDateString('uz-UZ',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · BizCore boshqaruv paneli</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {kpis.map((k,i)=>(
          <div key={i} className="card-hover fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', position:'relative', overflow:'hidden', animationDelay:`${i*.04}s` }}>
            {k.color&&<div style={{ position:'absolute', top:0, right:0, width:100, height:100, background:`radial-gradient(circle at 100% 0%, ${k.color}14 0%, transparent 70%)`, pointerEvents:'none' }}/>}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              {k.color?<div style={{ padding:9, borderRadius:10, background:`${k.color}18`, color:k.color, display:'flex', alignItems:'center', justifyContent:'center' }}><Ic d={Array.isArray(k.icon)?k.icon[0]:k.icon} size={18}/></div>:<Skel w={38} h={38} r={10}/>}
              {k.trend!=null&&<span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:700, color:k.up?'#059669':'#dc2626', background:k.up?'#dcfce7':'#fee2e2', padding:'3px 8px', borderRadius:99 }}>
                <Ic d={k.up?IC.up[0]:IC.down[0]} size={11}/>{k.trend}%
              </span>}
            </div>
            {loading?<><Skel h={26} w="70%" style={{marginBottom:6}}/><Skel h={13} w="50%"/></>:<>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.3px', color:'var(--text-1)', marginBottom:3 }}>{k.val}</div>
              <div style={{ fontSize:12.5, color:'var(--text-2)', fontWeight:500 }}>{k.label}</div>
              {k.sub&&<div style={{ fontSize:11, color:'var(--text-3)', marginTop:3 }}>{k.sub}</div>}
            </>}
          </div>
        ))}
      </div>

      {/* Area Chart: Pul Oqimi Dinamikasi */}
      <div className="card-hover fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', marginBottom:16, boxShadow:'var(--shadow-sm)' }}>
        <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:3, color:'var(--text-1)' }}>Pul Oqimi Dinamikasi (Cashflow)</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>Kirim va chiqim mablag'larining oylik o'zgarishi va tahlili</div>
          </div>
          <div style={{ display:'flex', gap:12, fontSize:12 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontWeight:600 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#2563eb', display:'inline-block' }} /> Daromad</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontWeight:600 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#fbbf24', display:'inline-block' }} /> Xarajat</span>
          </div>
        </div>
        {loading ? <Skel h={180} /> : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)} />
              <RTooltip formatter={v=>[fmt(v)]} contentStyle={{ borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-card)', boxShadow:'var(--shadow-md)', fontSize:12 }} />
              <Area type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#fbbf24" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16, marginBottom:16 }}>
        {/* Bar chart */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>Moliyaviy Ko'rsatkichlar</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>6 oylik daromad va xarajat solishtirmasi</div>
          </div>
          {loading?<Skel h={220}/>:(
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text-3)'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                <RTooltip formatter={v=>[fmt(v)]} contentStyle={{borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-card)',boxShadow:'var(--shadow-md)',fontSize:12}}/>
                <Legend iconType="circle" iconSize={7} formatter={v=><span style={{fontSize:12,color:'var(--text-2)'}}>{v}</span>}/>
                <Bar dataKey="income" name="Daromad" fill="#2563eb" radius={[5,5,0,0]}/>
                <Bar dataKey="expense" name="Xarajat" fill="#fbbf24" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>Vazifalar Holati</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>Status bo'yicha taqsimot</div>
          </div>
          {loading?<Skel h={220}/>:taskData.length>0?(
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={4} dataKey="value">
                  {taskData.map((_,i)=><Cell key={i} fill={PIE_C[i%PIE_C.length]}/>)}
                </Pie>
                <Legend iconType="circle" iconSize={7} formatter={v=><span style={{fontSize:11,color:'var(--text-2)'}}>{v}</span>}/>
                <RTooltip contentStyle={{borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-card)',fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
          ):<div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',flexDirection:'column',gap:8}}><Ic d={IC.check_sq} size={36} stroke="var(--text-3)"/><span style={{fontSize:13}}>Vazifalar mavjud emas</span></div>}
        </div>
      </div>

      {/* Bottom row: activity + low stock */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Activity */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:14 }}>So'nggi Faoliyat</div>
            <Ic d={IC.activity} size={15} stroke="var(--text-3)"/>
          </div>
          <div style={{ maxHeight:260, overflowY:'auto' }}>
            {loading?Array(5).fill(0).map((_,i)=>(
              <div key={i} style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:12 }}><Skel w={32} h={32} r={16}/><div style={{flex:1}}><Skel h={13} w="70%" style={{marginBottom:6}}/><Skel h={11} w="40%"/></div></div>
            )):(stats?.recentActivity||[]).map((a,i)=>(
              <div key={i} style={{ padding:'11px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:`${actLog[a.action]||'#64748b'}18`, color:actLog[a.action]||'#64748b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Ic d={a.action==='login'?IC.users[0]:a.action==='create'?IC.plus:a.action==='delete'?IC.trash:IC.edit[0]} size={14}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.description}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{a.user_name} · {timeAgo(a.created_at)}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,background:`${actLog[a.action]||'#64748b'}18`,color:actLog[a.action]||'#64748b',padding:'2px 7px',borderRadius:99,flexShrink:0}}>{a.module}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Kam Qolgan Mahsulotlar</div>
            <Ic d={IC.warn} size={15} stroke="#d97706"/>
          </div>
          <div>
            {loading?Array(4).fill(0).map((_,i)=>(
              <div key={i} style={{padding:'12px 20px',borderBottom:'1px solid var(--border)'}}><Skel h={13} w="60%" style={{marginBottom:6}}/><Skel h={6} w="100%"/></div>
            )):(stats?.lowStock||[]).length===0?<div style={{padding:'40px 20px',textAlign:'center',color:'var(--text-3)',fontSize:13}}>Barcha mahsulotlar yetarli</div>:(stats?.lowStock||[]).map((p,i)=>{
              const pct = Math.min(100,Math.round((p.quantity/(p.min_quantity*3||1))*100));
              return <div key={i} style={{padding:'12px 20px',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontWeight:600,fontSize:13}}>{p.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:p.quantity===0?'#dc2626':'#d97706'}}>{p.quantity} {p.unit}</span>
                </div>
                <ProgBar value={pct} color={p.quantity===0?'#dc2626':'#d97706'}/>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>Minimum: {p.min_quantity} {p.unit}</div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── LOGIN ──────────────────────────────────────────────────────────────── */
const Login = ({ onLogin }) => {
  const [email,setEmail] = useState('admin@bizcore.uz');
  const [password,setPassword] = useState('admin123');
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); if(!email||!password){setErr('Maydonlarni to\'ldiring');return;}
    setLoading(true); setErr('');
    try { const r=await api.post('/api/auth/login',{email,password}); localStorage.setItem('bizcore_token',r.data.token); localStorage.setItem('bizcore_user',JSON.stringify(r.data.user)); onLogin(r.data.user); toast.success(`Xush kelibsiz, ${r.data.user.full_name}!`); }
    catch(e){ setErr(e.response?.data?.error||'Ulanishda xato'); }
    finally{ setLoading(false); }
  };

  const demos = [
    { email:'admin@bizcore.uz',    pw:'admin123', role:'Direktor',         dept:'Boshqaruv',         color:'#2563eb' },
    { email:'hr@bizcore.uz',       pw:'123456',   role:'HR Menejer',       dept:'HR Bo\'limi',       color:'#059669' },
    { email:'finance@bizcore.uz',  pw:'123456',   role:'Moliya Menejeri',  dept:'Moliya Bo\'limi',   color:'#7c3aed' },
    { email:'sales@bizcore.uz',    pw:'123456',   role:'Savdo Menejeri',   dept:'Savdo Bo\'limi',    color:'#db2777' },
    { email:'warehouse@bizcore.uz',pw:'123456',   role:'Ombor Boshlig\'i', dept:'Omborxona',         color:'#d97706' },
    { email:'it@bizcore.uz',       pw:'123456',   role:'Dasturchi',        dept:'IT Bo\'limi',       color:'#0891b2' },
    { email:'marketing@bizcore.uz',pw:'123456',   role:'Marketolog',       dept:'Marketing Bo\'limi',color:'#65a30d' },
    { email:'designer@bizcore.uz', pw:'123456',   role:'Dizayner',         dept:'IT Bo\'limi',       color:'#c026d3' },
  ];

  return (
    <div style={{minHeight:'100dvh',display:'flex',background:'var(--bg)'}}>
      {/* Left */}
      <div style={{flex:1,background:'linear-gradient(145deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 72px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'15%',right:'8%',width:350,height:350,borderRadius:'50%',background:'rgba(37,99,235,.1)',filter:'blur(80px)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'20%',left:'5%',width:250,height:250,borderRadius:'50%',background:'rgba(124,58,237,.08)',filter:'blur(60px)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:480}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:10,marginBottom:44,padding:'8px 14px',background:'rgba(255,255,255,.06)',borderRadius:12,border:'1px solid rgba(255,255,255,.1)'}}>
            <div style={{width:28,height:28,borderRadius:7,background:'#2563eb',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Ic d={IC.layers[0]} size={15} stroke="#fff"/>
            </div>
            <span style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,.9)',letterSpacing:'-.2px'}}>BizCore Enterprise</span>
          </div>
          <h1 style={{fontSize:40,fontWeight:800,color:'#fff',lineHeight:1.15,letterSpacing:'-.5px',marginBottom:18}}>Ko'p Modulli<br/>Korxona<br/>Boshqaruvi</h1>
          <p style={{color:'rgba(255,255,255,.45)',fontSize:14.5,lineHeight:1.75,marginBottom:42}}>8 ta mustaqil modul, real-time ma'lumotlar, to'liq CRUD operatsiyalar va PDF hisobotlar bitta tizimda.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{i:IC.users[0],t:'Xodimlar va HR boshqaruvi'},{i:IC.dollar,t:'Moliyaviy hisobotlar va tahlil'},{i:IC.check_sq[0],t:'Vazifalar va bajarilish nazorati'},{i:IC.handshake[0],t:'Mijozlar bazasi (CRM) va shartnomalar'},{i:IC.box,t:'Inventar va omborxona boshqaruvi'}].map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,color:'rgba(255,255,255,.6)'}}>
                <div style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Ic d={f.i} size={14} stroke="rgba(255,255,255,.75)"/>
                </div>
                <span style={{fontSize:13.5}}>{f.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{width:520,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 40px',overflowY:'auto'}}>
        <div style={{width:'100%',maxWidth:440}}>
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-.3px',marginBottom:5}}>Tizimga kirish</h2>
            <p style={{fontSize:13,color:'var(--text-2)'}}>Hisobingiz ma'lumotlarini kiriting yoki demo hisobni tanlang</p>
          </div>
          {err&&<div style={{background:'#fee2e2',border:'1px solid #fca5a5',color:'#991b1b',padding:'11px 14px',borderRadius:10,marginBottom:16,fontSize:13,fontWeight:500,display:'flex',gap:8,alignItems:'center'}}><Ic d={IC.warn} size={15} stroke="#991b1b"/>{err}</div>}
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12}}>
            <Inp label="Email manzili" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@bizcore.uz" required/>
            <Inp label="Parol" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
            <button type="submit" disabled={loading} style={{width:'100%',padding:'13px',background:'#2563eb',color:'#fff',border:'none',borderRadius:12,fontFamily:'Outfit,sans-serif',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?.8:1,transition:'all .15s',marginTop:2}}
              onMouseEnter={e=>{if(!loading)e.currentTarget.style.background='#1d4ed8';}}
              onMouseLeave={e=>e.currentTarget.style.background='#2563eb'}
              onMouseDown={e=>{if(!loading)e.currentTarget.style.transform='scale(0.98)';}}
              onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
              {loading?'Tekshirilmoqda...':'Kirish →'}
            </button>
          </form>

          {/* Demo accounts — 2 column grid, all 8 visible */}
          <div style={{marginTop:20,padding:'16px',background:'var(--accent-muted)',borderRadius:14,border:'1px solid rgba(37,99,235,.18)'}}>
            <p style={{fontSize:11,fontWeight:800,color:'var(--text-2)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.08em',display:'flex',alignItems:'center',gap:6}}>
              <Ic d={IC.users[0]} size={12} stroke="var(--text-2)"/>
              Demo Hisoblar — Bosing va kirish
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {demos.map((d,i)=>(
                <button key={i} onClick={()=>{setEmail(d.email);setPassword(d.pw);}}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:9,border:`1.5px solid ${d.color}22`,background:`${d.color}08`,cursor:'pointer',transition:'all .15s',textAlign:'left',width:'100%'}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${d.color}18`;e.currentTarget.style.borderColor=`${d.color}55`;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${d.color}08`;e.currentTarget.style.borderColor=`${d.color}22`;}}>
                  <div style={{width:30,height:30,borderRadius:8,background:d.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,fontWeight:800,color:'#fff'}}>
                    {d.role[0]}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:11.5,fontWeight:700,color:'var(--text-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.role}</div>
                    <div style={{fontSize:10,color:'var(--text-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.email}</div>
                    <div style={{fontSize:9.5,color:d.color,fontWeight:700,marginTop:1}}>🔑 {d.pw}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── NAV ────────────────────────────────────────────────────────────────── */
const NAV = [
  { k:'dashboard', l:'Boshqaruv Paneli', i:IC.home },
  { k:'users', l:'Xodimlar (HR)', i:IC.users[0] },
  { k:'departments', l:'Bo\'limlar', i:IC.building[0] },
  { k:'products', l:'Inventar & Ombor', i:IC.box },
  { k:'finance', l:'Moliya', i:IC.dollar },
  { k:'tasks', l:'Vazifalar', i:IC.check_sq[0] },
  { k:'clients', l:'Mijozlar (CRM)', i:IC.handshake[0] },
  { k:'contracts', l:'Shartnomalar', i:IC.file[0] },
  { k:'activity', l:'Tizim Jurnali', i:IC.activity[0] },
];

const PAGES = { dashboard:Dashboard, users:UsersPage, departments:DeptsPage, products:ProductsPage, finance:FinancePage, tasks:TasksPage, clients:ClientsPage, contracts:ContractsPage, activity:ActivityLogPage };

/* ─── APP ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [user,setUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem('bizcore_user'));}catch{return null;} });
  const [dark,setDark] = useState(false);
  const [page,setPage] = useState('dashboard');

  useEffect(()=>{ document.documentElement.setAttribute('data-theme',dark?'dark':'light'); },[dark]);

  const logout = () => { localStorage.clear(); window.location.reload(); };

  if(!user) return (<><Toaster position="top-right" toastOptions={{style:{borderRadius:12,fontFamily:'Outfit,sans-serif',fontWeight:500,fontSize:13.5}}}/><Login onLogin={setUser}/></>);

  const PageComp = PAGES[page]||Dashboard;

  return (
    <div style={{display:'flex',minHeight:'100dvh'}}>
      <Toaster position="top-right" toastOptions={{style:{borderRadius:12,fontFamily:'Outfit,sans-serif',fontWeight:500,fontSize:13.5},success:{iconTheme:{primary:'#059669',secondary:'#fff'}},error:{iconTheme:{primary:'#dc2626',secondary:'#fff'}}}}/>

      {/* Sidebar */}
      <aside style={{width:256,flexShrink:0,background:'var(--bg-card)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100dvh',position:'sticky',top:0,overflow:'hidden'}}>
        <div style={{padding:'18px 18px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:'#2563eb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Ic d={IC.layers[0]} size={19} stroke="#fff"/>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,letterSpacing:'-.3px',lineHeight:1.1}}>BizCore</div>
              <div style={{fontSize:9.5,color:'var(--text-3)',letterSpacing:'.07em',textTransform:'uppercase',fontWeight:600,marginTop:1}}>Enterprise Platform</div>
            </div>
          </div>
        </div>

        <nav style={{flex:1,padding:'10px 10px',overflowY:'auto'}}>
          <div style={{fontSize:9.5,fontWeight:700,color:'var(--text-3)',letterSpacing:'.1em',textTransform:'uppercase',padding:'6px 8px',marginBottom:4,marginTop:4}}>Asosiy Modullar</div>
          {NAV.map(n=>{
            const on=page===n.k;
            return (
              <button key={n.k} onClick={()=>setPage(n.k)}
                style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:13,fontWeight:on?700:500,background:on?'var(--accent-muted)':'transparent',color:on?'var(--accent)':'var(--text-2)',marginBottom:1,transition:'all .12s',textAlign:'left'}}
                onMouseEnter={e=>{ if(!on){e.currentTarget.style.background='var(--accent-muted)';e.currentTarget.style.color='var(--text-1)';} }}
                onMouseLeave={e=>{ if(!on){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-2)';} }}>
                <Ic d={n.i} size={16} stroke="currentColor"/>
                <span style={{flex:1}}>{n.l}</span>
                {on&&<div style={{width:4,height:4,borderRadius:'50%',background:'var(--accent)'}}/>}
              </button>
            );
          })}
        </nav>

        <div style={{padding:'10px 10px 14px',borderTop:'1px solid var(--border)'}}>
          <div style={{padding:'10px',borderRadius:10,background:'var(--bg)',display:'flex',alignItems:'center',gap:9}}>
            <Av name={user?.full_name} size={32}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.full_name}</div>
              <div style={{fontSize:10.5,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.role} · {user?.department}</div>
            </div>
            <button onClick={logout} title="Chiqish"
              style={{padding:6,border:'1px solid var(--border)',borderRadius:7,background:'none',cursor:'pointer',color:'var(--text-3)',display:'flex',alignItems:'center',flexShrink:0,transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#dc2626';e.currentTarget.style.color='#dc2626';e.currentTarget.style.background='#fee2e2';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';e.currentTarget.style.background='none';}}>
              <Ic d={IC.logout[0]} size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        {/* Topbar */}
        <header style={{height:60,background:'var(--bg-card)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>BizCore</span>
            <Ic d={IC.chevR} size={13} stroke="var(--text-3)"/>
            <span style={{fontSize:13,fontWeight:700,color:'var(--text-1)'}}>{NAV.find(n=>n.k===page)?.l}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:11.5,fontWeight:700,background:'var(--accent-muted)',color:'var(--accent)',padding:'4px 11px',borderRadius:99,border:'1px solid rgba(37,99,235,.2)'}}>{user?.role}</span>
            <div style={{width:1,height:18,background:'var(--border)'}}/>
            <button onClick={()=>setDark(d=>!d)} title={dark?'Kunduzgi rejim':'Tungi rejim'}
              style={{padding:7,border:'1px solid var(--border)',borderRadius:8,background:'none',cursor:'pointer',color:'var(--text-2)',display:'flex',alignItems:'center',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--border)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
              <Ic d={dark?IC.sun:IC.moon} size={15}/>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{flex:1,overflow:'auto',padding:24}}>
          <div key={page} className="fade-up">
            <PageComp user={user}/>
          </div>
        </main>
      </div>
    </div>
  );
}
