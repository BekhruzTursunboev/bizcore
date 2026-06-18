import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from './api.js';

/* ─── UTILS ─────────────────────────────────────────────────────────────── */
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0)) + ' so\'m';
const fmtK = n => {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mln';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' ming';
  return String(n);
};
const dateStr = d => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
const cls = (...c) => c.filter(Boolean).join(' ');

/* ─── ICON SET (inline SVGs - no external dep) ───────────────────────────── */
const Icon = ({ d, size = 18, className = '', stroke = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0',
  building: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  finance: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  task: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  client: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M9 7m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0',
  contract: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  sun: 'M12 2v2 M12 20v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M2 12h2 M20 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  plus: 'M12 5v14 M5 12h14',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  pdf: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M10 12v6 M14 12v6 M8 15h8',
  refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  close: 'M18 6L6 18 M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  trend_up: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6',
  trend_down: 'M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6',
  warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  chevron_right: 'M9 18l6-6-6-6',
  chevron_down: 'M6 9l6 6 6-6',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
};

/* ─── STATUS BADGE ───────────────────────────────────────────────────────── */
const STATUS_MAP = {
  'Faol': { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  'Yangi': { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  'Jarayonda': { bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  'Bajarildi': { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  'Bekor qilindi': { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  'Kutilmoqda': { bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  'Tasdiqlangan': { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  'Mavjud': { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  'Kam qoldi': { bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  'Tugagan': { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  'Nofaol': { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  'Ta\'tilda': { bg: '#faf5ff', color: '#6b21a8', dot: '#a855f7' },
};
const StatusBadge = ({ value }) => {
  const s = STATUS_MAP[value] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
      {value || '—'}
    </span>
  );
};

const PRIORITY_MAP = {
  'Yuqori': { bg: '#fee2e2', color: '#991b1b' },
  'Oddiy': { bg: '#dbeafe', color: '#1e40af' },
  'Past': { bg: '#dcfce7', color: '#166534' },
};
const PriorityBadge = ({ value }) => {
  const s = PRIORITY_MAP[value] || { bg: '#f1f5f9', color: '#475569' };
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{value}</span>;
};

/* ─── SKELETON ───────────────────────────────────────────────────────────── */
const Skeleton = ({ w = '100%', h = 20, r = 8, style = {} }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

/* ─── AVATAR ─────────────────────────────────────────────────────────────── */
const Avatar = ({ name = '', size = 36 }) => {
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: colors[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, letterSpacing: '-0.5px' }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
};

/* ─── STAT CARD ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon, trend, trendUp, color = '#2563eb', loading }) => (
  <div className="card-hover fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at 100% 0%, ${color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{ padding: 10, borderRadius: 12, background: `${color}15`, color }}>
        <Icon d={icon} size={20} />
      </div>
      {trend != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: trendUp ? '#059669' : '#dc2626', background: trendUp ? '#dcfce7' : '#fee2e2', padding: '4px 10px', borderRadius: 99 }}>
          <Icon d={trendUp ? Icons.trend_up : Icons.trend_down} size={13} />
          {trend}%
        </div>
      )}
    </div>
    {loading ? <><Skeleton h={32} w="70%" style={{ marginBottom: 8 }} /><Skeleton h={14} w="50%" /></> : (
      <>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-1)', marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>}
      </>
    )}
  </div>
);

/* ─── MODAL ──────────────────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, children, maxWidth = 560 }) => {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth, background: 'var(--bg-card)', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', animation: 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--text-3)', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Icon d={Icons.close} size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', maxHeight: '80vh', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};

/* ─── FORM COMPONENTS ────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
  background: 'var(--bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Outfit, sans-serif',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
};

const Inp = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <Field label={label}>
    <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder} required={required}
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  </Field>
);

const Sel = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <select value={value || ''} onChange={onChange} style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </Field>
);

const Textarea = ({ label, value, onChange, rows = 3 }) => (
  <Field label={label}>
    <textarea value={value || ''} onChange={onChange} rows={rows}
      style={{ ...inputStyle, resize: 'vertical' }}
      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  </Field>
);

/* ─── BUTTON ─────────────────────────────────────────────────────────────── */
const Btn = ({ children, onClick, variant = 'primary', size = 'md', icon, disabled, type = 'button', style: s = {} }) => {
  const styles = {
    primary: { background: '#2563eb', color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: 'var(--text-1)', border: '1.5px solid var(--border)' },
    danger: { background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5' },
    ghost: { background: 'transparent', color: 'var(--text-2)', border: 'none' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 15 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Outfit,sans-serif', fontWeight: 600, borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'all 0.15s', ...styles[variant], ...sizes[size], ...s }}
      onMouseEnter={e => { if (!disabled && variant === 'primary') e.currentTarget.style.background = '#1d4ed8'; if (!disabled && variant === 'secondary') e.currentTarget.style.background = 'var(--border)'; }}
      onMouseLeave={e => { if (!disabled && variant === 'primary') e.currentTarget.style.background = '#2563eb'; if (!disabled && variant === 'secondary') e.currentTarget.style.background = 'transparent'; }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
      {icon && <Icon d={icon} size={15} />}
      {children}
    </button>
  );
};

/* ─── TABLE ──────────────────────────────────────────────────────────────── */
const Table = ({ columns, rows, loading, emptyMsg = 'Ma\'lumot topilmadi' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--border)' }}>
          {columns.map(c => (
            <th key={c.key || c.label} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? Array(5).fill(0).map((_, i) => (
          <tr key={i}>
            {columns.map(c => (
              <td key={c.key || c.label} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton h={16} w={`${60 + Math.random() * 30}%`} />
              </td>
            ))}
          </tr>
        )) : rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: '60px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-3)' }}>
              <Icon d={Icons.warning} size={36} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{emptyMsg}</span>
            </div>
          </td></tr>
        ) : rows.map((row, i) => (
          <tr key={row.id || i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-muted)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {columns.map(c => (
              <td key={c.key || c.label} style={{ padding: '13px 16px', fontSize: 14, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─── CONFIRM DIALOG ─────────────────────────────────────────────────────── */
const ConfirmDialog = ({ open, onClose, onConfirm, title = 'O\'chirishni tasdiqlang', message = 'Bu amalni qaytarib bo\'lmaydi. Davom etasizmi?' }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth={420}>
    <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <Btn variant="secondary" onClick={onClose}>Bekor qilish</Btn>
      <Btn variant="danger" icon={Icons.trash} onClick={() => { onConfirm(); onClose(); }}>O'chirish</Btn>
    </div>
  </Modal>
);

/* ─── PAGE SHELL ─────────────────────────────────────────────────────────── */
const PageShell = ({ title, subtitle, actions, children }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-1)', marginBottom: 4 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
    {children}
  </div>
);

/* ─── SEARCH BOX ─────────────────────────────────────────────────────────── */
const SearchBox = ({ value, onChange, placeholder = 'Izlash...' }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
      <Icon d={Icons.search} size={16} />
    </div>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inputStyle, paddingLeft: 38, width: 220, height: 38 }}
      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.width = '280px'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.width = '220px'; }}
    />
  </div>
);

/* ─── CRUD HOOK ──────────────────────────────────────────────────────────── */
const useCrud = (endpoint) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/api/${endpoint}`); setRows(r.data || []); }
    catch { toast.error('Yuklab bo\'lmadi'); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (data, id) => {
    setSaving(true);
    try {
      if (id) { await api.put(`/api/${endpoint}/${id}`, data); toast.success('Yangilandi!'); }
      else { await api.post(`/api/${endpoint}`, data); toast.success('Qo\'shildi!'); }
      await fetch(); return true;
    } catch (e) { toast.error(e.response?.data?.error || 'Xato yuz berdi'); return false; }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/api/${endpoint}/${id}`); toast.success('O\'chirildi!'); await fetch(); }
    catch { toast.error('O\'chirishda xato'); }
  };

  return { rows, loading, saving, fetch, save, remove };
};

const ROLES = ['Direktor', 'Bosh Menejer', 'HR Menejer', 'Moliya Menejeri', 'Savdo Menejeri', 'Ombor Boshlig\'i', 'Marketolog', 'Dasturchi', 'Dizayner', 'Xodim'];
const DEPTS = ['Boshqaruv', 'HR Bo\'limi', 'Moliya Bo\'limi', 'Savdo Bo\'limi', 'Omborxona', 'IT Bo\'limi', 'Marketing Bo\'limi'];

/* ─── USER FORM ──────────────────────────────────────────────────────────── */
const UserForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ full_name: '', email: '', password: '', role: 'Xodim', department: 'Boshqaruv', phone: '', salary: '', status: 'Faol', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1' }}><Inp label="F.I.O *" value={d.full_name} onChange={u('full_name')} required /></div>
        <Inp label="Email *" type="email" value={d.email} onChange={u('email')} required />
        <Inp label={initial ? 'Yangi parol (ixtiyoriy)' : 'Parol *'} type="password" value={d.password} onChange={u('password')} />
        <Sel label="Lavozim" value={d.role} onChange={u('role')} options={ROLES} />
        <Sel label="Bo'lim" value={d.department} onChange={u('department')} options={DEPTS} />
        <Inp label="Telefon" value={d.phone} onChange={u('phone')} placeholder="+998 90 000 00 00" />
        <Inp label="Maosh (so'm)" type="number" value={d.salary} onChange={u('salary')} />
        <div style={{ gridColumn: '1/-1' }}>
          <Sel label="Holat" value={d.status} onChange={u('status')} options={['Faol', 'Nofaol', 'Ta\'tilda']} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── DEPT FORM ──────────────────────────────────────────────────────────── */
const DeptForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ name: '', manager_name: '', budget: '', description: '', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Bo'lim nomi *" value={d.name} onChange={u('name')} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Inp label="Rahbar" value={d.manager_name} onChange={u('manager_name')} />
          <Inp label="Byudjet (so'm)" type="number" value={d.budget} onChange={u('budget')} />
        </div>
        <Textarea label="Tavsif" value={d.description} onChange={u('description')} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── PRODUCT FORM ───────────────────────────────────────────────────────── */
const ProductForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ name: '', category: '', quantity: '', unit: 'dona', price: '', supplier: '', status: 'Mavjud', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}><Inp label="Mahsulot nomi *" value={d.name} onChange={u('name')} required /></div>
        <Inp label="Kategoriya" value={d.category} onChange={u('category')} />
        <Inp label="Yetkazib beruvchi" value={d.supplier} onChange={u('supplier')} />
        <Inp label="Miqdor" type="number" value={d.quantity} onChange={u('quantity')} />
        <Sel label="O'lchov" value={d.unit} onChange={u('unit')} options={['dona', 'kg', 'litr', 'metr', 'paket', 'quti', 'juft']} />
        <Inp label="Narx (so'm)" type="number" value={d.price} onChange={u('price')} />
        <Sel label="Holat" value={d.status} onChange={u('status')} options={['Mavjud', 'Kam qoldi', 'Tugagan']} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── FINANCE FORM ───────────────────────────────────────────────────────── */
const FinanceForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ type: 'Kirim', category: '', amount: '', description: '', department: 'Boshqaruv', date: new Date().toISOString().split('T')[0], status: 'Tasdiqlangan', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Sel label="Tur *" value={d.type} onChange={u('type')} options={['Kirim', 'Chiqim']} />
        <Inp label="Kategoriya" value={d.category} onChange={u('category')} placeholder="Maosh, Xizmat..." />
        <Inp label="Summa (so'm) *" type="number" value={d.amount} onChange={u('amount')} required />
        <Sel label="Bo'lim" value={d.department} onChange={u('department')} options={DEPTS} />
        <Inp label="Sana" type="date" value={d.date} onChange={u('date')} />
        <Sel label="Holat" value={d.status} onChange={u('status')} options={['Tasdiqlangan', 'Kutilmoqda', 'Bekor qilindi']} />
        <div style={{ gridColumn: '1/-1' }}><Textarea label="Tavsif" value={d.description} onChange={u('description')} rows={2} /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── TASK FORM ──────────────────────────────────────────────────────────── */
const TaskForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ title: '', description: '', assigned_to: '', assigned_by: '', department: 'Boshqaruv', priority: 'Oddiy', status: 'Yangi', due_date: '', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Vazifa nomi *" value={d.title} onChange={u('title')} required />
        <Textarea label="Tavsif" value={d.description} onChange={u('description')} rows={2} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Inp label="Ijrochi" value={d.assigned_to} onChange={u('assigned_to')} />
          <Inp label="Topshiruvchi" value={d.assigned_by} onChange={u('assigned_by')} />
          <Sel label="Bo'lim" value={d.department} onChange={u('department')} options={DEPTS} />
          <Sel label="Muhimlik" value={d.priority} onChange={u('priority')} options={['Yuqori', 'Oddiy', 'Past']} />
          <Sel label="Holat" value={d.status} onChange={u('status')} options={['Yangi', 'Jarayonda', 'Bajarildi', 'Bekor qilindi']} />
          <Inp label="Muddat" type="date" value={d.due_date ? d.due_date.split('T')[0] : ''} onChange={u('due_date')} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── CLIENT FORM ────────────────────────────────────────────────────────── */
const ClientForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ company_name: '', contact_person: '', email: '', phone: '', address: '', status: 'Faol', contract_value: '', notes: '', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}><Inp label="Kompaniya nomi *" value={d.company_name} onChange={u('company_name')} required /></div>
        <Inp label="Mas'ul shaxs" value={d.contact_person} onChange={u('contact_person')} />
        <Inp label="Email" type="email" value={d.email} onChange={u('email')} />
        <Inp label="Telefon" value={d.phone} onChange={u('phone')} />
        <Inp label="Shartnoma qiymati (so'm)" type="number" value={d.contract_value} onChange={u('contract_value')} />
        <div style={{ gridColumn: '1/-1' }}><Inp label="Manzil" value={d.address} onChange={u('address')} /></div>
        <Sel label="Holat" value={d.status} onChange={u('status')} options={['Faol', 'Kutilmoqda', 'Nofaol']} />
        <div style={{ gridColumn: '1/-1' }}><Textarea label="Izoh" value={d.notes} onChange={u('notes')} rows={2} /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── CONTRACT FORM ──────────────────────────────────────────────────────── */
const ContractForm = ({ initial, onSave, saving }) => {
  const [d, setD] = useState({ title: '', client_name: '', amount: '', start_date: '', end_date: '', status: 'Kutilmoqda', description: '', ...initial });
  const u = k => e => setD(p => ({ ...p, [k]: e.target.value }));
  const dateVal = v => v ? v.split('T')[0] : '';
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(d); }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Shartnoma nomi *" value={d.title} onChange={u('title')} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Inp label="Mijoz" value={d.client_name} onChange={u('client_name')} />
          <Inp label="Summa (so'm)" type="number" value={d.amount} onChange={u('amount')} />
          <Inp label="Boshlanish" type="date" value={dateVal(d.start_date)} onChange={u('start_date')} />
          <Inp label="Tugash" type="date" value={dateVal(d.end_date)} onChange={u('end_date')} />
          <div style={{ gridColumn: '1/-1' }}>
            <Sel label="Holat" value={d.status} onChange={u('status')} options={['Faol', 'Kutilmoqda', 'Tugagan', 'Bekor qilindi']} />
          </div>
        </div>
        <Textarea label="Tavsif" value={d.description} onChange={u('description')} rows={2} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn type="submit" disabled={saving} icon={Icons.check}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  );
};

/* ─── CRUD PAGE FACTORY ──────────────────────────────────────────────────── */
const CrudPage = ({ title, subtitle, endpoint, columns, FormComponent, searchKeys = [], pdfTitle }) => {
  const { rows, loading, saving, save, remove, fetch } = useCrud(endpoint);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data?: any }
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() =>
    rows.filter(r => !search || searchKeys.some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
  , [rows, search, searchKeys]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(pdfTitle || title, 14, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')} | Jami: ${filtered.length} ta`, 14, 26);
    const pdfCols = columns.filter(c => c.pdfKey || c.key);
    autoTable(doc, {
      head: [pdfCols.map(c => c.label)],
      body: filtered.map(r => pdfCols.map(c => { const v = r[c.pdfKey || c.key]; return v != null ? String(v) : '—'; })),
      startY: 32,
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 255] },
    });
    doc.save(`${pdfTitle || title}.pdf`);
    toast.success('PDF tayyor!');
  };

  return (
    <PageShell title={title} subtitle={subtitle}
      actions={<>
        <SearchBox value={search} onChange={setSearch} />
        <Btn variant="secondary" icon={Icons.refresh} onClick={fetch}>Yangilash</Btn>
        <Btn variant="secondary" icon={Icons.pdf} onClick={exportPDF}>PDF</Btn>
        <Btn icon={Icons.plus} onClick={() => setModal({ mode: 'add' })}>Yangi qo'shish</Btn>
      </>}>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <Table columns={[...columns, {
          label: 'Amallar', render: (_, row) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setModal({ mode: 'edit', data: row })}
                style={{ padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                <Icon d={Icons.edit} size={14} />
              </button>
              <button onClick={() => setConfirm(row.id)}
                style={{ padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                <Icon d={Icons.trash} size={14} />
              </button>
            </div>
          )
        }]} rows={filtered} loading={loading} />
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Jami <strong style={{ color: 'var(--text-1)' }}>{filtered.length}</strong> ta yozuv</span>
          {search && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>"{search}" bo'yicha filtr</span>}
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Tahrirlash' : 'Yangi qo\'shish'}>
        <FormComponent initial={modal?.data} saving={saving}
          onSave={async data => { const ok = await save(data, modal?.data?.id); if (ok) setModal(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => remove(confirm)} />
    </PageShell>
  );
};

/* ─── PAGES ──────────────────────────────────────────────────────────────── */
const UsersPage = () => <CrudPage title="Xodimlar" subtitle="Kadrlar boshqaruvi va HR ma'lumotlar bazasi" endpoint="users" FormComponent={UserForm} searchKeys={['full_name', 'email', 'role', 'department']} pdfTitle="Xodimlar Ro'yxati"
  columns={[
    { key: 'full_name', label: 'Xodim', render: (v, r) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={v} size={34} /><div><div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.email}</div></div></div> },
    { key: 'role', label: 'Lavozim', render: v => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span> },
    { key: 'department', label: 'Bo\'lim', render: v => <span style={{ background: 'var(--accent-muted)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span> },
    { key: 'phone', label: 'Telefon' },
    { key: 'salary', label: 'Maosh', render: v => <span style={{ fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span> },
    { key: 'status', label: 'Holat', render: v => <StatusBadge value={v} /> },
  ]}
/>;

const DeptsPage = () => <CrudPage title="Bo'limlar" subtitle="Tashkilot bo'limlari va byudjet boshqaruvi" endpoint="departments" FormComponent={DeptForm} searchKeys={['name', 'manager_name']} pdfTitle="Bo'limlar"
  columns={[
    { key: 'name', label: 'Bo\'lim nomi', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
    { key: 'manager_name', label: 'Rahbar', render: (v) => v ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={v} size={28} />{v}</div> : '—' },
    { key: 'budget', label: 'Byudjet', render: v => <span style={{ fontWeight: 700, color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span> },
    { key: 'description', label: 'Tavsif', render: v => <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{v || '—'}</span> },
  ]}
/>;

const ProductsPage = () => <CrudPage title="Inventar va Omborxona" subtitle="Mahsulotlar zaxirasi va ombor boshqaruvi" endpoint="products" FormComponent={ProductForm} searchKeys={['name', 'category', 'supplier']} pdfTitle="Inventar Ro'yxati"
  columns={[
    { key: 'name', label: 'Mahsulot', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'category', label: 'Kategoriya', render: v => <span style={{ background: 'var(--accent-muted)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v || '—'}</span> },
    { key: 'quantity', label: 'Miqdor', render: (v, r) => <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>{r.unit}</span></span> },
    { key: 'price', label: 'Narx', render: v => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span> },
    { key: 'supplier', label: 'Yetkazib beruvchi' },
    { key: 'status', label: 'Holat', render: v => <StatusBadge value={v} /> },
  ]}
/>;

const FinancePage = () => <CrudPage title="Moliya va Hisobotlar" subtitle="Daromad, xarajat va moliyaviy tranzaksiyalar" endpoint="finance" FormComponent={FinanceForm} searchKeys={['type', 'category', 'description', 'department']} pdfTitle="Moliyaviy Hisobot"
  columns={[
    { key: 'type', label: 'Tur', render: v => <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: v === 'Kirim' ? '#dcfce7' : '#fee2e2', color: v === 'Kirim' ? '#166534' : '#991b1b' }}>{v}</span> },
    { key: 'category', label: 'Kategoriya' },
    { key: 'amount', label: 'Summa', render: (v, r) => <span style={{ fontWeight: 800, color: r.type === 'Kirim' ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{r.type === 'Kirim' ? '+' : '−'}{fmt(v)}</span> },
    { key: 'department', label: 'Bo\'lim' },
    { key: 'date', label: 'Sana', render: v => <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{dateStr(v)}</span> },
    { key: 'status', label: 'Holat', render: v => <StatusBadge value={v} /> },
  ]}
/>;

const TasksPage = () => <CrudPage title="Vazifalar" subtitle="Topshiriqlar va ularning bajarilish holati" endpoint="tasks" FormComponent={TaskForm} searchKeys={['title', 'assigned_to', 'department']} pdfTitle="Vazifalar Ro'yxati"
  columns={[
    { key: 'title', label: 'Vazifa', render: v => <span style={{ fontWeight: 600, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span> },
    { key: 'assigned_to', label: 'Ijrochi', render: v => v ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={v} size={26} />{v}</div> : '—' },
    { key: 'department', label: 'Bo\'lim' },
    { key: 'priority', label: 'Muhimlik', render: v => <PriorityBadge value={v} /> },
    { key: 'status', label: 'Holat', render: v => <StatusBadge value={v} /> },
    { key: 'due_date', label: 'Muddat', render: v => { const d = v ? new Date(v) : null; const past = d && d < new Date(); return <span style={{ color: past ? '#dc2626' : 'var(--text-2)', fontSize: 13, fontWeight: past ? 700 : 400 }}>{dateStr(v)}</span>; } },
  ]}
/>;

const ClientsPage = () => <CrudPage title="Mijozlar (CRM)" subtitle="Mijozlar bazasi va munosabatlar boshqaruvi" endpoint="clients" FormComponent={ClientForm} searchKeys={['company_name', 'contact_person', 'email']} pdfTitle="Mijozlar Ro'yxati"
  columns={[
    { key: 'company_name', label: 'Kompaniya', render: (v, r) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={v} size={32} /><div><div style={{ fontWeight: 700 }}>{v}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.contact_person}</div></div></div> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefon' },
    { key: 'contract_value', label: 'Qiymat', render: v => <span style={{ fontWeight: 700, color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span> },
    { key: 'status', label: 'Holat', render: v => <StatusBadge value={v} /> },
  ]}
/>;

const ContractsPage = () => <CrudPage title="Shartnomalar" subtitle="Faol va kutilayotgan shartnomalar ro'yxati" endpoint="contracts" FormComponent={ContractForm} searchKeys={['title', 'client_name']} pdfTitle="Shartnomalar Ro'yxati"
  columns={[
    { key: 'title', label: 'Shartnoma', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'client_name', label: 'Mijoz' },
    { key: 'amount', label: 'Summa', render: v => <span style={{ fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span> },
    { key: 'start_date', label: 'Boshlanish', render: v => <span style={{ fontSize: 13 }}>{dateStr(v)}</span> },
    { key: 'end_date', label: 'Tugash', render: v => <span style={{ fontSize: 13 }}>{dateStr(v)}</span> },
    { key: 'status', label: 'Holat', render: v => <StatusBadge value={v} /> },
  ]}
/>;

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const months = ['Yanv', 'Fevr', 'Mart', 'Apr', 'May', 'Iyun'];
  const barData = stats ? months.map((name, i) => ({
    name,
    Daromad: Math.round(stats.totalIncome * [0.10, 0.13, 0.16, 0.18, 0.20, 0.23][i]),
    Xarajat: Math.round(stats.totalExpense * [0.12, 0.14, 0.15, 0.17, 0.20, 0.22][i]),
  })) : [];

  const pieData = stats ? Object.entries(stats.taskStats || {}).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : [];

  const areaData = stats ? months.map((name, i) => ({
    name,
    Foyda: Math.round((stats.totalIncome - stats.totalExpense) * [0.05, 0.10, 0.16, 0.25, 0.35, 0.09][i]),
  })) : [];

  const hourNow = new Date().getHours();
  const greeting = hourNow < 12 ? 'Xayrli tong' : hourNow < 17 ? 'Xayrli kun' : 'Xayrli kech';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 6 }}>
          {greeting}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — BizCore boshqaruv paneli
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Jami Xodimlar" value={loading ? '—' : stats?.totalUsers} icon={Icons.users} color="#2563eb" trend={12} trendUp sub="Faol xodimlar" loading={loading} />
        <StatCard label="Jami Daromad" value={loading ? '—' : fmtK(stats?.totalIncome)} icon={Icons.trend_up} color="#059669" trend={8} trendUp sub="Joriy oy" loading={loading} />
        <StatCard label="Jami Xarajat" value={loading ? '—' : fmtK(stats?.totalExpense)} icon={Icons.trend_down} color="#d97706" trend={3} sub="Joriy oy" loading={loading} />
        <StatCard label="Sof Foyda" value={loading ? '—' : fmtK(stats?.netProfit)} icon={Icons.finance} color="#7c3aed" trend={15} trendUp loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Bo'limlar" value={loading ? '—' : stats?.totalDepartments} icon={Icons.building} color="#0891b2" loading={loading} />
        <StatCard label="Mahsulotlar" value={loading ? '—' : stats?.totalProducts} icon={Icons.box} color="#d97706" loading={loading} />
        <StatCard label="Mijozlar" value={loading ? '—' : stats?.totalClients} icon={Icons.client} color="#059669" loading={loading} />
        <StatCard label="Faol Shartnomalar" value={loading ? '—' : stats?.activeContracts} icon={Icons.contract} color="#dc2626" loading={loading} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card-hover" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Moliyaviy Ko'rsatkichlar</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>6 oylik daromad va xarajat tahlili</p>
          </div>
          {loading ? <Skeleton h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
                <RTooltip formatter={v => [fmt(v)]} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="Daromad" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Xarajat" fill="#fbbf24" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-hover" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Vazifalar Holati</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Jarayon bo'yicha taqsimot</p>
          </div>
          {loading ? <Skeleton h={240} /> : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{v}</span>} />
                <RTooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Vazifalar mavjud emas</div>}
        </div>
      </div>

      {/* Area chart */}
      <div className="card-hover" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Sof Foyda Dinamikasi</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Oylar bo'yicha sof foyda o'zgarishi</p>
        </div>
        {loading ? <Skeleton h={180} /> : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
              <RTooltip formatter={v => [fmt(v), 'Sof Foyda']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }} />
              <Area type="monotone" dataKey="Foyda" stroke="#2563eb" strokeWidth={2.5} fill="url(#profitGrad)" dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

/* ─── LOGIN ──────────────────────────────────────────────────────────────── */
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@bizcore.uz');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    if (!email || !password) { setError('Email va parolni kiriting'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('bizcore_token', res.data.token);
      localStorage.setItem('bizcore_user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      toast.success(`Xush kelibsiz!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login xatosi yuz berdi');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(37,99,235,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={Icons.building} size={24} stroke="#fff" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>BizCore</span>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 20 }}>Ko'p Modulli<br />Korxona<br />Boshqaruvi</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, maxWidth: 360, marginBottom: 40 }}>HR, Moliya, Inventar, Vazifalar va CRM — barchasi bitta tizimda.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[{ icon: Icons.users, text: 'Xodimlar va kadrlar boshqaruvi' }, { icon: Icons.finance, text: 'Moliyaviy hisobotlar va tahlil' }, { icon: Icons.task, text: 'Vazifalar va topshiriqlar kuzatuvi' }, { icon: Icons.client, text: 'Mijozlar va shartnomalar (CRM)' }].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.7)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon d={f.icon} size={15} stroke="rgba(255,255,255,0.8)" />
                </div>
                <span style={{ fontSize: 14 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.3px' }}>Tizimga kirish</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Hisobingiz ma'lumotlarini kiriting</p>
          </div>
          {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>{error}</div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Inp label="Email manzili" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bizcore.uz" />
            <Inp label="Parol" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, transition: 'all 0.15s', marginTop: 4 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              {loading ? 'Tekshirilmoqda...' : 'Kirish →'}
            </button>
          </form>
          <div style={{ marginTop: 28, padding: 16, background: 'var(--accent-muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Demo hisoblar:</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>
              admin@bizcore.uz / admin123<br />
              hr@bizcore.uz / 123456<br />
              finance@bizcore.uz / 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── NAV CONFIG ─────────────────────────────────────────────────────────── */
const NAV = [
  { key: 'dashboard', label: 'Boshqaruv Paneli', icon: Icons.dashboard },
  { key: 'users', label: 'Xodimlar', icon: Icons.users },
  { key: 'departments', label: 'Bo\'limlar', icon: Icons.building },
  { key: 'products', label: 'Inventar & Ombor', icon: Icons.box },
  { key: 'finance', label: 'Moliya', icon: Icons.finance },
  { key: 'tasks', label: 'Vazifalar', icon: Icons.task },
  { key: 'clients', label: 'Mijozlar (CRM)', icon: Icons.client },
  { key: 'contracts', label: 'Shartnomalar', icon: Icons.contract },
];

const PAGE_MAP = {
  dashboard: Dashboard,
  users: UsersPage,
  departments: DeptsPage,
  products: ProductsPage,
  finance: FinancePage,
  tasks: TasksPage,
  clients: ClientsPage,
  contracts: ContractsPage,
};

/* ─── APP ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('bizcore_user')); } catch { return null; } });
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => {
    localStorage.removeItem('bizcore_token');
    localStorage.removeItem('bizcore_user');
    window.location.href = '/';
  };

  if (!user) return (<>
    <Toaster position="top-right" toastOptions={{ style: { borderRadius: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 14 } }} />
    <Login onLogin={setUser} />
  </>);

  const PageComp = PAGE_MAP[page] || Dashboard;

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 14 } }} />

      {/* ── Sidebar ── */}
      <aside style={{ width: 'var(--sidebar)', flexShrink: 0, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100dvh', position: 'sticky', top: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={Icons.building} size={20} stroke="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px', lineHeight: 1 }}>BizCore</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>Enterprise</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Modullar</div>
          {NAV.map(n => {
            const active = page === n.key;
            return (
              <button key={n.key} onClick={() => setPage(n.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13.5, fontWeight: active ? 700 : 500, background: active ? '#dbeafe' : 'transparent', color: active ? '#2563eb' : 'var(--text-2)', marginBottom: 2, transition: 'all 0.15s', textAlign: 'left' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; } }}>
                <div style={{ color: active ? '#2563eb' : 'var(--text-3)', flexShrink: 0 }}>
                  <Icon d={n.icon} size={17} stroke="currentColor" />
                </div>
                <span style={{ flex: 1 }}>{n.label}</span>
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={user?.full_name} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Chiqish"
              style={{ padding: 7, border: '1px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fee2e2'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}>
              <Icon d={Icons.logout} size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: 'var(--topbar)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>BizCore</span>
            <Icon d={Icons.chevron_right} size={14} stroke="var(--text-3)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{NAV.find(n => n.key === page)?.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--accent-muted)', color: 'var(--accent)', padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(37,99,235,0.2)' }}>{user?.role}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.department}</span>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <button onClick={() => setDark(d => !d)}
              style={{ padding: '7px', border: '1px solid var(--border)', borderRadius: 9, background: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
              <Icon d={dark ? Icons.sun : Icons.moon} size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          <PageComp user={user} />
        </main>
      </div>
    </div>
  );
}
