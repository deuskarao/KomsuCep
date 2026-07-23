import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Requests from './pages/Requests';
import Finance from './pages/Finance';
import Members from './pages/Members';
import Settings from './pages/Settings';
import Dues from './pages/Dues'; // Aidat sayfası
import Repairs from './pages/Repairs';
import Polls from './pages/Polls';
import { Toaster } from 'react-hot-toast';

function App() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!currentUser) {
    if (window.location.pathname === '/reset-password') {
      return (
        <>
          <Toaster position="top-right" />
          <ResetPassword />
        </>
      );
    }
    
    return (
      <>
        <Toaster position="top-right" />
        <Auth />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'announcements': return <Announcements />;
      case 'polls': return <Polls />;
      case 'requests': return <Requests />;
      case 'repairs': return <Repairs />;
      case 'finance': return <Finance />;
      case 'members': return <Members />;
      case 'settings': return <Settings />;
      case 'dues': return <Dues />;
      default: return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      <Toaster position="top-right" />
      {renderPage()}
    </Layout>
  );
}

export default App;
