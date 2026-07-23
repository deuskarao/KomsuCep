import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard({ setCurrentPage }) {
  const { apt, transactions, announcements, requests } = useApt();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const formatMoney = (n) => Number(n).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

  // Calculate stats
  const now = new Date();
  const thisMonthTxs = transactions.filter(t => {
    const d = new Date(t.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const kasa = totalIncome - totalExpense;

  // Graph Data (Group by Day for current month)
  const graphData = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const dayTxs = thisMonthTxs.filter(t => new Date(t.createdAt).getDate() === i);
    const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    graphData.push({ day: `${i} ${now.toLocaleString('tr-TR', { month: 'short' })}`, Gelir: inc, Gider: exp });
  }

  // Filter requests (hide completed if > 3 days old)
  const visibleRequests = requests.filter(r => {
    if (r.status !== 'completed' || !r.completedAt) return true;
    const completedDate = new Date(r.completedAt);
    const diffTime = Math.abs(now - completedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  // Filter announcements
  const visibleAnnouncements = announcements.filter(a => {
    if (!a.duration) return true;
    const expiry = new Date(a.createdAt);
    expiry.setDate(expiry.getDate() + Number(a.duration));
    return now <= expiry;
  });

  // Calculate expenses by category for this month
  const predefinedExpenseCategories = ['Tamirat', 'Bakım', 'Temizlik'];
  const expensesByCategory = {};
  predefinedExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);

  thisMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Tamirat';
    if (expensesByCategory[cat] !== undefined) {
      expensesByCategory[cat] += Number(t.amount);
    }
  });
  // Sort primarily by amount (desc), secondarily by name
  const categoryEntries = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--g900)' }}>Merhaba, {currentUser?.name}</h2>
          <p style={{ color: 'var(--g500)' }}>İşte {apt?.name} apartmanı güncel durumu.</p>
        </div>
      </div>

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="glass-panel hover-card" onClick={() => isAdmin && setCurrentPage('finance')} style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s ease-in-out' }} onMouseEnter={e => isAdmin && (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => isAdmin && (e.currentTarget.style.transform = 'translateY(0)')}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--primary)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Aylık Aidat</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--primary)' }}>{formatMoney(apt?.monthlyDues || 0)}</div>
        </div>
        <div className="glass-panel hover-card" onClick={() => isAdmin && setCurrentPage('finance')} style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s ease-in-out' }} onMouseEnter={e => isAdmin && (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => isAdmin && (e.currentTarget.style.transform = 'translateY(0)')}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--success)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Bu Ay Toplanan</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--success)' }}>{formatMoney(monthIncome)}</div>
        </div>
        <div className="glass-panel hover-card" onClick={() => isAdmin && setCurrentPage('finance')} style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s ease-in-out' }} onMouseEnter={e => isAdmin && (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => isAdmin && (e.currentTarget.style.transform = 'translateY(0)')}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--danger)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Bu Ay Giderler</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--danger)' }}>{formatMoney(monthExpense)}</div>
        </div>
        <div className="glass-panel hover-card" onClick={() => isAdmin && setCurrentPage('finance')} style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s ease-in-out' }} onMouseEnter={e => isAdmin && (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => isAdmin && (e.currentTarget.style.transform = 'translateY(0)')}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--warning)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Güncel Kasa Durumu</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--warning)' }}>{formatMoney(kasa)}</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass-panel hover-card" onClick={() => setCurrentPage('announcements')} style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', margin: 0 }}>Duyurular</h3>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>Tümünü Gör →</span>
          </div>
          {visibleAnnouncements.length === 0 ? <p style={{ color: 'var(--g500)' }}>Duyuru yok.</p> : visibleAnnouncements.slice().reverse().slice(0, 3).map(a => (
            <div key={a.id} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', padding: 16, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: 'var(--g900)' }}>{a.title}</strong>
                  <span className={
                      a.priority === 'urgent' ? 'badge urgent' : 
                      a.priority === 'important' ? 'badge pending' : 
                      'badge normal'
                    } style={{ padding: '2px 6px', fontSize: 10 }}>
                      {a.priority === 'urgent' ? 'ACİL' : a.priority === 'important' ? 'ÖNEMLİ' : 'NORMAL'}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--g500)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ color: 'var(--g600)', fontSize: 14 }}>{a.body || a.content}</p>
            </div>
          ))}
        </div>
        
        <div className="glass-panel hover-card" onClick={() => setCurrentPage('requests')} style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', margin: 0 }}>Arızalar & Talepler</h3>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>Tümünü Gör →</span>
          </div>
          {visibleRequests.length === 0 ? <p style={{ color: 'var(--g500)' }}>Kayıtlı arıza yok.</p> : visibleRequests.slice().reverse().slice(0, 3).map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <strong style={{ color: 'var(--g900)', display: 'block' }}>{r.title}</strong>
                <span style={{ fontSize: 12, color: 'var(--g500)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <span className={`badge ${r.status === 'completed' ? 'completed' : r.status === 'in-progress' ? 'in-progress' : r.status === 'pending-approval' ? 'pending' : 'pending'}`}>{r.status === 'completed' ? 'Giderildi' : r.status === 'in-progress' ? 'Hallediliyor' : r.status === 'pending-approval' ? 'Onay Bekliyor' : 'Bekliyor'}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', marginBottom: 20 }}>Bu Ayın Gelir / Gider Grafiği</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--g400)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--g400)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₺${value}`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderRadius: 12, border: '1px solid var(--panel-border)', backdropFilter: 'blur(12px)' }} itemStyle={{ fontWeight: 600, color: 'var(--g900)' }} />
                <Area type="monotone" dataKey="Gelir" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorGelir)" />
                <Area type="monotone" dataKey="Gider" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorGider)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', marginBottom: 20 }}>Bu Ay Gider Kategorileri</h3>
          {categoryEntries.length === 0 ? (
            <p style={{ color: 'var(--g500)', fontSize: 14 }}>Bu ay henüz gider kaydedilmemiş.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryEntries.map(([cat, amount]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid var(--g200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }}></div>
                    <span style={{ fontWeight: 600, color: 'var(--g800)' }}>{cat}</span>
                  </div>
                  <strong style={{ color: 'var(--danger)' }}>{formatMoney(amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
