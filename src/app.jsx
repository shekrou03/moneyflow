import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
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
  { id: "food",        icon: "🍜", label: "餐饮",   color: "#f97316" },
  { id: "transport",   icon: "🚌", label: "交通",   color: "#3b82f6" },
  { id: "shopping",    icon: "🛍️", label: "购物",   color: "#ec4899" },
  { id: "entertainment",icon:"🎮", label: "娱乐",   color: "#8b5cf6" },
  { id: "health",      icon: "💊", label: "医疗",   color: "#ef4444" },
  { id: "housing",     icon: "🏠", label: "住房",   color: "#14b8a6" },
  { id: "utilities",   icon: "💡", label: "水电",   color: "#f59e0b" },
  { id: "education",   icon: "📚", label: "教育",   color: "#6366f1" },
  { id: "salary",      icon: "💼", label: "工资",   color: "#22c55e" },
  { id: "investment",  icon: "📈", label: "投资",   color: "#10b981" },
  { id: "other",       icon: "📦", label: "其他",   color: "#6b7280" },
];

const ACCOUNTS = [
  { id: "cash",    icon: "💵", label: "现金" },
  { id: "debit",   icon: "💳", label: "储蓄卡" },
  { id: "credit",  icon: "🏦", label: "信用卡" },
  { id: "alipay",  icon: "🔵", label: "支付宝" },
  { id: "wechat",  icon: "🟢", label: "微信支付" },
  { id: "paynow",  icon: "🟣", label: "PayNow" },
];

const BASE_RATES = {
  SGD: 1, MYR: 3.52, USD: 0.74, CNY: 5.38, EUR: 0.69,
  JPY: 113.2, GBP: 0.59, AUD: 1.14, THB: 27.3, IDR: 11420,
};

