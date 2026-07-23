import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, XCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const inputStyle = { paddingRight: 40, height: 48 };
const iconWrap = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)', display: 'flex', alignItems: 'center', pointerEvents: 'none' };
const fieldWrap = { position: 'relative' };

function PasswordField({ label, value, onChange, showPass, setShowPass, placeholder, ...rest }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 13, color: 'var(--g600)', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
      <div style={fieldWrap}>
        <div style={iconWrap}><Lock size={16} /></div>
        <input className="glass-input" type={showPass ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder || '••••••••'} style={{ paddingLeft: 40, paddingRight: 44, height: 48, ...rest.style }} {...rest} />
        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--g400)', display: 'flex', alignItems: 'center' }}>
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Sıfırlama bağlantısı geçersiz (Token bulunamadı).');
      return;
    }

    if (pass !== confirmPass) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    
    if (pass.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    const res = await resetPassword(token, pass);
    if (!res.success) {
      setError(res.message);
      toast.error(res.message);
    } else {
      setSuccess(true);
      toast.success('Şifreniz başarıyla güncellendi.');
      setTimeout(() => {
        window.location.href = '/'; // Go to login
      }, 2000);
    }
  };

  const inputAnim = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: '100%', maxWidth: 420, padding: '36px 32px', borderRadius: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/favicon.svg" alt="KomşuCep" style={{ width: 56, height: 56, marginBottom: 12 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)', margin: 0 }}>Yeni Şifre</h1>
          <p style={{ color: 'var(--g500)', fontSize: 13, marginTop: 4 }}>Yeni şifrenizi belirleyin.</p>
        </div>

        {success ? (
          <motion.div {...inputAnim} style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--primary)" style={{ margin: '0 auto', marginBottom: 16 }} />
            <p style={{ color: 'var(--g700)', fontWeight: 500, marginBottom: 24 }}>Şifreniz başarıyla güncellendi. Yönlendiriliyorsunuz...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PasswordField label="Yeni Şifre" value={pass} onChange={e => setPass(e.target.value)} showPass={showPass} setShowPass={setShowPass} />
            <PasswordField label="Yeni Şifre (Tekrar)" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} showPass={showPass} setShowPass={setShowPass} />
            
            {error && (
              <motion.div {...inputAnim} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={16} /> {error}
              </motion.div>
            )}
            
            <button type="submit" className="btn-primary" style={{ height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600, marginTop: 4 }}>Şifreyi Güncelle</button>
            <button type="button" onClick={() => window.location.href = '/'} className="btn-outline" style={{ height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600 }}>Giriş Sayfasına Dön</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
