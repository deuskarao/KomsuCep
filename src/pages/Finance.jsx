import { useState, useEffect } from 'react';
import { useApt } from '../context/AptContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, User, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { confirmAsync } from '../utils/confirmAsync';

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction, getUsers } = useApt();
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, [getUsers]);

  const [showCreate, setShowCreate] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [category, setCategory] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [filter, setFilter] = useState('all');

  const handleCreate = (e) => {
    e.preventDefault();
    addTransaction({ 
      description: desc, 
      amount: Number(amount), 
      type, 
      category,
      userId: selectedUserId || null
    });
    setShowCreate(false);
    setDesc(''); setAmount(''); setType('income'); setCategory(''); setSelectedUserId('');
  };

  const filtered = transactions.filter(t => filter === 'all' || t.type === filter).slice().reverse();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Kasa Hareketleri</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Yeni Kayıt</button>
      </div>

      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: 'var(--g100)', padding: 6, borderRadius: 12, border: '1px solid var(--g200)', width: 'fit-content', marginBottom: 24 }}>
          <button onClick={() => setFilter('all')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: filter === 'all' ? '#fff' : 'transparent', color: filter === 'all' ? 'var(--primary)' : 'var(--g600)', fontWeight: 600, cursor: 'pointer', boxShadow: filter === 'all' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Tümü</button>
          <button onClick={() => setFilter('income')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: filter === 'income' ? '#fff' : 'transparent', color: filter === 'income' ? 'var(--success)' : 'var(--g600)', fontWeight: 600, cursor: 'pointer', boxShadow: filter === 'income' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Gelirler</button>
          <button onClick={() => setFilter('expense')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: filter === 'expense' ? '#fff' : 'transparent', color: filter === 'expense' ? 'var(--danger)' : 'var(--g600)', fontWeight: 600, cursor: 'pointer', boxShadow: filter === 'expense' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Giderler</button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'var(--g50)', borderRadius: 16, border: '1.5px dashed var(--g300)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <DollarSign size={32} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g800)', marginBottom: 8 }}>Kayıt Bulunamadı</h3>
            <p style={{ color: 'var(--g500)', fontSize: 15 }}>Bu filtreye uygun herhangi bir kasa hareketi bulunmuyor.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Açıklama</th>
                  <th>Kategori</th>
                  <th>İlgili Kişi</th>
                  <th>Tür</th>
                  <th>Tutar</th>
                  <th>Tarih</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const user = users.find(u => u.id === t.userId);
                  return (
                    <tr key={t.id}>
                      <td><strong style={{ color: 'var(--g900)' }}>{t.description}</strong></td>
                      <td>{t.category || '-'}</td>
                      <td>
                        {user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} color="var(--g500)" />
                            <span style={{ fontSize: 13, color: 'var(--g700)' }}>{user.name}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`badge ${t.type === 'income' ? 'completed' : 'urgent'}`}>
                          {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {t.type === 'income' ? 'Gelir' : 'Gider'}
                        </span>
                      </td>
                      <td style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {t.type === 'income' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                      </td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-danger" onClick={async () => { const ok = await confirmAsync({ title: 'İşlemi Sil', message: 'Bu kasa hareketini silmek istediğinize emin misiniz?', confirmText: 'Sil', danger: true }); if(ok) deleteTransaction(t.id) }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel">
              <div className="modal-header">
                <h2>Yeni Gelir / Gider</h2>
                <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>İşlem Türü</label>
                    <select className="glass-input" value={type} onChange={e=>setType(e.target.value)}>
                      <option value="income">Gelir (+)</option>
                      <option value="expense">Gider (-)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Açıklama</label>
                    <input className="glass-input" required value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Örn: Elektrik Faturası" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Tutar (TL)</label>
                    <input type="number" className="glass-input" required min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Kategori</label>
                    <select className="glass-input" required value={category} onChange={e=>setCategory(e.target.value)}>
                      <option value="">Seçiniz</option>
                      {type === 'income' ? (
                        <>
                          <option value="Aidat">Aidat</option>
                          <option value="Bağış">Bağış</option>
                          <option value="Diğer">Diğer</option>
                        </>
                      ) : (
                        <>
                          <option value="Tamirat">Tamirat</option>
                          <option value="Bakım">Bakım</option>
                          <option value="Temizlik">Temizlik</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>İlgili Kişi (Opsiyonel)</label>
                    <select className="glass-input" value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)}>
                      <option value="">-- Kişi Seçin --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.block || u.flatNo ? `(${u.block ? u.block + ' Blok ' : ''}${u.flatNo ? 'Daire ' + u.flatNo : ''})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>İptal</button>
                  <button type="submit" className="btn-primary">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
