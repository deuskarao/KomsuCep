import { useState } from 'react';
import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { Copy, RefreshCw, Trash2, ChevronDown, ChevronUp, Building, Hash, AlertTriangle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { confirmAsync } from '../utils/confirmAsync';
import { formatPhone } from '../utils/formatPhone';

export default function Settings() {
  const { apt, updateApartmentDetails, generateNewCode, deleteApartment, deleteUser } = useApt();
  const { currentUser, updateProfile, logout } = useAuth();
  
  const [aptName, setAptName] = useState(apt?.name || '');
  const [dues, setDues] = useState(apt?.monthlyDues || 0);
  const [flatsCount, setFlatsCount] = useState(apt?.flatsCount || 1);
  const [blocksCount, setBlocksCount] = useState(apt?.blocks?.length || 0);

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileBlock, setProfileBlock] = useState(currentUser?.block || '');
  const [profileFlatNo, setProfileFlatNo] = useState(currentUser?.flatNo || '');

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profileOldPassword, setProfileOldPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileNewPasswordConfirm, setProfileNewPasswordConfirm] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleSaveApt = (e) => {
    e.preventDefault();
    if (!aptName.trim()) { toast.error('Apartman ismi gerekli'); return; }
    
    const updates = { name: aptName };
    
    if (dues >= 0 && Number(dues) !== Number(apt?.monthlyDues || 0)) {
      updates.monthlyDues = Number(dues);
    }
    
    if (flatsCount > 0 && Number(flatsCount) !== Number(apt?.flatsCount)) {
      updates.flatsCount = Number(flatsCount);
    }

    if (Number(blocksCount) !== (apt?.blocks?.length || 0)) {
      const c = Number(blocksCount);
      const blocksArray = [];
      if (c > 0) {
        for (let i = 0; i < c; i++) {
          blocksArray.push(String.fromCharCode(65 + i));
        }
      }
      updates.blocks = blocksArray;
    }

    updateApartmentDetails(updates);
    toast.success('Apartman ayarları güncellendi.');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) { toast.error('İsim gerekli'); return; }
    if (!profileBlock) { toast.error('Blok seçimi zorunludur'); return; }
    if (!profileFlatNo) { toast.error('Daire seçimi zorunludur'); return; }
    
    const updates = { name: profileName, phone: profilePhone, block: profileBlock, flatNo: profileFlatNo ? Number(profileFlatNo) : undefined };
    
    const res = await updateProfile(currentUser.id, updates);
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    toast.success('Profil ayarlarınız başarıyla güncellendi.');
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (profileOldPassword !== currentUser.password) {
      toast.error('Mevcut şifrenizi yanlış girdiniz!');
      return;
    }
    if (profileNewPassword.length < 4) {
      toast.error('Yeni şifre en az 4 karakter olmalıdır.');
      return;
    }
    if (profileNewPassword !== profileNewPasswordConfirm) {
      toast.error('Yeni şifreler eşleşmiyor!');
      return;
    }
    
    const res = await updateProfile(currentUser.id, { password: profileNewPassword });
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setShowPasswordChange(false);
    setProfileOldPassword('');
    setProfileNewPassword('');
    setProfileNewPasswordConfirm('');
    toast.success('Şifreniz başarıyla güncellendi.');
  };

  const handleDeleteApartment = async () => {
    const confirmName = await confirmAsync({
      title: 'Apartmanı Sil',
      message: `DİKKAT: Bu işlem apartmana ait tüm verileri ve kullanıcıları KALICI OLARAK SİLECEKTİR!\n\nOnaylamak için lütfen apartman adını (${apt?.name}) yazın:`,
      confirmText: 'Kalıcı Olarak Sil',
      cancelText: 'İptal',
      danger: true,
      prompt: true
    });
    if (confirmName === apt?.name) {
      deleteApartment();
      logout();
      toast.success('Apartman ve tüm kayıtları kalıcı olarak silindi.');
    } else if (confirmName !== false && confirmName !== '') {
      toast.error('Apartman adını yanlış girdiniz, silme işlemi iptal edildi.');
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(apt?.code).then(() => toast.success('Kod kopyalandı!'));
    } else {
      toast.success('Kod: ' + apt?.code);
    }
  };

  const handleNewCode = async () => {
    const ok = await confirmAsync({ title: 'Yeni Kod Üret', message: 'Eski kod iptal edilecek ve yeni bir kod üretilecek. Onaylıyor musunuz?', confirmText: 'Üret' });
    if (ok) {
      try {
        const newCode = await generateNewCode();
        toast.success('Yeni kodunuz: ' + newCode);
      } catch (err) {
        toast.error('Kod üretilirken hata oluştu');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Ayarlar</h2>
      </div>

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {currentUser?.role === 'admin' ? (
            <>
            <form onSubmit={handleSaveApt} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid var(--g200)', paddingBottom: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building size={18} color="var(--g700)" />
                  Genel Bilgiler
                </h3>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Apartman Adı</label>
                <input className="glass-input" required value={aptName} onChange={e=>setAptName(e.target.value)} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Blok Sayısı</label>
                <input type="number" min="0" className="glass-input" value={blocksCount} onChange={e=>setBlocksCount(e.target.value)} placeholder="Örn: 3 (Yoksa 0 bırakın)" />
                <p style={{ color: 'var(--g500)', fontSize: 12, marginTop: 6 }}>Örn: 3 girerseniz, sistem A, B ve C bloklarını otomatik oluşturur.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>{apt?.blocks?.length > 0 ? 'Blok Başına Daire Sayısı' : 'Toplam Daire Sayısı'}</label>
                <input type="number" className="glass-input" required min="1" value={flatsCount} onChange={e=>setFlatsCount(e.target.value)} />
                <p style={{ color: 'var(--g500)', fontSize: 12, marginTop: 6 }}>Tamirat masrafları bölünürken ve daire seçiminde baz alınır.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Aylık Aidat (TL)</label>
                <input type="number" className="glass-input" required min="0" value={dues} onChange={e=>setDues(e.target.value)} />
                <p style={{ color: 'var(--g500)', fontSize: 12, marginTop: 6 }}>Güncellendiğinde tüm sakinlere otomatik bildirim gönderilir.</p>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Ayarları Kaydet</button>
            </form>

            {/* Admin: Şifre Değiştir sol kolonda */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowPasswordChange(!showPasswordChange)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} color="var(--g700)" />
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--g900)', margin: 0 }}>Şifre Değiştir</h3>
                </div>
                {showPasswordChange ? <ChevronUp size={18} color="var(--g500)" /> : <ChevronDown size={18} color="var(--g500)" />}
              </div>
              <AnimatePresence>
                {showPasswordChange && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <form onSubmit={handleSavePassword} style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Mevcut Şifre</label>
                          <input type="password" required className="glass-input" value={profileOldPassword} onChange={e=>setProfileOldPassword(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Yeni Şifre</label>
                          <input type="password" required className="glass-input" minLength={8} value={profileNewPassword} onChange={e=>setProfileNewPassword(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Yeni Şifre (Tekrar)</label>
                          <input type="password" required className="glass-input" minLength={8} value={profileNewPasswordConfirm} onChange={e=>setProfileNewPasswordConfirm(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary">Güncelle</button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <div className="glass-panel" style={{ padding: 24 }}>
              <div style={{ borderBottom: '1px solid var(--g200)', paddingBottom: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building size={18} color="var(--g700)" />
                  Genel Bilgiler
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'var(--g500)', fontSize: 12 }}>Apartman Adı</label>
                  <p style={{ color: 'var(--g900)', fontWeight: 500, fontSize: 14, margin: 0 }}>{apt?.name}</p>
                </div>
                {apt?.blocks?.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, color: 'var(--g500)', fontSize: 12 }}>Blok Sayısı</label>
                    <p style={{ color: 'var(--g900)', fontWeight: 500, fontSize: 14, margin: 0 }}>{apt.blocks.length} ({apt.blocks.join(', ')})</p>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'var(--g500)', fontSize: 12 }}>{apt?.blocks?.length > 0 ? 'Blok Başına Daire' : 'Toplam Daire'}</label>
                  <p style={{ color: 'var(--g900)', fontWeight: 500, fontSize: 14, margin: 0 }}>{apt?.flatsCount || 1}</p>
                </div>
              </div>
            </div>
          )}

          {/* Non-admin: Collapsibles sol kolonda */}
          {currentUser?.role !== 'admin' && (
            <>
              {/* Change Password */}
              <div className="glass-panel" style={{ padding: 24 }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={18} color="var(--g700)" />
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--g900)', margin: 0 }}>Şifre Değiştir</h3>
                  </div>
                  {showPasswordChange ? <ChevronUp size={18} color="var(--g500)" /> : <ChevronDown size={18} color="var(--g500)" />}
                </div>
                <AnimatePresence>
                  {showPasswordChange && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <form onSubmit={handleSavePassword} style={{ marginTop: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Mevcut Şifre</label>
                            <input type="password" required className="glass-input" value={profileOldPassword} onChange={e=>setProfileOldPassword(e.target.value)} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Yeni Şifre</label>
                            <input type="password" required className="glass-input" minLength={8} value={profileNewPassword} onChange={e=>setProfileNewPassword(e.target.value)} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Yeni Şifre (Tekrar)</label>
                            <input type="password" required className="glass-input" minLength={8} value={profileNewPasswordConfirm} onChange={e=>setProfileNewPasswordConfirm(e.target.value)} />
                          </div>
                          <button type="submit" className="btn-primary">Güncelle</button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Danger Zone */}
              <div className="glass-panel" style={{ padding: 24 }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowDangerZone(!showDangerZone)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} color="var(--danger)" />
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--danger)', margin: 0 }}>Tehlikeli Alan</h3>
                  </div>
                  {showDangerZone ? <ChevronUp size={18} color="var(--danger)" /> : <ChevronDown size={18} color="var(--danger)" />}
                </div>
                <AnimatePresence>
                  {showDangerZone && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ marginTop: 20 }}>
                        <p style={{ color: 'var(--g600)', fontSize: 13, marginBottom: 12 }}>
                          Hesabınız ve verileriniz silinir. Bu işlem geri alınamaz.
                        </p>
                        <button type="button" onClick={async () => {
                          const confirmName = await confirmAsync({
                            title: 'Hesabı Sil',
                            message: `Hesabınızı KALICI OLARAK SİLECEKTİR!\nOnaylamak için adınızı (${currentUser?.name}) yazın:`,
                            confirmText: 'Sil',
                            danger: true,
                            prompt: true
                          });
                          if (confirmName === currentUser?.name) {
                            deleteUser(currentUser.id);
                            logout();
                            toast.success('Hesabınız kalıcı olarak silindi.');
                          }
                        }} className="btn-danger" style={{ width: '100%', fontSize: 13 }}>
                          Hesabımı Sil
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Apartman Kodu (Admin) */}
          {currentUser?.role === 'admin' && (
            <div className="glass-panel" style={{ padding: 24 }}>
              <div style={{ borderBottom: '1px solid var(--g200)', paddingBottom: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hash size={18} color="var(--g700)" />
                  Apartman Katılım Kodu
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  className="glass-input" 
                  readOnly 
                  value={apt?.code || ''} 
                  style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--g900)', fontWeight: 600, background: 'var(--g50)', flex: 1 }} 
                />
                <button type="button" className="btn-outline" onClick={handleCopy} title="Kopyala"><Copy size={16} /></button>
                <button type="button" className="btn-outline" onClick={handleNewCode} title="Yeni Kod Üret"><RefreshCw size={16} /></button>
              </div>
            </div>
          )}

          {/* Profil */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ borderBottom: '1px solid var(--g200)', paddingBottom: 16, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--g700)" />
                Profil Ayarlarım
              </h3>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Ad Soyad</label>
                <input className="glass-input" required value={profileName} onChange={e=>setProfileName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>E-posta</label>
                  <input type="email" className="glass-input" readOnly value={currentUser?.email || ''} style={{ background: 'var(--g50)', color: 'var(--g600)', cursor: 'not-allowed' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Telefon Numarası</label>
                  <input type="tel" className="glass-input" value={formatPhone(profilePhone)} onChange={e=>setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="05XX XXX XX XX" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                {apt?.blocks?.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Blok</label>
                    <select className="glass-input" required value={profileBlock} onChange={e=>setProfileBlock(e.target.value)}>
                      <option value="">Seçiniz</option>
                      {apt.blocks.map(b => <option key={b} value={b}>{b} Blok</option>)}
                    </select>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500, fontSize: 13 }}>Daire No</label>
                  <select className="glass-input" required value={profileFlatNo} onChange={e=>setProfileFlatNo(e.target.value)}>
                    <option value="">Seçiniz</option>
                    {Array.from({ length: apt?.flatsCount || 1 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Daire {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Profili Güncelle</button>
            </form>
          </div>

          {/* Admin: Tehlikeli Alan sağ kolonda */}
          {currentUser?.role === 'admin' && (
            <div className="glass-panel" style={{ padding: 24 }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowDangerZone(!showDangerZone)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} color="var(--danger)" />
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--danger)', margin: 0 }}>Tehlikeli Alan</h3>
                  </div>
                  {showDangerZone ? <ChevronUp size={18} color="var(--danger)" /> : <ChevronDown size={18} color="var(--danger)" />}
                </div>
                <AnimatePresence>
                  {showDangerZone && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ marginTop: 20 }}>
                        <p style={{ color: 'var(--g600)', fontSize: 13, marginBottom: 12 }}>
                          Tüm sistem verileri (kasa, kullanıcılar, duyurular vb.) kalıcı olarak silinir.
                        </p>
                        <button type="button" onClick={handleDeleteApartment} className="btn-danger" style={{ width: '100%', fontSize: 13 }}>
                          Apartmanı Kalıcı Olarak Sil
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
