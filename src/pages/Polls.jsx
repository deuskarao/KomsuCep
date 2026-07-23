import { useState } from 'react';
import { useApt } from '../context/AptContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, Trash2, CheckCircle, Clock, Check, Ban } from 'lucide-react';
import { confirmAsync } from '../utils/confirmAsync';
import toast from 'react-hot-toast';

export default function Polls() {
  const { polls, addPoll, approvePoll, rejectPoll, votePoll, deletePoll } = useApt();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const approvedPolls = polls.filter(p => p.status === 'approved');
  const myPendingPolls = polls.filter(p => p.status === 'pending' && p.createdBy === currentUser?.id);
  const pendingPolls = polls.filter(p => p.status === 'pending');

  const handleCreate = (e) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      toast.error('Soru ve en az 2 geçerli seçenek girilmelidir.');
      return;
    }
    if (isAdmin) {
      addPoll({ question, options: validOptions, status: 'approved' });
      toast.success('Anket yayınlandı.');
    } else {
      addPoll({ question, options: validOptions, status: 'pending' });
      toast.success('Anketiniz yönetici onayına gönderildi.');
    }
    setShowCreate(false);
    setQuestion('');
    setOptions(['', '']);
  };

  const calculateResults = (poll) => {
    const totalVotes = Object.keys(poll.votes || {}).length;
    const results = poll.options.map((opt, index) => {
      const count = Object.values(poll.votes || {}).filter(v => v === index).length;
      const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      return { text: opt, count, percentage, index };
    });
    return { totalVotes, results };
  };

  const renderPollCard = (poll) => {
    const hasVoted = poll.votes[currentUser?.id] !== undefined;
    const { totalVotes, results } = calculateResults(poll);

    return (
      <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: 24, position: 'relative' }}>
        {isAdmin && (
          <button onClick={async () => { const ok = await confirmAsync({ title: 'Anketi Sil', message: 'Bu anketi silmek istediğinize emin misiniz?', confirmText: 'Sil', danger: true }); if (ok) deletePoll(poll.id); }} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }} title="Anketi Sil">
            <Trash2 size={16} />
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--primary-light)', padding: 12, borderRadius: 12 }}><BarChart2 size={24} color="var(--primary)" /></div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--g900)', paddingRight: isAdmin ? 32 : 0, lineHeight: 1.3 }}>{poll.question}</h3>
        </div>
        
        <p style={{ color: 'var(--g500)', fontSize: 13, marginBottom: 20 }}>Oluşturulma: {new Date(poll.createdAt).toLocaleDateString()} • {totalVotes} Oy</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results.map((res) => {
            const isMyVote = poll.votes[currentUser?.id] === res.index;
            return (
              <div key={res.index} style={{ position: 'relative' }}>
                <button 
                  onClick={() => votePoll(poll.id, res.index)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12, border: isMyVote ? '2px solid var(--primary)' : '1px solid var(--g200)', background: isMyVote ? 'var(--primary-light)' : '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                  }}
                >
                  {hasVoted && (
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${res.percentage}%`, background: 'var(--g100)', zIndex: 0, transition: 'width 0.5s ease-out' }}></div>
                  )}
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, fontWeight: isMyVote ? 600 : 500, color: isMyVote ? 'var(--primary)' : 'var(--g700)' }}>
                    {isMyVote && <CheckCircle size={16} />}
                    {res.text}
                  </div>
                  {hasVoted && (
                    <div style={{ position: 'relative', zIndex: 1, fontWeight: 600, color: 'var(--g600)', fontSize: 14 }}>{res.percentage}%</div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {hasVoted && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--success)', marginTop: 16, fontWeight: 500 }}>Oyunuz kaydedildi. Katılımınız için teşekkürler!</p>}
      </motion.div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--g900)' }}>Anketler</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Yeni Anket {isAdmin ? 'Oluştur' : 'Öner'}</button>
      </div>

      {isAdmin && pendingPolls.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g700)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} /> Onay Bekleyen Anketler ({pendingPolls.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {pendingPolls.map(poll => (
              <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'var(--warning-light, rgba(245,158,11,0.1))', padding: 8, borderRadius: 8 }}><Clock size={18} color="var(--warning, #f59e0b)" /></div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--g900)', margin: 0 }}>{poll.question}</h4>
                </div>
                <p style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 12 }}>Seçenekler: {poll.options.join(' / ')}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', fontSize: 13 }} onClick={async () => {
                    const ok = await confirmAsync({ title: 'Anketi Onayla', message: `"${poll.question}" anketini onaylayıp yayınlamak istiyor musunuz?`, confirmText: 'Onayla' });
                    if (ok) { approvePoll(poll.id); toast.success('Anket onaylandı ve yayınlandı.'); }
                  }}><Check size={14} /> Onayla</button>
                  <button className="btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', fontSize: 13 }} onClick={async () => {
                    const ok = await confirmAsync({ title: 'Anketi Reddet', message: `"${poll.question}" anketini reddetmek istiyor musunuz?`, confirmText: 'Reddet', danger: true });
                    if (ok) { rejectPoll(poll.id); toast.success('Anket reddedildi.'); }
                  }}><Ban size={14} /> Reddet</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {!isAdmin && myPendingPolls.map(poll => (
          <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: 24, borderLeft: '4px solid var(--warning, #f59e0b)', opacity: 0.8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Clock size={18} color="var(--warning, #f59e0b)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning, #f59e0b)', background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: 20 }}>Onay Bekliyor</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--g900)', marginBottom: 8 }}>{poll.question}</h3>
            <p style={{ color: 'var(--g500)', fontSize: 13, marginBottom: 8 }}>Seçenekler: {poll.options.join(' / ')}</p>
            <p style={{ color: 'var(--g400)', fontSize: 12 }}>Oluşturulma: {new Date(poll.createdAt).toLocaleDateString()}</p>
          </motion.div>
        ))}
        {approvedPolls.map(poll => renderPollCard(poll))}
        {approvedPolls.length === 0 && (isAdmin ? pendingPolls.length === 0 : myPendingPolls.length === 0) && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 24, border: '1px dashed var(--primary-light)' }}>
            <div style={{ background: 'var(--primary-light)', padding: 24, borderRadius: '50%', marginBottom: 20 }}>
              <BarChart2 size={48} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--g900)', marginBottom: 8 }}>Henüz Hiç Anket Yok</h3>
            <p style={{ color: 'var(--g600)', fontSize: 15, maxWidth: 400 }}>{isAdmin ? 'Sakinlerin fikrini almak için "Yeni Anket Oluştur" butonunu kullanın.' : 'Yöneticiniz henüz anket oluşturmadı. Siz de "Yeni Anket Öner" ile öneride bulunabilirsiniz.'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay active">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal glass-panel">
              <div className="modal-header">
                <h2>{isAdmin ? 'Yeni Anket Oluştur' : 'Anket Önerisi'}</h2>
                <button type="button" className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {!isAdmin && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--warning, #92400e)', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                      Anketiniz yönetici onayından sonra yayınlanacaktır.
                    </div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Anket Sorusu</label>
                    <input className="glass-input" required value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Örn: Kapıcı saatleri değişsin mi?" />
                  </div>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--g700)', fontWeight: 500 }}>Seçenekler</label>
                  {options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input className="glass-input" value={opt} onChange={e => {
                        const newOpts = [...options];
                        newOpts[i] = e.target.value;
                        setOptions(newOpts);
                      }} placeholder={`Seçenek ${i + 1}`} />
                      {options.length > 2 && (
                        <button type="button" className="btn-danger" style={{ padding: '0 12px' }} onClick={() => setOptions(options.filter((_, idx) => idx !== i))}><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <button type="button" className="btn-outline" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setOptions([...options, ''])}><Plus size={16} /> Seçenek Ekle</button>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>İptal</button>
                  <button type="submit" className="btn-primary">{isAdmin ? 'Anketi Yayınla' : 'Onaya Gönder'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
