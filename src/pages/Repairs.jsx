import { useState } from 'react';
import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Trash2, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { confirmAsync } from '../utils/confirmAsync';

export default function Repairs() {
  const { repairs, addRepair, updateRepairData, deleteRepair, updateRepairStatus, apt } = useApt();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  // Use flatsCount from apartment settings for calculating share per flat
  const totalHouseholds = apt?.flatsCount || 1;

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  
  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addRepair({
      title,
      description: desc,
      cost: Number(cost) || 0,
      userId: currentUser.id
    });
    setShowCreate(false);
    resetForm();
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateRepairData(editingId, {
      title,
      description: desc,
      cost: Number(cost) || 0
    });
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setCost('');
  };

  const openEdit = (r) => {
    setEditingId(r.id);
    setTitle(r.title);
    setDesc(r.description || '');
    setCost(r.cost || 0);
  };

  const handleDelete = async (id) => {
    const ok = await confirmAsync({ title: 'Tamiratı Sil', message: 'Bu tamirat kaydını silmek istediğinize emin misiniz?', confirmText: 'Sil', danger: true });
    if (ok) deleteRepair(id);
  };

  const calculateShare = (totalCost) => {
    if (!totalCost) return 0;
    return (totalCost / totalHouseholds).toFixed(2);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Tamiratlar</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowCreate(true); }}>
            <Plus size={18} /> Yeni Tamirat Ekle
          </button>
        )}
      </div>

      {repairs.length === 0 ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 24, border: '1px dashed var(--primary-light)' }}>
            <div style={{ background: 'var(--primary-light)', padding: 24, borderRadius: '50%', marginBottom: 20 }}>
              <Wrench size={48} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--g900)', marginBottom: 8 }}>Henüz Hiç Tamirat Yok</h3>
            <p style={{ color: 'var(--g600)', fontSize: 15, maxWidth: 400 }}>Apartmanla ilgili herhangi bir tamirat veya bakım işlemi bulunmuyor. Yeni bir kayıt oluşturmak için sağ üstteki butonu kullanabilirsiniz.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tamirat Adı</th>
                  <th>Açıklama</th>
                  <th>Maliyet</th>
                  <th>Kişi Başına Pay</th>
                  <th>İlerleme</th>
                  {isAdmin && <th>İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {repairs.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: 'var(--g100)', padding: 6, borderRadius: '50%' }}><Wrench size={14} color="var(--g600)" /></div>
                        <strong style={{ color: 'var(--g900)' }}>{r.title}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--g600)', fontSize: 14 }}>
                      {r.description ? (r.description.length > 50 ? r.description.substring(0, 50) + '...' : r.description) : '-'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      ₺{r.cost ? r.cost.toLocaleString('tr-TR') : '0'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--warning)' }}>
                      ₺{calculateShare(r.cost).toLocaleString('tr-TR')}
                    </td>
                    <td>
                      {r.status === 'completed' ? (
                        <span className="badge completed" style={{ cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && updateRepairStatus(r.id, 'pending')}>
                          <span className="badge-dot"></span> Tamamlandı
                        </span>
                      ) : (
                        <span className="badge urgent" style={{ cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && updateRepairStatus(r.id, 'completed')}>
                          <span className="badge-dot"></span> Devam Ediyor
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-outline" onClick={() => openEdit(r)} style={{ padding: '6px' }}><Edit2 size={16} /></button>
                          <button className="btn-danger" onClick={() => handleDelete(r.id)} style={{ padding: '6px' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {(showCreate || editingId) && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel">
              <div className="modal-header">
                <h2>{editingId ? 'Tamiratı Düzenle' : 'Yeni Tamirat Ekle'}</h2>
                <button type="button" className="modal-close" onClick={() => { setShowCreate(false); setEditingId(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={editingId ? handleEdit : handleCreate}>
                <div className="modal-body">
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Tamirat Adı</label>
                    <input className="glass-input" required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Örn: Çatı Yalıtımı" />
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Toplam Maliyet (TL)</label>
                    <input type="number" className="glass-input" required min="0" value={cost} onChange={e=>setCost(e.target.value)} placeholder="0" />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Daire Sayısı</label>
                    <input className="glass-input" type="text" readOnly value={totalHouseholds} style={{ background: 'var(--g100)', color: 'var(--g500)' }} title="Değiştirilemez. Ayarlar bölümündeki Toplam Daire Sayısı değerini alır." />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Açıklama (Opsiyonel)</label>
                    <textarea className="glass-input" value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Detayları yazın..." />
                  </div>

                  {cost > 0 && (
                    <div style={{ padding: 12, background: 'var(--warning-light)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={18} color="var(--warning)" />
                      <span style={{ color: 'var(--warning-dark)', fontSize: 14 }}>
                        Kişi başı düşen pay: <strong>₺{calculateShare(cost)}</strong>
                      </span>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => { setShowCreate(false); setEditingId(null); }}>İptal</button>
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
