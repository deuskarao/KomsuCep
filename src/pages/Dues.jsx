import { useState, useEffect } from 'react';
import { useApt } from '../context/AptContext';
import { User, DollarSign, Plus, CheckCircle, XCircle, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAsync } from '../utils/confirmAsync';

export default function Dues() {
  const { apt, dues, addDue, addBulkDues, markDueAsPaid, revertDueAsUnpaid, deleteDue, getUsers } = useApt();
  
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, [getUsers]);
  
  // Filter for month/year (default current)
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const baseAmount = apt?.monthlyDues || 0;
  
  // Calculate stats for selected month
  const monthDues = dues.filter(d => d.month === filterMonth && d.year === filterYear);
  const expectedTotal = users.length * baseAmount;
  const collectedTotal = monthDues.filter(d => d.status === 'paid').reduce((s, d) => s + Number(d.amount), 0);
  const remainingTotal = expectedTotal - collectedTotal;

  const handleChargeUser = (userId) => {
    if (!baseAmount) {
      toast.error('Lütfen önce Ayarlar bölümünden Sabit Aidat Tutarı belirleyin.');
      return;
    }
    addDue({
      userId,
      amount: baseAmount,
      description: `${filterMonth}/${filterYear} Aidatı`,
      month: filterMonth,
      year: filterYear
    });
  };

  const handleChargeAll = () => {
    if (!baseAmount) {
      toast.error('Lütfen önce Ayarlar bölümünden Sabit Aidat Tutarı belirleyin.');
      return;
    }
    const unchargedUserIds = users
      .filter(u => !monthDues.find(d => d.userId === u.id))
      .map(u => u.id);
      
    if (unchargedUserIds.length > 0) {
      addBulkDues(unchargedUserIds, {
        amount: baseAmount,
        description: `${filterMonth}/${filterYear} Aidatı`,
        month: filterMonth,
        year: filterYear
      });
      toast.success(`${unchargedUserIds.length} sakine borç yazıldı.`);
    } else {
      toast.error('Zaten herkes borçlandırılmış.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Aidat Takibi</h2>
        <div style={{ display: 'flex', gap: 8, background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: 12, border: '1px solid var(--g200)', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <Calendar size={18} color="var(--primary)" />
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={{ background: 'transparent', border: 'none', color: 'var(--g900)', fontWeight: 600, fontSize: 15, outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: 4 }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('tr-TR', { month: 'long' })}</option>
            ))}
          </select>
          <span style={{ color: 'var(--g400)' }}>/</span>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ background: 'transparent', border: 'none', color: 'var(--g900)', fontWeight: 600, fontSize: 15, outline: 'none', cursor: 'pointer', appearance: 'none' }}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--primary)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Sabit Aidat Tutarı</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--primary)' }}>₺{baseAmount}</div>
        </div>
        <div className="glass-panel" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--warning)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Beklenen Tahsilat</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--warning)' }}>₺{expectedTotal}</div>
        </div>
        <div className="glass-panel" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--success)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Bu Ay Alınan</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--success)' }}>₺{collectedTotal}</div>
        </div>
        <div className="glass-panel" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--danger)' }}></div>
          <div style={{ fontSize: 14, color: 'var(--g500)', fontWeight: 500 }}>Bu Ay Kalan</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--danger)' }}>₺{remainingTotal}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)' }}>Sakinlerin Aidat Durumu</h3>
          <button className="btn-primary" onClick={handleChargeAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} /> Herkese Aidat Yansıt
          </button>
        </div>

        {users.length === 0 ? (
          <div className="empty-state"><p>Gösterilecek kayıt yok.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sakin</th>
                  <th>Daire Bilgisi</th>
                  <th>E-posta</th>
                  <th>Durum</th>
                  <th>Tutar</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const userDue = monthDues.find(d => d.userId === u.id);
                  
                  let statusBadge = <span className="badge normal">Borçlandırılmadı</span>;
                  let actionBtn = (
                    <button className="btn-outline" onClick={() => handleChargeUser(u.id)} style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                      <Plus size={14} /> Borçlandır
                    </button>
                  );
                  
                  if (userDue) {
                    if (userDue.status === 'paid') {
                      statusBadge = <span className="badge completed"><span className="badge-dot"></span> Ödendi</span>;
                      actionBtn = (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ color: 'var(--g400)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> İşlem Yok</span>
                          <button onClick={async () => { const ok = await confirmAsync({ title: 'Ödemeyi Geri Al', message: 'Ödemeyi geri alıp "Ödenmedi" durumuna döndürmek istediğinize emin misiniz? (Bağlı kasa işlemi de silinir)', confirmText: 'Geri Al', danger: true }); if(ok) revertDueAsUnpaid(userDue.id) }} className="btn-outline" style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={12} /> Geri Al
                          </button>
                        </div>
                      );
                    } else {
                      statusBadge = <span className="badge urgent"><span className="badge-dot"></span> Ödenmedi</span>;
                      actionBtn = (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-success" onClick={async () => { const ok = await confirmAsync({ title: 'Tahsilat', message: 'Ödendi olarak işaretlensin mi?', confirmText: 'Evet, Tahsil Et' }); if(ok) markDueAsPaid(userDue.id) }} style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <DollarSign size={14} /> Tahsil Et
                          </button>
                          <button onClick={async () => { const ok = await confirmAsync({ title: 'Borcu Sil', message: 'Borç kaydı silinsin mi?', confirmText: 'Sil', danger: true }); if(ok) deleteDue(userDue.id) }} style={{ padding: '6px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Borcu İptal Et">
                            <XCircle size={18} />
                          </button>
                        </div>
                      );
                    }
                  }

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'admin' ? 'var(--primary)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={18} color="white" />
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--g900)' }}>{u.name} {u.role === 'admin' ? '(Yönetici)' : ''}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 14, color: 'var(--g700)', fontWeight: 500 }}>
                          {u.block || u.flatNo ? `${u.block ? u.block + ' Blok ' : ''}${u.flatNo ? 'Daire ' + u.flatNo : ''}` : '-'}
                        </span>
                      </td>
                      <td>{u.email}</td>
                      <td>{statusBadge}</td>
                      <td style={{ fontWeight: 600, color: userDue?.status === 'paid' ? 'var(--success)' : userDue?.status === 'unpaid' ? 'var(--danger)' : 'var(--g400)' }}>
                        ₺{userDue ? userDue.amount : baseAmount}
                      </td>
                      <td>{actionBtn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
