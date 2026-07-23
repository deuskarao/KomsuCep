import { useState, useEffect } from 'react';
import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, CheckCircle, ArrowRight, Edit2, Trash2, Wrench, MessageSquare, DollarSign, Users, User } from 'lucide-react';
import { confirmAsync } from '../utils/confirmAsync';

export default function Requests() {
  const { requests, addRequest, updateRequestStatus, updateRequestData, addRequestProgress, updateRequestProgressNote, deleteRequestProgress, deleteRequest, approveRequest, getUsers } = useApt();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, [getUsers]);

  const totalHouseholds = users.length || 1; // avoid division by zero
  
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('issue'); // 'issue' or 'request'
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [newProgress, setNewProgress] = useState('');
  
  const [editingProgId, setEditingProgId] = useState(null);
  const [editingProgNote, setEditingProgNote] = useState('');
  
  const [showCostInput, setShowCostInput] = useState(false);
  const [costAmount, setCostAmount] = useState('');

  const visibleRequests = requests.filter(r => {
    if (r.status === 'pending-approval') {
      return isAdmin || r.userId === currentUser?.id;
    }
    return true;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    addRequest({ title, description: desc, type, cost: 0 });
    setShowCreate(false);
    setTitle(''); setDesc(''); setType('issue');
  };

  const handleAddProgress = (e) => {
    e.preventDefault();
    if (!newProgress.trim()) return;
    addRequestProgress(selectedReq.id, newProgress);
    const tempId = Date.now().toString();
    setSelectedReq({
      ...selectedReq,
      progress: [...(selectedReq.progress || []), { id: tempId, note: newProgress, createdAt: new Date().toISOString() }]
    });
    setNewProgress('');
  };

  const handleEditProgress = (progId, currentNote) => {
    setEditingProgId(progId);
    setEditingProgNote(currentNote);
  };

  const handleSaveProgressEdit = () => {
    if (!editingProgNote.trim()) return;
    updateRequestProgressNote(selectedReq.id, editingProgId, editingProgNote);
    setSelectedReq({
      ...selectedReq,
      progress: selectedReq.progress.map(p => p.id === editingProgId ? { ...p, note: editingProgNote } : p)
    });
    setEditingProgId(null);
  };

  const handleDeleteProgress = async (progId) => {
    const ok = await confirmAsync({ title: 'İlerlemeyi Sil', message: 'Bu ilerleme kaydını silmek istediğinize emin misiniz?', confirmText: 'Sil', danger: true });
    if (ok) {
      deleteRequestProgress(selectedReq.id, progId);
      setSelectedReq({
        ...selectedReq,
        progress: selectedReq.progress.filter(p => p.id !== progId)
      });
    }
  };

  const handleSaveCost = (e) => {
    e.preventDefault();
    const c = Number(costAmount);
    updateRequestData(selectedReq.id, { cost: c });
    setSelectedReq({ ...selectedReq, cost: c });
    setShowCostInput(false);
  };

  const renderCard = (r) => (
    <div 
      key={r.id} 
      onClick={() => setSelectedReq(r)}
      style={{ background: '#ffffff', border: '1px solid var(--g200)', padding: 16, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span className={`badge ${r.type === 'issue' ? 'urgent' : 'pending'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
          {r.type === 'issue' ? <Wrench size={12} /> : <MessageSquare size={12} />}
          {r.type === 'issue' ? 'Arıza' : 'Talep'}
        </span>
        {r.status === 'pending-approval' && <span className="badge warning" style={{ padding: '4px 8px', fontSize: 11 }}>ONAY BEKLİYOR</span>}
        <span style={{ fontSize: 12, color: 'var(--g400)', marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--g900)', marginBottom: 6 }}>{r.title}</h3>
      <p style={{ color: 'var(--g500)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
        <User size={13} /> 
        {(() => {
          const u = users.find(usr => usr.id === r.userId);
          if (!u) return 'Bilinmiyor';
          const flatStr = u.block || u.flatNo ? ` (${u.block ? u.block + ' Blok ' : ''}${u.flatNo ? 'Daire ' + u.flatNo : ''})` : '';
          return u.name + flatStr;
        })()}
      </p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Arızalar & Talepler</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Yeni Bildirim</button>
      </div>

      {visibleRequests.length === 0 ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 24, border: '1px dashed var(--primary-light)' }}>
            <div style={{ background: 'var(--primary-light)', padding: 24, borderRadius: '50%', marginBottom: 20 }}>
              <MessageSquare size={48} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--g900)', marginBottom: 8 }}>Henüz Hiç Arıza/Talep Yok</h3>
            <p style={{ color: 'var(--g600)', fontSize: 15, maxWidth: 400 }}>Apartmanla ilgili bildirilen herhangi bir arıza veya talep bulunmuyor. Yeni bir kayıt oluşturmak için sağ üstteki butonu kullanabilirsiniz.</p>
          </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {visibleRequests.filter(r => r.status === 'pending-approval').length > 0 && (
            <div className="glass-panel" style={{ padding: 16, background: 'var(--warning-light)', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--warning)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning-dark)', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 12, borderBottom: '2px solid rgba(245, 158, 11, 0.3)' }}>
                Yönetici Onayı Bekleyenler ({visibleRequests.filter(r => r.status === 'pending-approval').length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {visibleRequests.filter(r => r.status === 'pending-approval').map(renderCard)}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Column 1: Bekleyenler */}
            <div className="glass-panel" style={{ padding: 16, background: 'var(--g50)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--g600)', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 12, borderBottom: '2px solid var(--warning)' }}>
                Bekleyenler ({visibleRequests.filter(r => r.status === 'pending').length})
              </h3>
              {visibleRequests.filter(r => r.status === 'pending').map(renderCard)}
            </div>

            {/* Column 2: İşlemde */}
            <div className="glass-panel" style={{ padding: 16, background: 'var(--g50)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--g600)', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 12, borderBottom: '2px solid var(--primary)' }}>
                İşlemde Olanlar ({visibleRequests.filter(r => r.status === 'in-progress').length})
              </h3>
              {visibleRequests.filter(r => r.status === 'in-progress').map(renderCard)}
            </div>

            {/* Column 3: Çözülenler */}
            <div className="glass-panel" style={{ padding: 16, background: 'var(--g50)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--g600)', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 12, borderBottom: '2px solid var(--success)' }}>
                Çözülenler ({visibleRequests.filter(r => r.status === 'completed').length})
              </h3>
              {visibleRequests.filter(r => r.status === 'completed').map(renderCard)}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel">
              <div className="modal-header">
                <h2>Yeni Bildirim Oluştur</h2>
                <button type="button" className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Bildirim Türü</label>
                    <select className="glass-input" value={type} onChange={e=>setType(e.target.value)}>
                      <option value="issue">Arıza Bildirimi</option>
                      <option value="request">Genel Talep / Öneri</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Başlık</label>
                    <input className="glass-input" required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Örn: Asansör çalışmıyor" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Açıklama</label>
                    <textarea className="glass-input" required value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Detayları yazın..." />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>İptal</button>
                  <button type="submit" className="btn-primary">Gönder</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL / PROGRESS MODAL */}
      <AnimatePresence>
        {selectedReq && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="modal glass-panel" style={{ maxWidth: 700, padding: 0, overflow: 'hidden' }}>
              
              {/* HEADER */}
              <div style={{ padding: '24px 32px', background: 'var(--g50)', borderBottom: '1px solid var(--g200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)', margin: 0, textTransform: 'capitalize', letterSpacing: '-0.5px' }}>{selectedReq.title}</h2>
                    <span className={`badge ${selectedReq.status === 'pending-approval' ? 'warning' : selectedReq.status}`} style={{ fontSize: 11, padding: '4px 10px' }}>
                      {selectedReq.status === 'pending' ? 'BEKLİYOR' : selectedReq.status === 'in-progress' ? 'HALLEDİLİYOR' : selectedReq.status === 'pending-approval' ? 'ONAY BEKLİYOR' : 'GİDERİLDİ'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--g500)' }}>Talebi Açan</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--g900)' }}>
                        {(() => {
                          const u = users.find(usr => usr.id === selectedReq.userId);
                          if (!u) return 'Bilinmiyor';
                          const flatStr = u.block || u.flatNo ? ` (${u.block ? u.block + ' Blok ' : ''}${u.flatNo ? 'Daire ' + u.flatNo : ''})` : '';
                          return u.name + flatStr;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                <button type="button" className="modal-close" onClick={() => { setSelectedReq(null); setShowCostInput(false); }} style={{ background: 'white', border: '1px solid var(--g200)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><X size={20} /></button>
              </div>
              
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '32px' }}>
                
                {/* DESCRIPTION */}
                <div style={{ position: 'relative', padding: '20px 24px', background: '#ffffff', borderRadius: 16, border: '1px solid var(--g200)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 32 }}>
                  <div style={{ position: 'absolute', top: -12, left: 24, background: 'var(--g900)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={14} /> Açıklama
                  </div>
                  <p style={{ color: 'var(--g700)', fontSize: 15, lineHeight: 1.6, margin: 0, marginTop: 8 }}>
                    {selectedReq.description}
                  </p>
                </div>

                {selectedReq.status === 'pending-approval' ? (
                  isAdmin ? (
                    <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                      <button className="btn-success" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }} onClick={() => { approveRequest(selectedReq.id); setSelectedReq({...selectedReq, status: 'pending'}); }}><CheckCircle size={18}/> Talebi Onayla & Yayına Al</button>
                      <button className="btn-danger" style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', padding: '0 24px' }} onClick={() => { deleteRequest(selectedReq.id); setSelectedReq(null); }}><Trash2 size={18}/> Reddet & Sil</button>
                    </div>
                  ) : (
                    <div style={{ padding: 16, background: 'var(--warning-light)', borderRadius: 12, color: 'var(--warning-dark)', textAlign: 'center', fontWeight: 600 }}>
                      Bu talep yönetici onayından sonra tüm apartmana sunulacaktır. İsterseniz talebi iptal edebilirsiniz.
                      <button className="btn-danger" style={{ display: 'block', margin: '16px auto 0' }} onClick={() => { deleteRequest(selectedReq.id); setSelectedReq(null); }}><Trash2 size={18}/> Talebimi İptal Et</button>
                    </div>
                  )
                ) : (
                  <>
                    {(selectedReq.cost > 0 || (isAdmin && selectedReq.status === 'completed')) && (
                      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: 'var(--primary-light)', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ color: 'var(--primary-dark)', fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={16}/> Maliyet Bilgisi</h4>
                          {selectedReq.cost > 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--g700)' }}>Toplam: <strong>₺{selectedReq.cost.toLocaleString('tr-TR')}</strong> — Hane Başına Düşen Pay: <strong>₺{(selectedReq.cost / totalHouseholds).toFixed(2).toLocaleString('tr-TR')}</strong></p>
                          ) : (
                            <p style={{ fontSize: 13, color: 'var(--g700)' }}>Henüz maliyet girilmedi.</p>
                          )}
                        </div>
                        {isAdmin && (
                          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setShowCostInput(!showCostInput)}>
                            {selectedReq.cost > 0 ? 'Maliyeti Düzenle' : 'Maliyet Gir'}
                          </button>
                        )}
                      </div>
                    )}

                    {showCostInput && (
                      <form onSubmit={handleSaveCost} style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'var(--g50)', padding: 16, borderRadius: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: 12, color: 'var(--g600)', marginBottom: 4 }}>Toplam Maliyet (TL)</label>
                          <input type="number" className="glass-input" style={{ padding: '8px 12px' }} required min="0" value={costAmount} onChange={e=>setCostAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                          <button type="submit" className="btn-success">Kaydet</button>
                          <button type="button" className="btn-outline" onClick={() => setShowCostInput(false)}>İptal</button>
                        </div>
                      </form>
                    )}

                    {/* TIMELINE */}
                    <h4 style={{ color: 'var(--g900)', marginBottom: 24, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={20} color="var(--primary)" /> İlerleme Durumu
                    </h4>
                    
                    <div style={{ position: 'relative', paddingLeft: 32 }}>
                      {/* Timeline line */}
                      <div style={{ position: 'absolute', top: 8, left: 11, width: 2, height: 'calc(100% - 16px)', background: 'var(--g200)', borderRadius: 2 }}></div>
                      
                      {/* Creation Step */}
                      <div style={{ position: 'relative', marginBottom: 24 }}>
                        <div style={{ position: 'absolute', left: -32, top: 4, width: 24, height: 24, borderRadius: '50%', background: 'var(--g100)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g400)' }}></div>
                        </div>
                        <div style={{ background: 'var(--g50)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--g200)' }}>
                          <p style={{ color: 'var(--g900)', fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>Talep Oluşturuldu</p>
                          <span style={{ color: 'var(--g500)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {new Date(selectedReq.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>

                      {/* Progress Steps */}
                      {selectedReq.progress?.map((p, i) => (
                        <div key={p.id || i} style={{ position: 'relative', marginBottom: 24 }}>
                          <div style={{ position: 'absolute', left: -32, top: 4, width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-light)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                          </div>
                          
                          <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--primary-light)', boxShadow: '0 4px 12px rgba(59,130,246,0.05)' }}>
                            {editingProgId === p.id ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input className="glass-input" style={{ padding: '8px 12px', fontSize: 13, flex: 1 }} value={editingProgNote} onChange={e => setEditingProgNote(e.target.value)} autoFocus />
                                <button className="btn-success" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleSaveProgressEdit}>Kaydet</button>
                                <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setEditingProgId(null)}>İptal</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <p style={{ color: 'var(--g900)', fontSize: 14, fontWeight: 500, margin: '0 0 4px 0', lineHeight: 1.5 }}>{p.note}</p>
                                  <span style={{ color: 'var(--g500)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {new Date(p.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                                {isAdmin && (
                                  <div style={{ display: 'flex', gap: 8, opacity: 0.7 }}>
                                    <button onClick={() => handleEditProgress(p.id, p.note)} style={{ background: 'var(--g100)', border: 'none', color: 'var(--g700)', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='var(--g200)'} onMouseLeave={e=>e.currentTarget.style.background='var(--g100)'}><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteProgress(p.id)} style={{ background: 'var(--danger-light)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'} onMouseLeave={e=>e.currentTarget.style.background='var(--danger-light)'}><Trash2 size={14} /></button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Completion Step */}
                      {selectedReq.status === 'completed' && (
                        <div style={{ position: 'relative', marginBottom: 24 }}>
                          <div style={{ position: 'absolute', left: -32, top: 4, width: 24, height: 24, borderRadius: '50%', background: 'var(--success)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}>
                            <CheckCircle size={12} color="white" />
                          </div>
                          <div style={{ background: 'var(--success-light)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)' }}>
                            <p style={{ color: 'var(--success-dark)', fontSize: 14, fontWeight: 600, margin: 0 }}>Talebi Çözüldü Olarak İşaretlendi</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isAdmin && selectedReq.status !== 'completed' && (
                      <div style={{ marginTop: 32 }}>
                        <div style={{ background: 'var(--g50)', padding: 24, borderRadius: 16, border: '1px solid var(--g200)', marginBottom: 24 }}>
                          <h5 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--g700)' }}>Yeni Aşama Ekle</h5>
                          <form onSubmit={handleAddProgress} style={{ display: 'flex', gap: 12 }}>
                            <input className="glass-input" value={newProgress} onChange={e=>setNewProgress(e.target.value)} placeholder="Örn: Usta çağrıldı" style={{ flex: 1, background: '#fff' }} />
                            <button type="submit" className="btn-primary" style={{ padding: '0 24px' }}>Ekle</button>
                          </form>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--g200)', paddingTop: 24 }}>
                          {selectedReq.status === 'pending' && <button className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }} onClick={() => { updateRequestStatus(selectedReq.id, 'in-progress'); setSelectedReq({...selectedReq, status: 'in-progress'}) }}><ArrowRight size={18}/> Hallediliyor</button>}
                          <button className="btn-success" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }} onClick={() => { updateRequestStatus(selectedReq.id, 'completed'); setSelectedReq({...selectedReq, status: 'completed'}) }}><CheckCircle size={18}/> Çözüldü Olarak Kapat</button>
                          <button className="btn-danger" style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', padding: '0 24px' }} onClick={() => { deleteRequest(selectedReq.id); setSelectedReq(null) }}><Trash2 size={18}/></button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
