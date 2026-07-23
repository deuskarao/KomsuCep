import { useState, useEffect } from 'react';
import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { User, Plus, X, Trash2, Shield, DollarSign, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { confirmAsync } from '../utils/confirmAsync';
import { formatPhone } from '../utils/formatPhone';
import toast from 'react-hot-toast';

export default function Members() {
  const { apt, getUsers, deleteUser, addUserByAdmin, dues, markMultipleDuesAsPaid } = useApt();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Modal state for user details
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [residentType, setResidentType] = useState('');
  const [block, setBlock] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [error, setError] = useState('');
  
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editResidentType, setEditResidentType] = useState('');
  const [editBlock, setEditBlock] = useState('');
  const [editFlatNo, setEditFlatNo] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  const { updateUserByAdmin } = useAuth(); // Need to update this to AuthContext! Wait, I should add updateUserByAdmin to AuthContext or useApt. Wait, I will use AuthContext's updateProfile but need to expose it nicely, or add a specific function. Let's assume we add `updateUserByAdmin` to AuthContext.

  const loadUsers = async () => {
    const fetchedUsers = await getUsers();
    setUsers(fetchedUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const takenFlats = {};
  users.forEach(u => {
    if (u.block && u.flatNo) {
      const key = `${u.block}-${u.flatNo}`;
      takenFlats[key] = (takenFlats[key] || 0) + 1;
    }
  });

  const availableFlats = {};
  if (apt) {
    const bList = apt.blocks?.length > 0 ? apt.blocks : [''];
    bList.forEach(b => {
      availableFlats[b] = [];
      for (let i = 1; i <= (apt.flatsCount || 1); i++) {
        const key = `${b}-${i}`;
        if ((takenFlats[key] || 0) < 2) {
          availableFlats[b].push(i);
        }
      }
    });
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await addUserByAdmin({ name, email, phone, password, residentType, block, flatNo: flatNo ? Number(flatNo) : undefined });
    if (res.success) {
      setShowCreate(false);
      setName(''); setEmail(''); setPhone(''); setPassword(''); setResidentType(''); setBlock(''); setFlatNo(''); setError('');
      loadUsers();
    } else {
      setError(res.message);
    }
  };

  const handleBulkAdd = async () => {
    setBulkError('');
    const lines = bulkText.split('\n').filter(l => l.trim());
    if (lines.length === 0) { setBulkError('En az bir satır girilmelidir.'); return; }
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 5) {
        errors.push(`${i + 1}. satır: Eksik bilgi (Ad, E-posta, Telefon, Blok, Daire gerekli)`);
        failCount++;
        continue;
      }
      const [bulkName, bulkEmail, bulkPhone, bulkBlock, bulkFlat, bulkType] = parts;
      const res = await addUserByAdmin({
        name: bulkName,
        email: bulkEmail,
        phone: bulkPhone.replace(/\D/g, ''),
        password: bulkPhone.replace(/\D/g, ''),
        residentType: bulkType || 'Kiracı',
        block: bulkBlock,
        flatNo: Number(bulkFlat)
      });
      if (res.success) successCount++;
      else { errors.push(`${i + 1}. satır: ${res.message}`); failCount++; }
    }
    
    if (failCount === 0) {
      toast.success(`${successCount} sakin başarıyla eklendi.`);
      setShowBulkAdd(false);
      setBulkText('');
      loadUsers();
    } else {
      setBulkError(`${successCount} eklendi, ${failCount} başarısız.\n${errors.join('\n')}`);
      if (successCount > 0) loadUsers();
    }
  };



  const handleDelete = async (id) => {
    const ok = await confirmAsync({ title: 'Sakini Sil', message: 'Bu sakini silmek istediğinize emin misiniz?', confirmText: 'Sil', danger: true });
    if (ok) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const renderTable = (title, list) => (
    <div className="glass-panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', marginBottom: 16 }}>{title} ({list.length})</h3>
      {list.length === 0 ? (
        <div style={{ padding: 16, color: 'var(--g500)', background: 'var(--g50)', borderRadius: 12, border: '1px solid var(--g200)', textAlign: 'center' }}>Kayıt bulunamadı.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Daire Bilgisi</th>
                <th>Rol</th>
                <th>Katılım Tarihi</th>
                {isAdmin && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)} 
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'admin' ? 'var(--primary)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="white" />
                      </div>
                      <strong style={{ color: 'var(--g900)' }}>{u.name}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{formatPhone(u.phone) || '-'}</td>
                  <td>
                    {u.role === 'admin' && !u.flatNo ? '-' : (
                      <span style={{ fontWeight: 500, color: 'var(--g700)' }}>
                        {u.block ? `${u.block} Blok ` : ''}{u.flatNo ? `Daire ${u.flatNo}` : 'Belirtilmemiş'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'in-progress' : 'completed'}`}>
                      {u.role === 'admin' ? 'Yönetici' : (u.residentType || 'Sakin')}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      {u.role !== 'admin' && isAdmin && (
                        <button className="btn-danger" onClick={() => handleDelete(u.id)}><Trash2 size={16} /></button>
                      )}
                      {u.role === 'admin' && (
                        <div style={{ padding: 8, color: 'var(--primary)' }}><Shield size={18} /></div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Sakinler</h2>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" onClick={() => setShowBulkAdd(true)}><Plus size={18} /> Toplu Ekle</button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Yeni Sakin Ekle</button>
          </div>
        )}
      </div>

      {users.length === 0 ? (
        <div className="glass-panel empty-state" style={{ padding: 24 }}><p>Sakin bulunamadı.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {renderTable('Kiracılar', users.filter(u => u.residentType === 'Kiracı' && u.role !== 'admin'))}
          {renderTable('Ev Sahipleri', users.filter(u => u.residentType === 'Ev Sahibi' && u.role !== 'admin'))}
          {renderTable('Yöneticiler', users.filter(u => u.role === 'admin'))}
        </div>
      )}

      <AnimatePresence>
        {showBulkAdd && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel" style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h2>Toplu Sakin Ekleme</h2>
                <button type="button" className="modal-close" onClick={() => setShowBulkAdd(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--primary)', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                  <strong>Format:</strong> Her satırda bir sakin olacak şekilde virgülle ayırın.<br />
                  <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>Ad Soyad, E-posta, Telefon, Blok, Daire, Kişi Türü</code><br />
                  <span style={{ fontSize: 12, color: 'var(--g500)' }}>Kişi Türü opsiyoneldir, girilmezse "Kiracı" olarak eklenir. Şifre olarak telefon numarası kullanılır.</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--g200)', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: 'var(--g500)', fontFamily: 'monospace' }}>
                  Ahmet Yılmaz, ahmet@email.com, 05321112233, A, 5<br />
                  Ayşe Demir, ayse@email.com, 05352223344, B, 12, Ev Sahibi<br />
                  Mehmet Kaya, mehmet@email.com, 05383334455, A, 3
                </div>
                <textarea
                  className="glass-input"
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={"Ahmet Yılmaz, ahmet@email.com, 05321112233, A, 5\nAyşe Demir, ayse@email.com, 05352223344, B, 12, Ev Sahibi"}
                  style={{ width: '100%', minHeight: 200, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, resize: 'vertical' }}
                />
                {bulkError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: 12, borderRadius: 8, marginTop: 12, fontSize: 13, whiteSpace: 'pre-wrap' }}>{bulkError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => { setShowBulkAdd(false); setBulkText(''); setBulkError(''); }}>İptal</button>
                <button type="button" className="btn-primary" onClick={handleBulkAdd}>Ekle</button>
              </div>
            </motion.div>
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel" style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h2>Yeni Sakin Ekle</h2>
                <button type="button" className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Ad Soyad</label>
                      <input className="glass-input" required value={name} onChange={e=>setName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>E-posta</label>
                      <input type="email" className="glass-input" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="ahmet@example.com" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Telefon Numarası</label>
                      <input type="tel" className="glass-input" value={formatPhone(phone)} onChange={e=>setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="05XX XXX XX XX" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Geçici Şifre</label>
                      <input type="password" className="glass-input" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="En az 6 karakter" minLength={6} />
                    </div>
                    
                    {/* Blok ve Daire No Yan Yana */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16 }}>
                      {apt?.blocks?.length > 0 && (
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Blok</label>
                          <select className="glass-input" required value={block} onChange={e=>{setBlock(e.target.value); setFlatNo('');}}>
                            <option value="">Seçiniz</option>
                            {apt.blocks.map(b => {
                              const hasSpace = (availableFlats[b] || []).length > 0;
                              return <option key={b} value={b} disabled={!hasSpace}>{b} Blok{!hasSpace ? ' (Dolu)' : ''}</option>;
                            })}
                          </select>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Daire No</label>
                        <select className="glass-input" required value={flatNo} onChange={e=>setFlatNo(e.target.value)} disabled={!block && apt?.blocks?.length > 0}>
                          <option value="">Seçiniz</option>
                          {(availableFlats[block] || []).map(num => (
                            <option key={num} value={num}>Daire {num}</option>
                          ))}
                        </select>
                        {block && (availableFlats[block] || []).length === 0 && (
                          <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Bu bloktaki tüm daireler dolu.</p>
                        )}
                      </div>
                    </div>

                    {/* Rol Seçimi Altta */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Kişi Türü (Rol)</label>
                      <select className="glass-input" required value={residentType} onChange={e=>setResidentType(e.target.value)}>
                        <option value="">Seçiniz</option>
                        <option value="Kiracı">Kiracı</option>
                        <option value="Ev Sahibi">Ev Sahibi</option>
                        <option value="Yönetici">Yönetici</option>
                      </select>
                    </div>
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

        {selectedUser && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel">
              <div className="modal-header">
                <h2>{selectedUser.name} - Detaylar</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {isAdmin && selectedUser.role !== 'admin' && (
                    <button className="btn-outline" onClick={() => {
                      setEditUser(selectedUser);
                      setEditName(selectedUser.name);
                      setEditPhone(selectedUser.phone || '');
                      setEditResidentType(selectedUser.residentType || '');
                      setEditBlock(selectedUser.block || '');
                      setEditFlatNo(selectedUser.flatNo || '');
                      setShowChangePass(false);
                      setNewPass('');
                      setNewPassConfirm('');
                      setShowEdit(true);
                      setSelectedUser(null);
                    }}>Düzenle</button>
                  )}
                  <button className="modal-close" onClick={() => setSelectedUser(null)}><X size={20} /></button>
                </div>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--g50)', borderRadius: 12, border: '1px solid var(--g200)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--g600)' }}><strong>Kişi Türü:</strong> {selectedUser.residentType || 'Sakin'}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--g600)' }}><strong>Daire Bilgisi:</strong> {selectedUser.block ? `${selectedUser.block} Blok ` : ''}{selectedUser.flatNo ? `Daire ${selectedUser.flatNo}` : 'Belirtilmemiş'}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--g600)' }}><strong>E-posta:</strong> {selectedUser.email}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--g600)' }}><strong>Telefon:</strong> {formatPhone(selectedUser.phone) || 'Belirtilmemiş'}</p>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--g600)' }}><strong>Kayıt Tarihi:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g900)', marginBottom: 16 }}>Ödenmemiş Aidat Borçları</h3>
                {(() => {
                  const unpaidDues = dues.filter(d => d.userId === selectedUser.id && d.status === 'unpaid');
                  if (unpaidDues.length === 0) {
                    return <p style={{ color: 'var(--g500)', fontSize: 14 }}>Ödenmemiş borç bulunmamaktadır.</p>;
                  }
                  
                  const totalDebt = unpaidDues.reduce((s, d) => s + Number(d.amount), 0);
                  
                  return (
                    <div>
                      <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16, border: '1px solid var(--g200)', borderRadius: 8 }}>
                        <table style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ background: 'var(--g50)', padding: '8px 12px' }}>Dönem</th>
                              <th style={{ background: 'var(--g50)', padding: '8px 12px', textAlign: 'right' }}>Tutar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unpaidDues.map(d => (
                              <tr key={d.id} style={{ borderBottom: '1px solid var(--g100)' }}>
                                <td style={{ padding: '8px 12px', fontSize: 14 }}>{d.month}/{d.year}</td>
                                <td style={{ padding: '8px 12px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>₺{d.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--danger-light)', padding: 16, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--danger)' }}>Toplam Borç: ₺{totalDebt}</div>
                        {isAdmin && (
                          <button 
                            className="btn-success" 
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={async () => {
                              const ok = await confirmAsync({ title: 'Toplu Tahsilat', message: 'Tüm borç tek kalemde tahsil edilecek. Kasa açıklamasına tüm aylar yazılacaktır. Onaylıyor musunuz?', confirmText: 'Tahsil Et' });
                              if(ok) {
                                markMultipleDuesAsPaid(unpaidDues.map(d => d.id));
                                setSelectedUser(null);
                                toast.success('Tahsilat başarıyla tamamlandı!');
                              }
                            }}
                          >
                            <DollarSign size={16} /> Tüm Borcu Tahsil Et
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
        {showEdit && editUser && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel" style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h2>Kullanıcı Düzenle</h2>
                <button className="modal-close" onClick={() => setShowEdit(false)}><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const updates = {
                  name: editName,
                  phone: editPhone,
                  residentType: editResidentType
                };
                if (editBlock) updates.block = editBlock;
                if (editFlatNo) updates.flatNo = Number(editFlatNo);
                
                await updateUserByAdmin(editUser.id, updates);
                setShowEdit(false);
                loadUsers();
                toast.success('Kullanıcı bilgileri güncellendi.');
              }}>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Ad Soyad</label>
                      <input className="glass-input" required value={editName} onChange={e=>setEditName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Telefon Numarası</label>
                      <input type="tel" className="glass-input" value={formatPhone(editPhone)} onChange={e=>setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} />
                    </div>

                    {/* Blok ve Daire No Yan Yana */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16 }}>
                      {apt?.blocks?.length > 0 && (
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Blok</label>
                          <select className="glass-input" required value={editBlock} onChange={e=>{setEditBlock(e.target.value); setEditFlatNo('');}}>
                            <option value="">Seçiniz</option>
                            {apt.blocks.map(b => {
                              const isCurrent = b === editUser?.block;
                              const hasSpace = (availableFlats[b] || []).length > 0;
                              const willShow = hasSpace || isCurrent;
                              return <option key={b} value={b} disabled={!willShow}>{b} Blok{!hasSpace && isCurrent ? ' (Mevcut)' : !willShow ? ' (Dolu)' : ''}</option>;
                            })}
                          </select>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Daire No</label>
                        <select className="glass-input" required value={editFlatNo} onChange={e=>setEditFlatNo(e.target.value)} disabled={!editBlock && apt?.blocks?.length > 0}>
                          <option value="">Seçiniz</option>
                          {(() => {
                            const flats = availableFlats[editBlock] || [];
                            const currentFlat = editUser?.flatNo;
                            const isCurrentFlat = currentFlat && !flats.includes(currentFlat) && editBlock === editUser?.block;
                            return (
                              <>
                                {flats.map(num => (
                                  <option key={num} value={num}>Daire {num}</option>
                                ))}
                                {isCurrentFlat && <option value={currentFlat}>Daire {currentFlat} (Mevcut)</option>}
                              </>
                            );
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Rol Seçimi Altta */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Kişi Türü (Rol)</label>
                      <select className="glass-input" required value={editResidentType} onChange={e=>setEditResidentType(e.target.value)}>
                        <option value="">Seçiniz</option>
                        <option value="Kiracı">Kiracı</option>
                        <option value="Ev Sahibi">Ev Sahibi</option>
                        <option value="Yönetici">Yönetici</option>
                      </select>
                    </div>
                  </div>

                  {/* Şifre Değiştir */}
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--g200)', paddingTop: 16 }}>
                    <button type="button" className="btn-outline" onClick={() => setShowChangePass(!showChangePass)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}>
                      <Key size={16} /> Şifre Değiştir
                    </button>
                    <AnimatePresence>
                      {showChangePass && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Yeni Şifre</label>
                              <input type="password" className="glass-input" minLength={8} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="En az 8 karakter" />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Yeni Şifre (Tekrar)</label>
                              <input type="password" className="glass-input" minLength={8} value={newPassConfirm} onChange={e=>setNewPassConfirm(e.target.value)} placeholder="Şifreyi tekrar girin" />
                            </div>
                            <button type="button" className="btn-primary" onClick={async () => {
                              if (!newPass || newPass.length < 8) { toast.error('Şifre en az 8 karakter olmalı'); return; }
                              if (newPass !== newPassConfirm) { toast.error('Şifreler eşleşmiyor'); return; }
                              await updateUserByAdmin(editUser.id, { password: newPass });
                              setShowChangePass(false);
                              setNewPass('');
                              setNewPassConfirm('');
                              toast.success('Şifre güncellendi.');
                            }}>Şifreyi Güncelle</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setShowEdit(false)}>İptal</button>
                  <button type="submit" className="btn-primary">Değişiklikleri Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
