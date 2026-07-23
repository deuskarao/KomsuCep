import { useState } from 'react';
import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Edit2, Bell, CheckCheck } from 'lucide-react';
import { confirmAsync } from '../utils/confirmAsync';

export default function Announcements() {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementAsRead } = useApt();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [duration, setDuration] = useState(7); // Days

  const now = new Date();

  // Filter announcements: show to residents only if not expired, admins see all (with expired badge)
  const isExpired = (a) => {
    if (!a.duration) return false;
    const expiry = new Date(a.createdAt);
    expiry.setDate(expiry.getDate() + Number(a.duration));
    return now > expiry;
  };

  const visibleAnnouncements = announcements.filter(a => isAdmin || !isExpired(a));

  const openEdit = (a) => {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setPriority(a.priority || 'normal');
    setDuration(a.duration || 7);
    setShowCreate(true);
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setTitle(''); setBody(''); setPriority('normal'); setDuration(7);
  };

  const handleCreateOrUpdate = (e) => {
    e.preventDefault();
    if (editingId) {
      updateAnnouncement(editingId, { title, body, priority, duration: Number(duration) });
    } else {
      addAnnouncement({ title, body, priority, duration: Number(duration) });
    }
    closeForm();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Duyurular</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Yeni Duyuru</button>
        )}
      </div>

      {visibleAnnouncements.length === 0 ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 24, border: '1px dashed var(--primary-light)' }}>
            <div style={{ background: 'var(--primary-light)', padding: 24, borderRadius: '50%', marginBottom: 20 }}>
              <Bell size={48} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--g900)', marginBottom: 8 }}>Henüz Hiç Duyuru Yok</h3>
            <p style={{ color: 'var(--g600)', fontSize: 15, maxWidth: 400 }}>Şu anda aktif bir duyuru bulunmuyor. Yeni bir duyuru oluşturmak için sağ üstteki butonu kullanabilirsiniz.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleAnnouncements.slice().reverse().map(a => {
              const expired = isExpired(a);
              return (
              <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,0,0,0.05)', padding: 20, borderRadius: 12, display: 'flex', flexDirection: 'column', opacity: expired ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', textDecoration: expired ? 'line-through' : 'none' }}>{a.title}</h3>
                    <span className={
                      a.priority === 'urgent' ? 'badge urgent' : 
                      a.priority === 'important' ? 'badge pending' : 
                      'badge normal'
                    }>
                      {a.priority === 'urgent' ? 'ACİL' : a.priority === 'important' ? 'ÖNEMLİ' : 'NORMAL'}
                    </span>
                    {expired && <span className="badge normal">Süresi Doldu</span>}
                    {!(a.readBy || []).includes(currentUser?.id) && !expired && (
                      <span style={{ background: 'var(--danger)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>YENİ</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--g500)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(a)} style={{ background: 'transparent', border: 'none', color: 'var(--g500)', cursor: 'pointer', padding: 4 }} title="Düzenle"><Edit2 size={16} /></button>
                        <button onClick={async () => { const ok = await confirmAsync({ title: 'Duyuruyu Sil', message: 'Bu duyuruyu silmek istediğinize emin misiniz?', confirmText: 'Sil', danger: true }); if(ok) deleteAnnouncement(a.id) }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }} title="Sil"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                  <p style={{ color: 'var(--g700)', fontSize: 15, lineHeight: 1.6, margin: 0, flex: 1, whiteSpace: 'pre-wrap' }}>{a.body || a.content}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, flexShrink: 0 }}>
                    {(a.readBy || []).includes(currentUser?.id) ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
                        <CheckCheck size={18} /> Okundu
                      </span>
                    ) : !expired ? (
                      <button 
                        onClick={() => markAnnouncementAsRead(a.id)} 
                        className="btn-outline" 
                        style={{ fontSize: 13, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      >
                        Okudum
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel">
              <div className="modal-header">
                <h2>{editingId ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Oluştur'}</h2>
                <button className="modal-close" type="button" onClick={closeForm}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateOrUpdate}>
                <div className="modal-body">
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Başlık</label>
                    <input className="glass-input" required value={title} onChange={e=>setTitle(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Öncelik</label>
                      <select className="glass-input" value={priority} onChange={e=>setPriority(e.target.value)}>
                        <option value="normal">Normal</option>
                        <option value="important">Önemli</option>
                        <option value="urgent">Acil</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Gösterim Süresi (Gün)</label>
                      <input type="number" className="glass-input" required min="1" max="7" value={duration} onChange={e=>setDuration(Math.min(Number(e.target.value), 7))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>İçerik</label>
                    <textarea className="glass-input" required value={body} onChange={e=>setBody(e.target.value)} rows={5} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={closeForm}>İptal</button>
                  <button type="submit" className="btn-primary">{editingId ? 'Güncelle' : 'Yayınla'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