const SAMPLE_DATA = [
  { id: 1, type: "expense", amount: 12.5,  currency: "SGD", category: "food",        account: "paynow",  date: "2025-05-10", note: "Maxwell hawker centre", amountSGD: 12.5 },
  { id: 2, type: "expense", amount: 35,    currency: "MYR", category: "food",        account: "cash",    date: "2025-05-09", note: "KL dim sum breakfast", amountSGD: 9.94 },
  { id: 3, type: "income",  amount: 4800,  currency: "SGD", category: "salary",      account: "debit",   date: "2025-05-07", note: "May salary", amountSGD: 4800 },
  { id: 4, type: "expense", amount: 1800,  currency: "SGD", category: "housing",     account: "debit",   date: "2025-05-01", note: "May rent", amountSGD: 1800 },
  { id: 5, type: "expense", amount: 2.2,   currency: "SGD", category: "transport",   account: "debit",   date: "2025-05-08", note: "MRT to work", amountSGD: 2.2 },
  { id: 6, type: "expense", amount: 180,   currency: "MYR", category: "shopping",    account: "credit",  date: "2025-05-06", note: "Pavilion KL", amountSGD: 51.1 },
  { id: 7, type: "expense", amount: 28.9,  currency: "SGD", category: "entertainment",account:"credit",  date: "2025-05-05", note: "Netflix + Spotify", amountSGD: 28.9 },
  { id: 8, type: "expense", amount: 50,    currency: "MYR", category: "transport",   account: "cash",    date: "2025-05-04", note: "Grab KL airport", amountSGD: 14.2 },
  { id: 9, type: "expense", amount: 15.8,  currency: "SGD", category: "food",        account: "paynow",  date: "2025-05-03", note: "Lunch at office", amountSGD: 15.8 },
  { id: 10,type: "expense", amount: 500,   currency: "MYR", category: "shopping",    account: "credit",  date: "2025-04-28", note: "JB grocery shopping", amountSGD: 142 },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmt = (n, currency = "SGD", rates = BASE_RATES) => {
  const c = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const val = typeof n === "number" ? n : 0;
  if (["JPY","IDR"].includes(currency)) return `${c.symbol}${Math.round(val).toLocaleString()}`;
  return `${c.symbol}${val.toFixed(2)}`;
};
const fmtSGD = n => `S$${(n || 0).toFixed(2)}`;
const getCat = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
const getAcc = id => ACCOUNTS.find(a => a.id === id) || ACCOUNTS[0];
const getCur = code => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

// ─── Miniature chart components ───────────────────────────────────────────────
function PieChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "#1e293b" }} />;
  let cumulative = 0;
  const slices = data.map(d => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });
  const r = 50, cx = 60, cy = 60;
  const polarToCart = (pct) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {slices.map((s, i) => {
        if (s.pct === 0) return null;
        if (s.pct >= 0.999) return <circle key={i} cx={cx} cy={cy} r={r} fill={s.color} />;
        const [x1, y1] = polarToCart(s.start);
        const [x2, y2] = polarToCart(s.start + s.pct);
        const large = s.pct > 0.5 ? 1 : 0;
        return (
          <path key={i}
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
            fill={s.color} stroke="#0f172a" strokeWidth="1.5"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={32} fill="#0f172a" />
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
          <span style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState(SAMPLE_DATA);
  const [rates, setRates] = useState(BASE_RATES);
  const [ratesUpdated, setRatesUpdated] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState("SGD");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState("expense");
  const [editTx, setEditTx] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterAcc, setFilterAcc] = useState("all");
  const [calMonth, setCalMonth] = useState({ year: 2025, month: 4 }); // 0-indexed month
  const [budgets, setBudgets] = useState({ food: 600, transport: 150, shopping: 400, entertainment: 100, health: 200, housing: 1900, utilities: 80, education: 100 });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [recurringRules, setRecurringRules] = useState([
    { id: 1, label: "房租", amount: 1800, currency: "SGD", category: "housing", account: "debit", day: 1 },
    { id: 2, label: "Netflix", amount: 15.98, currency: "SGD", category: "entertainment", account: "credit", day: 5 },
  ]);
  const [toast, setToast] = useState(null);

  // Form state
  const [form, setForm] = useState({ amount: "", currency: "SGD", category: "food", account: "cash", date: new Date().toISOString().slice(0, 10), note: "", type: "expense" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Fetch real exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${CURRENCIES.map(c => c.code).filter(c => c !== baseCurrency).join(",")}`);
        const data = await res.json();
        const newRates = { [baseCurrency]: 1 };
        Object.entries(data.rates).forEach(([code, rate]) => { newRates[code] = rate; });
        setRates(newRates);
        setRatesUpdated(new Date());
        showToast("汇率已更新 ✓");
      } catch {
        showToast("使用离线汇率", "warn");
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [baseCurrency]);

  const toBase = useCallback((amount, currency) => {
    if (currency === baseCurrency) return amount;
    const fromRate = rates[currency] || BASE_RATES[currency] || 1;
    return amount / fromRate;
  }, [rates, baseCurrency]);

  const fromBase = useCallback((amount, currency) => {
    if (currency === baseCurrency) return amount;
    const toRate = rates[currency] || BASE_RATES[currency] || 1;
    return amount * toRate;
  }, [rates, baseCurrency]);

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = (() => { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();

    const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));
    const lastMonthTx = transactions.filter(t => t.date.startsWith(lastMonth));

    const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + toBase(t.amount, t.currency), 0);
    const expense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + toBase(t.amount, t.currency), 0);
    const lastExpense = lastMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + toBase(t.amount, t.currency), 0);

    const byCategory = CATEGORIES.map(cat => ({
      ...cat,
      value: monthTx.filter(t => t.type === "expense" && t.category === cat.id).reduce((s, t) => s + toBase(t.amount, t.currency), 0),
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const txs = transactions.filter(t => t.date.startsWith(key));
      return {
        label: `${d.getMonth() + 1}月`,
        income: txs.filter(t => t.type === "income").reduce((s, t) => s + toBase(t.amount, t.currency), 0),
        expense: txs.filter(t => t.type === "expense").reduce((s, t) => s + toBase(t.amount, t.currency), 0),
      };
    });

    return { income, expense, balance: income - expense, lastExpense, byCategory, monthlyData, thisMonth };
  }, [transactions, toBase]);

  // Calendar data
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
      if (t.type === "income") txByDay[day].income += amt;
      else txByDay[day].expense += amt;
      txByDay[day].txs.push(t);
    });
    return { days, firstDay, txByDay };
  }, [calMonth, transactions, toBase]);

  // Filtered transactions
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (filterAcc !== "all" && t.account !== filterAcc) return false;
      if (searchQ && !t.note.toLowerCase().includes(searchQ.toLowerCase()) && !getCat(t.category).label.includes(searchQ)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterCat, filterAcc, searchQ]);

  const saveTx = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) return showToast("请输入有效金额", "error");
    const amount = parseFloat(form.amount);
    const amountBase = toBase(amount, form.currency);
    if (editTx) {
      setTransactions(ts => ts.map(t => t.id === editTx.id ? { ...t, ...form, amount, amountSGD: amountBase } : t));
      showToast("记录已更新");
    } else {
      const newTx = { id: Date.now(), ...form, amount, amountSGD: amountBase };
      setTransactions(ts => [newTx, ...ts]);
      showToast("记录已添加 ✓");
    }
    setShowAddModal(false);
    setEditTx(null);
    setForm({ amount: "", currency: "SGD", category: "food", account: "cash", date: new Date().toISOString().slice(0, 10), note: "", type: "expense" });
  };

  const deleteTx = (id) => {
    setTransactions(ts => ts.filter(t => t.id !== id));
    showToast("已删除");
  };

  const openEdit = (tx) => {
    setEditTx(tx);
    setForm({ amount: String(tx.amount), currency: tx.currency, category: tx.category, account: tx.account, date: tx.date, note: tx.note, type: tx.type });
    setShowAddModal(true);
  };

  const baseCur = getCur(baseCurrency);

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    app: { fontFamily: "'DM Sans', 'Noto Sans SC', sans-serif", background: "#0a0f1e", minHeight: "100vh", color: "#e2e8f0", maxWidth: 420, margin: "0 auto", position: "relative", overflow: "hidden" },
    header: { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", padding: "20px 20px 0", borderBottom: "1px solid #1e293b" },
    headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    logo: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    tabs: { display: "flex", gap: 0 },
    tab: (active) => ({ flex: 1, padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 600, cursor: "pointer", color: active ? "#818cf8" : "#475569", borderBottom: active ? "2px solid #818cf8" : "2px solid transparent", transition: "all 0.2s", background: "none", border: "none", borderBottom: active ? "2px solid #818cf8" : "2px solid transparent", letterSpacing: "0.5px" }),
    card: { background: "#0f1629", borderRadius: 16, padding: 16, border: "1px solid #1e293b" },
    statCard: { background: "linear-gradient(135deg, #1e1b4b, #0f172a)", borderRadius: 16, padding: 16, border: "1px solid #2d1b69" },
    section: { padding: "16px 16px 0" },
    label: { fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 },
    bigNum: { fontSize: 28, fontWeight: 700, letterSpacing: "-1px" },
    sm: { fontSize: 12, color: "#64748b" },
    pill: (color) => ({ background: color + "22", color, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }),
    txRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1e293b11" },
    iconBox: (color) => ({ width: 36, height: 36, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }),
    input: { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    select: { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", cursor: "pointer" },
    btn: (color = "#818cf8") => ({ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }),
    modal: { position: "fixed", inset: 0, background: "#000a", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" },
    modalContent: { background: "#0f1629", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", border: "1px solid #1e293b" },
    fab: { position: "fixed", bottom: 80, right: "calc(50% - 210px + 16px)", width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #818cf8, #34d399)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", boxShadow: "0 8px 24px #818cf844", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
    navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "#0f1629", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 40 },
    navBtn: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", color: active ? "#818cf8" : "#475569", cursor: "pointer", padding: "4px 16px", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px" }),
    toastStyle: (type) => ({ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#22c55e", color: "#fff", padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 4px 20px #0008" }),
  };

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div style={{ paddingBottom: 100 }}>
      {/* Balance Hero */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={{ ...S.statCard, textAlign: "center" }}>
          <div style={{ ...S.label, marginBottom: 4 }}>本月净收支</div>
          <div style={{ ...S.bigNum, color: stats.balance >= 0 ? "#34d399" : "#f87171" }}>
            {fmtSGD(stats.balance)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
            <div>
              <div style={S.sm}>收入</div>
              <div style={{ color: "#34d399", fontWeight: 700, fontSize: 16 }}>{fmtSGD(stats.income)}</div>
            </div>
            <div style={{ width: 1, background: "#1e293b" }} />
            <div>
              <div style={S.sm}>支出</div>
              <div style={{ color: "#f97316", fontWeight: 700, fontSize: 16 }}>{fmtSGD(stats.expense)}</div>
            </div>
          </div>
          <div style={{ ...S.sm, marginTop: 10 }}>
            {ratesUpdated ? `汇率更新于 ${ratesUpdated.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : "加载汇率中..."}
            {" · "}基准货币 {baseCur.flag} {baseCurrency}
          </div>
        </div>
      </div>

      {/* Quick currency converter */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>快速汇率换算</div>
        <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "center" }}>
          {["MYR", "USD", "CNY", "JPY"].map(code => {
            const cur = getCur(code);
            const rate = fromBase(1, code);
            return (
              <div key={code} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{cur.flag}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{code}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{rate.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...S.sm, textAlign: "center", marginTop: 6 }}>以上为 1 {baseCurrency} 等值</div>
      </div>

      {/* Category breakdown */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>本月支出分类</div>
        <div style={{ ...S.card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <PieChart data={stats.byCategory} size={110} />
            <div style={{ flex: 1 }}>
              {stats.byCategory.slice(0, 5).map(cat => (
                <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color }} />
                    <span style={{ fontSize: 12 }}>{cat.icon} {cat.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{fmtSGD(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6-month bar chart */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>近6个月趋势</div>
        <div style={S.card}>
          <BarChart data={stats.monthlyData} height={90} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: 2 }} /><span style={S.sm}>收入</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, background: "#f97316", borderRadius: 2 }} /><span style={S.sm}>支出</span></div>
          </div>
        </div>
      </div>

      {/* Budget warnings */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.label}>预算状态</div>
          <button onClick={() => setShowBudgetModal(true)} style={{ background: "none", border: "none", color: "#818cf8", fontSize: 12, cursor: "pointer" }}>设置</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CATEGORIES.filter(c => budgets[c.id]).map(cat => {
            const spent = stats.byCategory.find(b => b.id === cat.id)?.value || 0;
            const budget = budgets[cat.id];
            const pct = Math.min((spent / budget) * 100, 100);
            const over = spent > budget;
            return (
              <div key={cat.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{cat.icon} {cat.label}</span>
                  <span style={{ fontSize: 12, color: over ? "#f87171" : "#64748b" }}>
                    {fmtSGD(spent)} / {fmtSGD(budget)}
                    {over && " ⚠️"}
                  </span>
                </div>
                <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#34d399", borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ ...S.section, paddingBottom: 16 }}>
        <div style={S.label}>最近记录</div>
        <div style={S.card}>
          {transactions.slice(0, 5).map(tx => {
            const cat = getCat(tx.category);
            const isBase = tx.currency === baseCurrency;
            return (
              <div key={tx.id} style={S.txRow} onClick={() => openEdit(tx)}>
                <div style={S.iconBox(cat.color)}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || cat.label}</div>
                  <div style={S.sm}>{tx.date} · {getAcc(tx.account).icon} {getAcc(tx.account).label}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "income" ? "#34d399" : "#f97316" }}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                  </div>
                  {!isBase && <div style={S.sm}>≈ {fmtSGD(toBase(tx.amount, tx.currency))}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─── Records ───────────────────────────────────────────────────────────────
  const Records = () => (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexDirection: "column" }}>
        <input style={S.input} placeholder="🔍 搜索备注或分类..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {[{ id: "all", icon: "📋", label: "全部" }, ...CATEGORIES].map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              style={{ ...S.pill(filterCat === c.id ? "#818cf8" : "#475569"), cursor: "pointer", border: "none", flexShrink: 0, padding: "4px 10px", background: filterCat === c.id ? "#818cf822" : "#1e293b" }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[{ id: "all", icon: "💼", label: "全部账户" }, ...ACCOUNTS].map(a => (
            <button key={a.id} onClick={() => setFilterAcc(a.id)}
              style={{ ...S.pill(filterAcc === a.id ? "#34d399" : "#475569"), cursor: "pointer", border: "none", flexShrink: 0, padding: "4px 10px", background: filterAcc === a.id ? "#34d39922" : "#1e293b" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        {filteredTx.length === 0 && <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>没有找到记录</div>}
        {filteredTx.map(tx => {
          const cat = getCat(tx.category);
          const isBase = tx.currency === baseCurrency;
          return (
            <div key={tx.id} style={{ ...S.card, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={S.iconBox(cat.color)}>{cat.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || cat.label}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                  <span style={S.sm}>{tx.date}</span>
                  <span style={S.pill(getCat(tx.category).color)}>{cat.icon} {cat.label}</span>
                  <span style={{ ...S.sm, color: "#64748b" }}>{getAcc(tx.account).icon}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === "income" ? "#34d399" : "#f97316" }}>
                  {tx.type === "income" ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                </div>
                {!isBase && <div style={S.sm}>≈ {fmt(toBase(tx.amount, tx.currency), baseCurrency)}</div>}
                <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(tx)} style={{ background: "#1e293b", border: "none", color: "#818cf8", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>编辑</button>
                  <button onClick={() => deleteTx(tx.id)} style={{ background: "#1e293b", border: "none", color: "#f87171", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>删除</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Calendar ──────────────────────────────────────────────────────────────
  const Calendar = () => {
    const { days, firstDay, txByDay } = calData;
    const { year, month } = calMonth;
    const [selectedDay, setSelectedDay] = useState(null);
    const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
    const dayNames = ["日","一","二","三","四","五","六"];
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              style={{ background: "#1e293b", border: "none", color: "#e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>◀</button>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{year}年 {monthNames[month]}</span>
            <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              style={{ background: "#1e293b", border: "none", color: "#e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>▶</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {dayNames.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#475569", padding: "4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {blanks.map(i => <div key={`b${i}`} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map(day => {
              const data = txByDay[day];
              const isSelected = selectedDay === day;
              return (
                <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  style={{ background: isSelected ? "#818cf833" : "#0f1629", borderRadius: 8, padding: "4px 2px", textAlign: "center", cursor: "pointer", border: isSelected ? "1px solid #818cf8" : "1px solid #1e293b", minHeight: 44 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#818cf8" : "#e2e8f0" }}>{day}</div>
                  {data && (
                    <>
                      {data.income > 0 && <div style={{ fontSize: 9, color: "#34d399", lineHeight: 1.2 }}>+{data.income.toFixed(0)}</div>}
                      {data.expense > 0 && <div style={{ fontSize: 9, color: "#f97316", lineHeight: 1.2 }}>-{data.expense.toFixed(0)}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {selectedDay && txByDay[selectedDay] && (
          <div style={{ padding: "0 16px" }}>
            <div style={S.label}>{month + 1}月{selectedDay}日 的记录</div>
            {txByDay[selectedDay].txs.map(tx => {
              const cat = getCat(tx.category);
              return (
                <div key={tx.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={S.iconBox(cat.color)}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.note || cat.label}</div>
                    <div style={S.sm}>{getAcc(tx.account).icon} {getAcc(tx.account).label}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: tx.type === "income" ? "#34d399" : "#f97316" }}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                    {tx.currency !== baseCurrency && <div style={S.sm}>≈ {fmtSGD(toBase(tx.amount, tx.currency))}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Settings ──────────────────────────────────────────────────────────────
  const Settings = () => (
    <div style={{ padding: "16px", paddingBottom: 100 }}>
      <div style={S.label}>基准货币</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setBaseCurrency(c.code)}
              style={{ background: baseCurrency === c.code ? "#818cf833" : "#1e293b", border: baseCurrency === c.code ? "1px solid #818cf8" : "1px solid #334155", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: baseCurrency === c.code ? "#818cf8" : "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
              {c.flag} {c.code}
            </button>
          ))}
        </div>
      </div>

      <div style={S.label}>实时汇率（相对 {baseCurrency}）</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        {CURRENCIES.filter(c => c.code !== baseCurrency).map(c => (
          <div key={c.code} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
            <span style={{ fontSize: 13 }}>{c.flag} {c.code} · {c.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>
              {fromBase(1, c.code).toFixed(c.code === "JPY" || c.code === "IDR" ? 1 : 4)}
            </span>
          </div>
        ))}
        <div style={{ ...S.sm, marginTop: 8, textAlign: "center" }}>
          {ratesUpdated ? `最后更新: ${ratesUpdated.toLocaleString("zh-CN")}` : "更新中..."}
        </div>
      </div>

      <div style={S.label}>定期账单</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        {recurringRules.map(r => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
              <div style={S.sm}>每月 {r.day} 日 · {getAcc(r.account).icon} {getAcc(r.account).label}</div>
            </div>
            <div style={{ color: "#f97316", fontWeight: 700 }}>-{fmt(r.amount, r.currency)}</div>
          </div>
        ))}
        <div style={S.sm}>定期账单将在每月指定日自动添加至记录</div>
      </div>

      <div style={S.label}>数据导出</div>
      <div style={S.card}>
        <button onClick={() => {
          const headers = "日期,类型,金额,货币,换算SGD,分类,账户,备注\n";
          const rows = transactions.map(t => `${t.date},${t.type},${t.amount},${t.currency},${toBase(t.amount, t.currency).toFixed(2)},${getCat(t.category).label},${getAcc(t.account).label},"${t.note}"`).join("\n");
          const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "记账数据.csv"; a.click();
          showToast("导出成功 ✓");
        }} style={{ ...S.btn("#34d399"), marginBottom: 8 }}>📥 导出 CSV</button>
        <div style={{ ...S.sm, textAlign: "center" }}>导出所有记录为 CSV 文件，可在 Excel 中打开</div>
      </div>
    </div>
  );

  // ─── Add/Edit Modal ────────────────────────────────────────────────────────
  const AddModal = () => {
    const convertedAmount = form.amount && !isNaN(parseFloat(form.amount)) && form.currency !== baseCurrency
      ? toBase(parseFloat(form.amount), form.currency)
      : null;

    return (
      <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setEditTx(null); } }}>
        <div style={S.modalContent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{editTx ? "编辑记录" : "添加记录"}</div>
            <button onClick={() => { setShowAddModal(false); setEditTx(null); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer" }}>×</button>
          </div>

          {/* Type toggle */}
          <div style={{ display: "flex", gap: 0, background: "#1e293b", borderRadius: 10, padding: 3, marginBottom: 14 }}>
            {["expense", "income"].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                style={{ flex: 1, background: form.type === t ? (t === "expense" ? "#f97316" : "#22c55e") : "none", border: "none", borderRadius: 8, padding: "8px 0", color: form.type === t ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s" }}>
                {t === "expense" ? "💸 支出" : "💰 收入"}
              </button>
            ))}
          </div>

          {/* Amount + Currency */}
          <div style={{ marginBottom: 12 }}>
            <div style={S.label}>金额</div>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...S.select, width: 110, flexShrink: 0 }} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input style={S.input} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            {convertedAmount !== null && (
              <div style={{ ...S.sm, marginTop: 6, color: "#818cf8" }}>
                ≈ {fmt(convertedAmount, baseCurrency)} {baseCurrency}（自动换算）
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ marginBottom: 12 }}>
            <div style={S.label}>日期</div>
            <input style={S.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 12 }}>
            <div style={S.label}>分类</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                  style={{ background: form.category === cat.id ? cat.color + "33" : "#1e293b", border: form.category === cat.id ? `1.5px solid ${cat.color}` : "1px solid #334155", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: form.category === cat.id ? cat.color : "#94a3b8", fontSize: 13, transition: "all 0.15s" }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <div style={{ marginBottom: 12 }}>
            <div style={S.label}>账户</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ACCOUNTS.map(acc => (
                <button key={acc.id} onClick={() => setForm(f => ({ ...f, account: acc.id }))}
                  style={{ background: form.account === acc.id ? "#818cf833" : "#1e293b", border: form.account === acc.id ? "1.5px solid #818cf8" : "1px solid #334155", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: form.account === acc.id ? "#818cf8" : "#94a3b8", fontSize: 13 }}>
                  {acc.icon} {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <div style={S.label}>备注</div>
            <input style={S.input} placeholder="备注（可选）" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>

          <button onClick={saveTx} style={S.btn(form.type === "expense" ? "#f97316" : "#22c55e")}>
            {editTx ? "保存修改" : "添加记录"}
          </button>
        </div>
      </div>
    );
  };

  // ─── Budget Modal ──────────────────────────────────────────────────────────
  const BudgetModal = () => (
    <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) setShowBudgetModal(false); }}>
      <div style={S.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>设置月度预算</div>
          <button onClick={() => setShowBudgetModal(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {CATEGORIES.filter(c => !["salary","investment"].includes(c.id)).map(cat => (
          <div key={cat.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>{cat.icon} {cat.label}</div>
            <input style={{ ...S.input }} type="number" placeholder="不设预算" value={budgets[cat.id] || ""} onChange={e => setBudgets(b => ({ ...b, [cat.id]: parseFloat(e.target.value) || 0 }))} />
          </div>
        ))}
        <button onClick={() => { setShowBudgetModal(false); showToast("预算已保存 ✓"); }} style={S.btn()}>保存预算</button>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  const NAV = [
    { id: "dashboard", icon: "📊", label: "总览" },
    { id: "records",   icon: "📋", label: "记录" },
    { id: "calendar",  icon: "📅", label: "日历" },
    { id: "settings",  icon: "⚙️", label: "设置" },
  ];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.logo}>💱 MoneyFlow</div>
          <button onClick={() => { setShowAddModal(true); setEditTx(null); setForm({ amount: "", currency: "SGD", category: "food", account: "cash", date: new Date().toISOString().slice(0, 10), note: "", type: "expense" }); }}
            style={{ background: "linear-gradient(135deg, #818cf8, #34d399)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            + 记账
          </button>
        </div>
        <div style={S.tabs}>
          {NAV.map(n => <button key={n.id} style={S.tab(tab === n.id)} onClick={() => setTab(n.id)}>{n.icon} {n.label}</button>)}
        </div>
      </div>

      {/* Content */}
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 100px)" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "records" && <Records />}
        {tab === "calendar" && <Calendar />}
        {tab === "settings" && <Settings />}
      </div>

      {/* Modals */}
      {showAddModal && <AddModal />}
      {showBudgetModal && <BudgetModal />}

      {/* Toast */}
      {toast && <div style={S.toastStyle(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
