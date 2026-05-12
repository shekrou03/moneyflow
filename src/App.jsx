import { useState, useEffect, useCallback, useMemo } from "react";

const CURRENCIES = [
  { code: "SGD", symbol: "S$", flag: "🇸🇬", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", flag: "🇲🇾", name: "Malaysian Ringgit" },
  { code: "USD", symbol: "$",  flag: "🇺🇸", name: "US Dollar" },
  { code: "CNY", symbol: "¥",  flag: "🇨🇳", name: "Chinese Yuan" },
  { code: "EUR", symbol: "€",  flag: "🇪🇺", name: "Euro" },
  { code: "JPY", symbol: "¥",  flag: "🇯🇵", name: "Japanese Yen" },
  { code: "GBP", symbol: "£",  flag: "🇬🇧", name: "British Pound" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", name: "Australian Dollar" },
  { code: "THB", symbol: "฿",  flag: "🇹🇭", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", flag: "🇮🇩", name: "Indonesian Rupiah" },
];

const CATEGORIES = [
  { id: "food",          icon: "🍜", label: "餐饮",   color: "#f97316" },
  { id: "transport",     icon: "🚌", label: "交通",   color: "#3b82f6" },
  { id: "shopping",      icon: "🛍️", label: "购物",   color: "#ec4899" },
  { id: "entertainment", icon: "🎮", label: "娱乐",   color: "#8b5cf6" },
  { id: "health",        icon: "❤", label: "医疗",   color: "#ef4444" },
  { id: "housing",       icon: "🏠", label: "住房",   color: "#14b8a6" },
  { id: "utilities",     icon: "💡", label: "水电",   color: "#f59e0b" },
  { id: "education",     icon: "📚", label: "教育",   color: "#6366f1" },
  { id: "salary",        icon: "💼", label: "工资",   color: "#22c55e" },
  { id: "investment",    icon: "📈", label: "投资",   color: "#10b981" },
  { id: "other",         icon: "📦", label: "其他",   color: "#6b7280" },
];

const ACCOUNTS = [
  { id: "cash",   icon: "💵", label: "现金" },
  { id: "debit",  icon: "💳", label: "储蓄卡" },
  { id: "credit", icon: "🏦", label: "信用卡" },
  { id: "paynow", icon: "🟣", label: "PayNow" },
  { id: "duitnow", icon: "🔵", label: "DuitNow" },
];

const FALLBACK_RATES = {
  SGD: 1, MYR: 3.52, USD: 0.74, CNY: 5.38, EUR: 0.69,
  JPY: 113.2, GBP: 0.59, AUD: 1.14, THB: 27.3, IDR: 11420,
};

const SAMPLE_DATA = [
  { id: 1,  type: "expense", amount: 12.5,  currency: "SGD", category: "food",          account: "paynow", date: "2025-05-10", note: "Maxwell hawker centre" },
  { id: 2,  type: "expense", amount: 35,    currency: "MYR", category: "food",          account: "cash",   date: "2025-05-09", note: "KL dim sum breakfast" },
  { id: 3,  type: "income",  amount: 4800,  currency: "SGD", category: "salary",        account: "debit",  date: "2025-05-07", note: "May salary" },
  { id: 4,  type: "expense", amount: 1800,  currency: "SGD", category: "housing",       account: "debit",  date: "2025-05-01", note: "May rent" },
  { id: 5,  type: "expense", amount: 2.2,   currency: "SGD", category: "transport",     account: "debit",  date: "2025-05-08", note: "MRT to work" },
  { id: 6,  type: "expense", amount: 180,   currency: "MYR", category: "shopping",      account: "credit", date: "2025-05-06", note: "Pavilion KL" },
  { id: 7,  type: "expense", amount: 28.9,  currency: "SGD", category: "entertainment", account: "credit", date: "2025-05-05", note: "Netflix + Spotify" },
  { id: 8,  type: "expense", amount: 50,    currency: "MYR", category: "transport",     account: "cash",   date: "2025-05-04", note: "Grab KL airport" },
  { id: 9,  type: "expense", amount: 15.8,  currency: "SGD", category: "food",          account: "paynow", date: "2025-05-03", note: "Lunch at office" },
  { id: 10, type: "expense", amount: 500,   currency: "MYR", category: "shopping",      account: "credit", date: "2025-04-28", note: "JB grocery shopping" },
];

const fmt = (n, currency = "SGD") => {
  const c = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const val = typeof n === "number" ? n : 0;
  if (["JPY", "IDR"].includes(currency)) return `${c.symbol}${Math.round(val).toLocaleString()}`;
  return `${c.symbol}${val.toFixed(2)}`;
};
const getCat = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
const getAcc = id => ACCOUNTS.find(a => a.id === id) || ACCOUNTS[0];
const getCur = code => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

function PieChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "#f1f5f9" }} />;
  let cum = 0;
  const slices = data.map(d => { const pct = d.value / total; const start = cum; cum += pct; return { ...d, pct, start }; });
  const r = 50, cx = 60, cy = 60;
  const p2c = pct => { const a = pct * 2 * Math.PI - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {slices.map((s, i) => {
        if (s.pct === 0) return null;
        if (s.pct >= 0.999) return <circle key={i} cx={cx} cy={cy} r={r} fill={s.color} />;
        const [x1, y1] = p2c(s.start); const [x2, y2] = p2c(s.start + s.pct);
        return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${s.pct > 0.5 ? 1 : 0},1 ${x2},${y2} Z`} fill={s.color} stroke="#fff" strokeWidth="2" />;
      })}
      <circle cx={cx} cy={cy} r={32} fill="#fff" />
    </svg>
  );
}

function BarChart({ data, height = 80 }) {
  const max = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0)), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, paddingTop: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", display: "flex", gap: 1, alignItems: "flex-end", height: height - 18 }}>
            {d.income > 0 && <div style={{ flex: 1, background: "#22c55e", borderRadius: "3px 3px 0 0", height: `${(d.income / max) * 100}%`, minHeight: 2 }} />}
            {d.expense > 0 && <div style={{ flex: 1, background: "#f97316", borderRadius: "3px 3px 0 0", height: `${(d.expense / max) * 100}%`, minHeight: 2 }} />}
          </div>
          <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ratesUpdated, setRatesUpdated] = useState(null);
  const [rateSource, setRateSource] = useState("离线");
  const [baseCurrency, setBaseCurrency] = useState("SGD");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterAcc, setFilterAcc] = useState("all");
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const [budgets, setBudgets] = useState({ food: 600, transport: 150, shopping: 400, entertainment: 100, health: 200, housing: 1900, utilities: 80, education: 100 });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [recurringRules, setRecurringRules] = useState([
    { id: 1, label: "房租", amount: 1800, currency: "SGD", category: "housing", account: "debit", day: 1 },
    { id: 2, label: "Netflix", amount: 15.98, currency: "SGD", category: "entertainment", account: "credit", day: 5 },
  ]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editRecurring, setEditRecurring] = useState(null);
  const [recurringForm, setRecurringForm] = useState({ label: "", amount: "", currency: "SGD", category: "utilities", account: "debit", day: 1 });
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ amount: "", currency: "SGD", category: "food", account: "cash", date: new Date().toISOString().slice(0, 10), note: "", type: "expense" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await res.json();
        if (data.result === "success" && data.rates) {
          const r = { [baseCurrency]: 1 };
          CURRENCIES.forEach(c => { if (data.rates[c.code]) r[c.code] = data.rates[c.code]; });
          setRates(r); setRatesUpdated(new Date()); setRateSource("open.er-api.com"); return;
        }
      } catch (_) {}
      try {
        const codes = CURRENCIES.map(c => c.code).filter(c => c !== baseCurrency).join(",");
        const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${codes}`);
        const data = await res.json();
        if (data.rates) { setRates({ [baseCurrency]: 1, ...data.rates }); setRatesUpdated(new Date()); setRateSource("frankfurter.app"); return; }
      } catch (_) {}
      setRates(FALLBACK_RATES); setRateSource("离线备用");
      showToast("无法获取实时汇率，使用备用数据", "warn");
    };
    fetchRates();
    const id = setInterval(fetchRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [baseCurrency]);

  const toBase = useCallback((amount, currency) => {
    if (currency === baseCurrency) return amount;
    return amount / (rates[currency] || FALLBACK_RATES[currency] || 1);
  }, [rates, baseCurrency]);

  const fromBase = useCallback((amount, currency) => {
    if (currency === baseCurrency) return amount;
    return amount * (rates[currency] || FALLBACK_RATES[currency] || 1);
  }, [rates, baseCurrency]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));
    const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + toBase(t.amount, t.currency), 0);
    const expense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + toBase(t.amount, t.currency), 0);
    const byCategory = CATEGORIES.map(cat => ({
      ...cat, value: monthTx.filter(t => t.type === "expense" && t.category === cat.id).reduce((s, t) => s + toBase(t.amount, t.currency), 0),
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const txs = transactions.filter(t => t.date.startsWith(key));
      return { label: `${d.getMonth() + 1}月`, income: txs.filter(t => t.type === "income").reduce((s, t) => s + toBase(t.amount, t.currency), 0), expense: txs.filter(t => t.type === "expense").reduce((s, t) => s + toBase(t.amount, t.currency), 0) };
    });
    return { income, expense, balance: income - expense, byCategory, monthlyData };
  }, [transactions, toBase]);

  const calData = useMemo(() => {
    const { year, month } = calMonth;
    const days = daysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const txByDay = {};
    transactions.filter(t => t.date.startsWith(key)).forEach(t => {
      const day = parseInt(t.date.split("-")[2]);
      if (!txByDay[day]) txByDay[day] = { income: 0, expense: 0, txs: [] };
      const amt = toBase(t.amount, t.currency);
      if (t.type === "income") txByDay[day].income += amt; else txByDay[day].expense += amt;
      txByDay[day].txs.push(t);
    });
    return { days, firstDay, txByDay };
  }, [calMonth, transactions, toBase]);

  const filteredTx = useMemo(() => transactions.filter(t => {
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (filterAcc !== "all" && t.account !== filterAcc) return false;
    if (searchQ && !t.note.toLowerCase().includes(searchQ.toLowerCase()) && !getCat(t.category).label.includes(searchQ)) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date)), [transactions, filterCat, filterAcc, searchQ]);

  const saveTx = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) return showToast("请输入有效金额", "error");
    const amount = parseFloat(form.amount);
    if (editTx) { setTransactions(ts => ts.map(t => t.id === editTx.id ? { ...t, ...form, amount } : t)); showToast("记录已更新 ✓"); }
    else { setTransactions(ts => [{ id: Date.now(), ...form, amount }, ...ts]); showToast("记录已添加 ✓"); }
    setShowAddModal(false); setEditTx(null);
    setForm({ amount: "", currency: "SGD", category: "food", account: "cash", date: new Date().toISOString().slice(0, 10), note: "", type: "expense" });
  };

  const deleteTx = id => { setTransactions(ts => ts.filter(t => t.id !== id)); showToast("已删除"); };
  const openEdit = tx => { setEditTx(tx); setForm({ amount: String(tx.amount), currency: tx.currency, category: tx.category, account: tx.account, date: tx.date, note: tx.note, type: tx.type }); setShowAddModal(true); };
  const openAddRecurring = () => { setEditRecurring(null); setRecurringForm({ label: "", amount: "", currency: "SGD", category: "utilities", account: "debit", day: 1 }); setShowRecurringModal(true); };
  const openEditRecurring = r => { setEditRecurring(r); setRecurringForm({ label: r.label, amount: String(r.amount), currency: r.currency, category: r.category, account: r.account, day: r.day }); setShowRecurringModal(true); };
  const saveRecurring = () => {
    if (!recurringForm.label) return showToast("请填写名称", "error");
    if (!recurringForm.amount || isNaN(parseFloat(recurringForm.amount))) return showToast("请输入有效金额", "error");
    const entry = { ...recurringForm, amount: parseFloat(recurringForm.amount) };
    if (editRecurring) { setRecurringRules(rs => rs.map(r => r.id === editRecurring.id ? { ...r, ...entry } : r)); showToast("已更新 ✓"); }
    else { setRecurringRules(rs => [...rs, { id: Date.now(), ...entry }]); showToast("已添加 ✓"); }
    setShowRecurringModal(false);
  };
  const deleteRecurring = id => { setRecurringRules(rs => rs.filter(r => r.id !== id)); showToast("已删除"); };
  const applyRecurring = r => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;
    setTransactions(ts => [{ id: Date.now(), type: "expense", amount: r.amount, currency: r.currency, category: r.category, account: r.account, date, note: r.label }, ...ts]);
    showToast(`已记入「${r.label}」✓`);
  };

  const fmtBase = n => fmt(n, baseCurrency);

  // ── Light theme styles ──────────────────────────────────────────────────────
  const S = {
    app: { fontFamily: "'DM Sans', 'Noto Sans SC', sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#1e293b", maxWidth: 420, margin: "0 auto" },
    header: { background: "#fff", padding: "20px 20px 0", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px #0000000a" },
    headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    logo: { fontSize: 18, fontWeight: 700, color: "#6366f1" },
    tab: a => ({ flex: 1, padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 600, cursor: "pointer", color: a ? "#6366f1" : "#94a3b8", background: "none", border: "none", borderBottom: a ? "2px solid #6366f1" : "2px solid transparent", letterSpacing: "0.3px" }),
    card: { background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px #0000000a" },
    heroCard: { background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", borderRadius: 20, padding: 20, color: "#fff" },
    section: { padding: "16px 16px 0" },
    label: { fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 },
    sm: { fontSize: 12, color: "#94a3b8" },
    pill: color => ({ background: color + "18", color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }),
    iconBox: color => ({ width: 38, height: 38, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }),
    input: { width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", color: "#1e293b", fontSize: 14, outline: "none", boxSizing: "border-box" },
    select: { width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", color: "#1e293b", fontSize: 14, outline: "none", boxSizing: "border-box" },
    btn: (color = "#6366f1") => ({ background: color, color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }),
    modal: { position: "fixed", inset: 0, background: "#0006", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" },
    modalContent: { background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxWidth: 420, maxHeight: "92vh", overflowY: "auto" },
    toast: type => ({ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#22c55e", color: "#fff", padding: "9px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 4px 20px #0003" }),
  };

  // ── Dashboard ───────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div style={{ paddingBottom: 100 }}>
      {/* Hero balance card */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.heroCard}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, letterSpacing: "0.5px" }}>本月净收支</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", marginBottom: 12 }}>
            {stats.balance >= 0 ? "+" : ""}{fmtBase(stats.balance)}
          </div>
          <div style={{ display: "flex", gap: 0, background: "#ffffff22", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ flex: 1, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>收入</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{fmtBase(stats.income)}</div>
            </div>
            <div style={{ width: 1, background: "#ffffff33" }} />
            <div style={{ flex: 1, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>支出</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{fmtBase(stats.expense)}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 10, textAlign: "center" }}>
            {ratesUpdated ? `✅ 汇率已更新 ${ratesUpdated.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} · ${rateSource}` : "⏳ 正在获取实时汇率..."}
          </div>
        </div>
      </div>

      {/* Quick rates */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>实时汇率 （1 {baseCurrency} =）</div>
        <div style={{ ...S.card, display: "flex", gap: 0 }}>
          {["MYR", "USD", "CNY", "JPY"].map((code, i) => {
            const cur = getCur(code);
            return (
              <div key={code} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRight: i < 3 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ fontSize: 18 }}>{cur.flag}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{code}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginTop: 2 }}>{fromBase(1, code).toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>本月支出分类</div>
        <div style={S.card}>
          {stats.byCategory.length === 0
            ? <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0", fontSize: 13 }}>本月暂无支出记录</div>
            : <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <PieChart data={stats.byCategory} size={110} />
                <div style={{ flex: 1 }}>
                  {stats.byCategory.slice(0, 5).map(cat => (
                    <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#475569" }}>{cat.icon} {cat.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{fmtBase(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>近6个月趋势</div>
        <div style={S.card}>
          <BarChart data={stats.monthlyData} height={90} />
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: 2 }} /><span style={S.sm}>收入</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, background: "#f97316", borderRadius: 2 }} /><span style={S.sm}>支出</span></div>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.label}>预算状态</div>
          <button onClick={() => setShowBudgetModal(true)} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>设置</button>
        </div>
        {CATEGORIES.filter(c => budgets[c.id]).map(cat => {
          const spent = stats.byCategory.find(b => b.id === cat.id)?.value || 0;
          const budget = budgets[cat.id]; const pct = Math.min((spent / budget) * 100, 100); const over = spent > budget;
          return (
            <div key={cat.id} style={{ ...S.card, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#334155" }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: 12, color: over ? "#ef4444" : "#94a3b8", fontWeight: over ? 600 : 400 }}>{fmtBase(spent)} / {fmtBase(budget)}{over && " ⚠️"}</span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#22c55e", borderRadius: 3, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>最近记录</div>
        <div style={S.card}>
          {transactions.slice(0, 5).map((tx, i) => {
            const cat = getCat(tx.category);
            return (
              <div key={tx.id} onClick={() => openEdit(tx)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none", cursor: "pointer" }}>
                <div style={S.iconBox(cat.color)}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || cat.label}</div>
                  <div style={{ ...S.sm, marginTop: 2 }}>{tx.date} · {getAcc(tx.account).icon}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "income" ? "#16a34a" : "#dc2626" }}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                  </div>
                  {tx.currency !== baseCurrency && <div style={S.sm}>≈ {fmtBase(toBase(tx.amount, tx.currency))}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Records ─────────────────────────────────────────────────────────────────
  const Records = () => (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexDirection: "column" }}>
        <input style={S.input} placeholder="🔍 搜索备注或分类..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {[{ id: "all", icon: "📋", label: "全部" }, ...CATEGORIES].map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ background: filterCat === c.id ? "#6366f1" : "#fff", border: "1.5px solid", borderColor: filterCat === c.id ? "#6366f1" : "#e2e8f0", borderRadius: 20, padding: "4px 12px", cursor: "pointer", color: filterCat === c.id ? "#fff" : "#64748b", fontSize: 11, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[{ id: "all", icon: "💼", label: "全部" }, ...ACCOUNTS].map(a => (
            <button key={a.id} onClick={() => setFilterAcc(a.id)} style={{ background: filterAcc === a.id ? "#0ea5e9" : "#fff", border: "1.5px solid", borderColor: filterAcc === a.id ? "#0ea5e9" : "#e2e8f0", borderRadius: 20, padding: "4px 12px", cursor: "pointer", color: filterAcc === a.id ? "#fff" : "#64748b", fontSize: 11, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        {filteredTx.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>没有找到记录</div>}
        {filteredTx.map(tx => {
          const cat = getCat(tx.category);
          return (
            <div key={tx.id} style={{ ...S.card, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={S.iconBox(cat.color)}>{cat.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || cat.label}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                  <span style={S.sm}>{tx.date}</span>
                  <span style={S.pill(cat.color)}>{cat.label}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === "income" ? "#16a34a" : "#dc2626" }}>
                  {tx.type === "income" ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                </div>
                {tx.currency !== baseCurrency && <div style={S.sm}>≈ {fmtBase(toBase(tx.amount, tx.currency))}</div>}
                <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(tx)} style={{ background: "#f1f5f9", border: "none", color: "#6366f1", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>编辑</button>
                  <button onClick={() => deleteTx(tx.id)} style={{ background: "#fef2f2", border: "none", color: "#ef4444", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>删除</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Calendar ────────────────────────────────────────────────────────────────
  const Calendar = () => {
    const { days, firstDay, txByDay } = calData;
    const { year, month } = calMonth;
    const [selectedDay, setSelectedDay] = useState(null);
    const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: "#f1f5f9", border: "none", color: "#475569", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 600 }}>◀</button>
            <span style={{ fontWeight: 700, fontSize: 17, color: "#1e293b" }}>{year}年 {monthNames[month]}</span>
            <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: "#f1f5f9", border: "none", color: "#475569", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 600 }}>▶</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
            {["日","一","二","三","四","五","六"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", padding: "4px 0", fontWeight: 600 }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map(day => {
              const data = txByDay[day]; const isSel = selectedDay === day;
              return (
                <div key={day} onClick={() => setSelectedDay(isSel ? null : day)}
                  style={{ background: isSel ? "#6366f1" : "#fff", borderRadius: 10, padding: "5px 2px", textAlign: "center", cursor: "pointer", border: "1.5px solid", borderColor: isSel ? "#6366f1" : "#e2e8f0", minHeight: 46 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? "#fff" : "#1e293b" }}>{day}</div>
                  {data && <>
                    {data.income > 0 && <div style={{ fontSize: 9, color: isSel ? "#bbf7d0" : "#16a34a", lineHeight: 1.3 }}>+{data.income.toFixed(0)}</div>}
                    {data.expense > 0 && <div style={{ fontSize: 9, color: isSel ? "#fecaca" : "#dc2626", lineHeight: 1.3 }}>-{data.expense.toFixed(0)}</div>}
                  </>}
                </div>
              );
            })}
          </div>
        </div>
        {selectedDay && txByDay[selectedDay] && (
          <div style={{ padding: "0 16px" }}>
            <div style={S.label}>{month + 1}月{selectedDay}日</div>
            {txByDay[selectedDay].txs.map(tx => {
              const cat = getCat(tx.category);
              return (
                <div key={tx.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={S.iconBox(cat.color)}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{tx.note || cat.label}</div>
                    <div style={S.sm}>{getAcc(tx.account).icon} {getAcc(tx.account).label}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: tx.type === "income" ? "#16a34a" : "#dc2626" }}>{tx.type === "income" ? "+" : "-"}{fmt(tx.amount, tx.currency)}</div>
                    {tx.currency !== baseCurrency && <div style={S.sm}>≈ {fmtBase(toBase(tx.amount, tx.currency))}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Settings ────────────────────────────────────────────────────────────────
  const Settings = () => (
    <div style={{ padding: "16px", paddingBottom: 100 }}>
      <div style={S.label}>基准货币</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setBaseCurrency(c.code)} style={{ background: baseCurrency === c.code ? "#6366f1" : "#f8fafc", border: "1.5px solid", borderColor: baseCurrency === c.code ? "#6366f1" : "#e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: baseCurrency === c.code ? "#fff" : "#475569", fontSize: 13, fontWeight: 600 }}>
              {c.flag} {c.code}
            </button>
          ))}
        </div>
      </div>

      <div style={S.label}>实时汇率（相对 {baseCurrency}）</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 12, marginBottom: 10, color: ratesUpdated ? "#16a34a" : "#f59e0b", fontWeight: 600 }}>
          {ratesUpdated ? `✅ ${rateSource} · ${ratesUpdated.toLocaleString("zh-CN")}` : "⏳ 获取中..."}
        </div>
        {CURRENCIES.filter(c => c.code !== baseCurrency).map(c => (
          <div key={c.code} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, color: "#334155" }}>{c.flag} {c.code} · {c.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>{fromBase(1, c.code).toFixed(["JPY","IDR"].includes(c.code) ? 1 : 4)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={S.label}>定期账单</div>
        <button onClick={openAddRecurring} style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ 添加</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        {recurringRules.length === 0 && <div style={{ ...S.card, textAlign: "center", color: "#94a3b8", padding: 20, fontSize: 13 }}>还没有定期账单，点击「+ 添加」新建</div>}
        {recurringRules.map(r => (
          <div key={r.id} style={{ ...S.card, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={S.iconBox(getCat(r.category).color)}>{getCat(r.category).icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{r.label}</div>
              <div style={S.sm}>每月 {r.day} 日 · {getAcc(r.account).icon} {getAcc(r.account).label}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>-{fmt(r.amount, r.currency)}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
                <button onClick={() => applyRecurring(r)} style={{ background: "#f0fdf4", border: "none", color: "#16a34a", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>记入</button>
                <button onClick={() => openEditRecurring(r)} style={{ background: "#f1f5f9", border: "none", color: "#6366f1", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>编辑</button>
                <button onClick={() => deleteRecurring(r.id)} style={{ background: "#fef2f2", border: "none", color: "#ef4444", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={S.label}>数据导出</div>
      <div style={S.card}>
        <button onClick={() => {
          const headers = "日期,类型,金额,货币,换算基准货币,分类,账户,备注\n";
          const rows = transactions.map(t => `${t.date},${t.type},${t.amount},${t.currency},${toBase(t.amount, t.currency).toFixed(2)},${getCat(t.category).label},${getAcc(t.account).label},"${t.note}"`).join("\n");
          const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "记账数据.csv"; a.click();
          showToast("导出成功 ✓");
        }} style={S.btn("#22c55e")}>📥 导出 CSV</button>
      </div>
    </div>
  );

  // ── Modals ──────────────────────────────────────────────────────────────────
  const AddModal = () => {
    const converted = form.amount && !isNaN(parseFloat(form.amount)) && form.currency !== baseCurrency ? toBase(parseFloat(form.amount), form.currency) : null;
    return (
      <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setEditTx(null); } }}>
        <div style={S.modalContent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>{editTx ? "编辑记录" : "添加记录"}</div>
            <button onClick={() => { setShowAddModal(false); setEditTx(null); }} style={{ background: "#f1f5f9", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 16 }}>
            {["expense","income"].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, background: form.type === t ? (t === "expense" ? "#dc2626" : "#16a34a") : "none", border: "none", borderRadius: 9, padding: "9px 0", color: form.type === t ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                {t === "expense" ? "💸 支出" : "💰 收入"}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={S.label}>金额</div>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...S.select, width: 110, flexShrink: 0 }} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input style={S.input} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            {converted !== null && <div style={{ fontSize: 12, marginTop: 6, color: "#6366f1", fontWeight: 600 }}>≈ {fmtBase(converted)} {baseCurrency}（自动换算）</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={S.label}>日期</div>
            <input style={S.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={S.label}>分类</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))} style={{ background: form.category === cat.id ? cat.color + "20" : "#f8fafc", border: "1.5px solid", borderColor: form.category === cat.id ? cat.color : "#e2e8f0", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: form.category === cat.id ? cat.color : "#64748b", fontSize: 13, fontWeight: form.category === cat.id ? 600 : 400 }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={S.label}>账户</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ACCOUNTS.map(acc => (
                <button key={acc.id} onClick={() => setForm(f => ({ ...f, account: acc.id }))} style={{ background: form.account === acc.id ? "#6366f120" : "#f8fafc", border: "1.5px solid", borderColor: form.account === acc.id ? "#6366f1" : "#e2e8f0", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: form.account === acc.id ? "#6366f1" : "#64748b", fontSize: 13, fontWeight: form.account === acc.id ? 600 : 400 }}>
                  {acc.icon} {acc.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={S.label}>备注</div>
            <input style={S.input} placeholder="备注（可选）" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <button onClick={saveTx} style={S.btn(form.type === "expense" ? "#dc2626" : "#16a34a")}>{editTx ? "保存修改" : "添加记录"}</button>
        </div>
      </div>
    );
  };

  const BudgetModal = () => (
    <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) setShowBudgetModal(false); }}>
      <div style={S.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>设置月度预算</div>
          <button onClick={() => setShowBudgetModal(false)} style={{ background: "#f1f5f9", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {CATEGORIES.filter(c => !["salary","investment"].includes(c.id)).map(cat => (
          <div key={cat.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 4, color: "#475569" }}>{cat.icon} {cat.label}</div>
            <input style={S.input} type="number" placeholder="不设预算" value={budgets[cat.id] || ""} onChange={e => setBudgets(b => ({ ...b, [cat.id]: parseFloat(e.target.value) || 0 }))} />
          </div>
        ))}
        <button onClick={() => { setShowBudgetModal(false); showToast("预算已保存 ✓"); }} style={{ ...S.btn(), marginTop: 8 }}>保存预算</button>
      </div>
    </div>
  );

  const RecurringModal = () => (
    <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) setShowRecurringModal(false); }}>
      <div style={S.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>{editRecurring ? "编辑定期账单" : "添加定期账单"}</div>
          <button onClick={() => setShowRecurringModal(false)} style={{ background: "#f1f5f9", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>名称</div>
          <input style={S.input} placeholder="例如：房租、Netflix、手机费..." value={recurringForm.label} onChange={e => setRecurringForm(f => ({ ...f, label: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>金额</div>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...S.select, width: 110, flexShrink: 0 }} value={recurringForm.currency} onChange={e => setRecurringForm(f => ({ ...f, currency: e.target.value }))}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input style={S.input} type="number" step="0.01" min="0" placeholder="0.00" value={recurringForm.amount} onChange={e => setRecurringForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>每月扣款日</div>
          <select style={S.select} value={recurringForm.day} onChange={e => setRecurringForm(f => ({ ...f, day: parseInt(e.target.value) }))}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>每月 {d} 日</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>分类</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setRecurringForm(f => ({ ...f, category: cat.id }))} style={{ background: recurringForm.category === cat.id ? cat.color + "20" : "#f8fafc", border: "1.5px solid", borderColor: recurringForm.category === cat.id ? cat.color : "#e2e8f0", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: recurringForm.category === cat.id ? cat.color : "#64748b", fontSize: 13, fontWeight: recurringForm.category === cat.id ? 600 : 400 }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={S.label}>账户</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ACCOUNTS.map(acc => (
              <button key={acc.id} onClick={() => setRecurringForm(f => ({ ...f, account: acc.id }))} style={{ background: recurringForm.account === acc.id ? "#6366f120" : "#f8fafc", border: "1.5px solid", borderColor: recurringForm.account === acc.id ? "#6366f1" : "#e2e8f0", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: recurringForm.account === acc.id ? "#6366f1" : "#64748b", fontSize: 13, fontWeight: recurringForm.account === acc.id ? 600 : 400 }}>
                {acc.icon} {acc.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={saveRecurring} style={S.btn("#f97316")}>{editRecurring ? "保存修改" : "添加定期账单"}</button>
      </div>
    </div>
  );

  // ── Nav ─────────────────────────────────────────────────────────────────────
  const NAV = [
    { id: "dashboard", icon: "📊", label: "总览" },
    { id: "records",   icon: "📋", label: "记录" },
    { id: "calendar",  icon: "📅", label: "日历" },
    { id: "settings",  icon: "⚙️", label: "设置" },
  ];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.logo}>💱 MoneyFlow</div>
          <button onClick={() => { setShowAddModal(true); setEditTx(null); setForm({ amount: "", currency: "SGD", category: "food", account: "cash", date: new Date().toISOString().slice(0, 10), note: "", type: "expense" }); }}
            style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            + 记账
          </button>
        </div>
        <div style={{ display: "flex" }}>
          {NAV.map(n => <button key={n.id} style={S.tab(tab === n.id)} onClick={() => setTab(n.id)}>{n.icon} {n.label}</button>)}
        </div>
      </div>
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 100px)" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "records" && <Records />}
        {tab === "calendar" && <Calendar />}
        {tab === "settings" && <Settings />}
      </div>
      {showAddModal && <AddModal />}
      {showBudgetModal && <BudgetModal />}
      {showRecurringModal && <RecurringModal />}
      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
