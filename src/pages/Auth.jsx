import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Eye, EyeOff, X, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const inputStyle = { paddingRight: 40, height: 48 };
const iconWrap = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)', display: 'flex', alignItems: 'center', pointerEvents: 'none' };
const fieldWrap = { position: 'relative' };

function InputField({ icon: Icon, label, ...props }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 13, color: 'var(--g600)', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
      <div style={fieldWrap}>
        {Icon && <div style={iconWrap}><Icon size={16} /></div>}
        <input className="glass-input" {...props} style={{ ...inputStyle, paddingLeft: Icon ? 40 : 16, ...props.style }} />
      </div>
    </div>
  );
}

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

export default function Auth() {
  const { login, forgotPassword } = useAuth();
  const [remember, setRemember] = useState(false);

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await login(email, pass);
    if (!res.success) {
      setLoginError(res.message);
      toast.error(res.message);
    } else {
      toast.success('Giriş başarılı');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('E-posta adresi gerekli'); return; }
    const res = await forgotPassword(forgotEmail.trim());
    if (res.success) {
      toast.success('Şifre sıfırlama talebiniz yöneticiye iletildi.', { duration: 5000 });
      setShowForgot(false);
      setForgotEmail('');
    } else {
      toast.error(res.message);
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)', margin: 0 }}>KomşuCep</h1>
          <p style={{ color: 'var(--g500)', fontSize: 13, marginTop: 4 }}>Modern yaşam, kolay yönetim</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputField icon={Mail} label="E-posta" type="email" placeholder="ornek@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
          <PasswordField label="Şifre" value={pass} onChange={e => setPass(e.target.value)} showPass={showPass} setShowPass={setShowPass} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--g600)', cursor: 'pointer', userSelect: 'none' }} onClick={() => setRemember(!remember)}>
              <span style={{ width: 20, height: 20, borderRadius: 6, border: remember ? 'none' : '2px solid var(--g300)', background: remember ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                {remember && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </span>
              Beni Hatırla
            </label>
            <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Şifremi Unuttum</button>
          </div>
          {loginError && (
            <motion.div {...inputAnim} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={16} /> {loginError}
            </motion.div>
          )}
          <button type="submit" className="btn-primary" style={{ height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600, marginTop: 4 }}>Giriş Yap</button>
        </form>
      </motion.div>

      <AnimatePresence>
        {showForgot && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal glass-panel" style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <h2>Şifre Sıfırlama</h2>
                <button type="button" className="modal-close" onClick={() => setShowForgot(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleForgotPassword}>
                <div className="modal-body">
                  <p style={{ fontSize: 14, color: 'var(--g600)', marginBottom: 16, lineHeight: 1.5 }}>E-posta adresinizi girin. Şifrenizi sıfırlamanız için size bir bağlantı göndereceğiz.</p>
                  <InputField icon={Mail} label="E-posta Adresi" type="email" placeholder="ornek@email.com" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setShowForgot(false)}>İptal</button>
                  <button type="submit" className="btn-primary">Talep Gönder</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
