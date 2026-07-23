import { useAuth } from '../../context/AuthContext';
import { useApt } from '../../context/AptContext';
import { LogOut, LayoutDashboard, Bell, PenTool, DollarSign, Users, Settings, CreditCard, Wrench, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPage, setCurrentPage }) {
  const { logout, currentUser } = useAuth();
  const { apt, announcements, polls } = useApt();

  const isAdmin = currentUser?.role === 'admin';

  const unreadAnnouncements = announcements.filter(a => {
    if (a.duration) {
      const expiry = new Date(a.createdAt);
      expiry.setDate(expiry.getDate() + Number(a.duration));
      if (new Date() > expiry) return false;
    }
    return !(a.readBy || []).includes(currentUser?.id);
  }).length;

  const unvotedPolls = polls.filter(p => p.status === 'approved' && p.votes[currentUser?.id] === undefined).length;

  const menuGroups = [
    [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ],
    [
      { id: 'announcements', label: 'Duyurular', icon: Bell },
      { id: 'polls', label: 'Anketler', icon: BarChart2 }
    ],
    [
      { id: 'requests', label: 'Arızalar & Talepler', icon: PenTool },
      { id: 'repairs', label: 'Tamiratlar', icon: Wrench }
    ]
  ];

  if (isAdmin) {
    menuGroups.push([
      { id: 'dues', label: 'Aidat Yönetimi', icon: CreditCard },
      { id: 'finance', label: 'Gelir/Gider', icon: DollarSign }
    ]);
    menuGroups.push([
      { id: 'members', label: 'Sakinler', icon: Users },
      { id: 'settings', label: 'Ayarlar', icon: Settings }
    ]);
  } else {
    menuGroups.push([
      { id: 'settings', label: 'Ayarlar', icon: Settings }
    ]);
  }

  return (
    <>
      <div className="bg-shapes">
        <div className="shape shape-app-1"></div>
        <div className="shape shape-app-2"></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 24, gap: 24, maxWidth: 1600, margin: '0 auto' }}>
        
        {/* Top Navigation Bar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div onClick={() => setCurrentPage('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer', transition: 'opacity 0.2s', marginTop: -7 }} onMouseEnter={e=>e.currentTarget.style.opacity='0.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
            <img src="/favicon.svg" alt="KomşuCep" style={{ width: 36, height: 36 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--g900)' }}>KomşuCep</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 4, flex: '1 1 auto' }}>
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="glass-panel" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 6px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {group.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  const badgeCount = item.id === 'announcements' ? unreadAnnouncements : item.id === 'polls' ? unvotedPolls : 0;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: 'none',
                        background: isActive ? 'var(--primary)' : 'transparent',
                        borderRadius: 12,
                        color: isActive ? 'white' : 'var(--g600)',
                        fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        position: 'relative'
                      }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ position: 'relative' }}>
                        <Icon size={18} />
                        {badgeCount > 0 && (
                          <span style={{
                            position: 'absolute', top: -6, right: -8, background: 'var(--danger)', color: 'white',
                            fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 10, minWidth: 16, textAlign: 'center',
                            border: `2px solid ${isActive ? 'var(--primary)' : '#fff'}`
                          }}>
                            {badgeCount}
                          </span>
                        )}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              className="glass-panel"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 16, background: 'transparent', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} 
              onClick={logout} 
              title="Çıkış Yap" 
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} 
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        
        <main style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer style={{ textAlign: 'center', padding: '16px 0 8px', color: 'var(--g500)', fontSize: 12, background: 'rgba(255,255,255,0.3)', borderRadius: 12 }}>
          © 2026 KomşuCep. Tüm hakları saklıdır.
        </footer>
      </div>
    </>
  );
}
