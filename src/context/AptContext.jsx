import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { dbService } from '../services/db';
import toast from 'react-hot-toast';

const AptContext = createContext();

export function AptProvider({ children }) {
  const { currentUser, logout } = useAuth();
  
  const [apt, setApt] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [polls, setPolls] = useState([]);
  const [dues, setDues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const loadData = useCallback(async () => {
    if (!currentUser) {
      setApt(null);
      setTransactions([]);
      setAnnouncements([]);
      setRequests([]);
      setRepairs([]);
      setPolls([]);
      setDues([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const aptId = currentUser.aptId;
    const loadedApt = await dbService.getApartment(aptId);
    
    if (loadedApt) {
      setApt(loadedApt);
      setTransactions(await dbService.getTransactions(aptId));
      setAnnouncements(await dbService.getAnnouncements(aptId));
      setRequests(await dbService.getRequests(aptId));
      setRepairs(await dbService.getRepairs(aptId));
      setPolls((await dbService.getPolls(aptId)).map(p => ({ ...p, status: p.status || 'approved' })));
      setDues(await dbService.getDues(aptId));
    }
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // General persistence helper
  const saveKey = async (key, data) => {
    if (apt) {
      if (key === 'transactions') await dbService.saveTransactions(apt.id, data);
      else if (key === 'announcements') await dbService.saveAnnouncements(apt.id, data);
      else if (key === 'requests') await dbService.saveRequests(apt.id, data);
      else if (key === 'repairs') await dbService.saveRepairs(apt.id, data);
      else if (key === 'apm_polls') await dbService.savePolls(apt.id, data);
      else if (key === 'dues') await dbService.saveDues(apt.id, data);
    }
  };

  // Transactions
  const addTransaction = async (tx) => {
    const newTx = { ...tx, id: genId(), createdAt: new Date().toISOString() };
    const newTransactions = [...transactions, newTx];
    await saveKey('transactions', newTransactions);
    setTransactions(newTransactions);
    return newTx;
  };
  
  const deleteTransaction = async (id) => {
    const deletedTx = transactions.find(t => t.id === id);
    const newTransactions = transactions.filter(t => t.id !== id);
    await saveKey('transactions', newTransactions);
    setTransactions(newTransactions);
    
    // Eğer bu işlem bir aidat ödemesiyse, aidat durumunu geri "ödenmedi" yap
    let relatedDue = dues.find(d => d.transactionId === id);
    if (!relatedDue && deletedTx && deletedTx.category === 'Aidat') {
      relatedDue = dues.find(d => d.userId === deletedTx.userId && Number(d.amount) === Number(deletedTx.amount) && d.status === 'paid');
    }

    if (relatedDue) {
      const updatedDues = dues.map(d => d.id === relatedDue.id ? { ...d, status: 'unpaid', paidAt: null, transactionId: null } : d);
      await saveKey('dues', updatedDues);
      setDues(updatedDues);
    }
  };

  // Announcements
  const addAnnouncement = async (ann) => {
    const dur = Math.min(Number(ann.duration) || 7, 7);
    const newAnn = { ...ann, duration: dur, id: genId(), createdAt: new Date().toISOString(), readBy: [] };
    const updated = [...announcements, newAnn];
    await saveKey('announcements', updated);
    setAnnouncements(updated);
  };
  
  const updateAnnouncement = async (id, data) => {
    const updated = announcements.map(a => a.id === id ? { ...a, ...data } : a);
    await saveKey('announcements', updated);
    setAnnouncements(updated);
  };
  
  const deleteAnnouncement = async (id) => {
    const updated = announcements.filter(a => a.id !== id);
    await saveKey('announcements', updated);
    setAnnouncements(updated);
  };
  
  const markAnnouncementAsRead = async (id) => {
    if (!currentUser) return;
    const updated = announcements.map(a => {
      if (a.id === id) {
        const reads = a.readBy || [];
        if (!reads.includes(currentUser.id)) {
          return { ...a, readBy: [...reads, currentUser.id] };
        }
      }
      return a;
    });
    await saveKey('announcements', updated);
    setAnnouncements(updated);
  };

  // Requests
  const addRequest = async (req) => {
    const initialStatus = currentUser.role === 'admin' ? 'pending' : 'pending-approval';
    const newReq = { ...req, id: genId(), status: initialStatus, progress: [], userId: currentUser.id, createdAt: new Date().toISOString() };
    const updated = [...requests, newReq];
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const approveRequest = async (id) => {
    const updated = requests.map(r => r.id === id ? { ...r, status: 'pending' } : r);
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const updateRequestStatus = async (id, status) => {
    const updated = requests.map(r => r.id === id ? { 
      ...r, 
      status, 
      ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {})
    } : r);
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const updateRequestData = async (id, data) => {
    const updated = requests.map(r => r.id === id ? { ...r, ...data } : r);
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const addRequestProgress = async (id, note) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        const prog = r.progress || [];
        return { ...r, progress: [...prog, { id: genId(), note, createdAt: new Date().toISOString() }] };
      }
      return r;
    });
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const updateRequestProgressNote = async (reqId, progId, newNote) => {
    const updated = requests.map(r => {
      if (r.id === reqId && r.progress) {
        const newProg = r.progress.map(p => p.id === progId ? { ...p, note: newNote } : p);
        return { ...r, progress: newProg };
      }
      return r;
    });
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const deleteRequestProgress = async (reqId, progId) => {
    const updated = requests.map(r => {
      if (r.id === reqId && r.progress) {
        const newProg = r.progress.filter(p => p.id !== progId);
        return { ...r, progress: newProg };
      }
      return r;
    });
    await saveKey('requests', updated);
    setRequests(updated);
  };
  
  const deleteRequest = async (id) => {
    const updated = requests.filter(r => r.id !== id);
    await saveKey('requests', updated);
    setRequests(updated);
  };

  // Repairs
  const addRepair = async (repairData) => {
    const newRep = { ...repairData, id: genId(), status: 'pending', progress: [], createdAt: new Date().toISOString() };
    const updated = [...repairs, newRep];
    await saveKey('repairs', updated);
    setRepairs(updated);
    
    const share = apt?.flatsCount ? (repairData.cost / apt.flatsCount).toFixed(2) : repairData.cost.toFixed(2);
    await addAnnouncement({
      title: `${repairData.title} Başlatıldı`,
      content: `Daire Payınız: ₺${share}`,
      type: 'info',
      duration: 7
    });
  };

  const updateRepairStatus = async (id, status) => {
    const repair = repairs.find(r => r.id === id);
    if (!repair) return;
    
    const updated = repairs.map(r => r.id === id ? { 
      ...r, 
      status, 
      resolvedAt: status === 'completed' ? new Date().toISOString() : null 
    } : r);
    await saveKey('repairs', updated);
    setRepairs(updated);
    
    if (status === 'completed') {
      await addAnnouncement({
        title: `${repair.title} Tamamlandı`,
        content: `${repair.title} adlı tamirat süreci başarıyla tamamlanmıştır.`,
        type: 'success',
        duration: 3
      });
    } else if (status === 'pending') {
      const completionAnn = announcements.find(a => a.title === `${repair.title} Tamamlandı`);
      if (completionAnn) {
        await deleteAnnouncement(completionAnn.id);
      }
    }
  };
  
  const updateRepairData = async (id, data) => {
    const updated = repairs.map(r => r.id === id ? { ...r, ...data } : r);
    await saveKey('repairs', updated);
    setRepairs(updated);
  };
  
  const addRepairProgress = async (id, noteText, authorName) => {
    const updated = repairs.map(r => {
      if (r.id === id) {
        const newProgress = [...(r.progress || []), { id: genId(), text: noteText, author: authorName, createdAt: new Date().toISOString() }];
        return { ...r, progress: newProgress };
      }
      return r;
    });
    await saveKey('repairs', updated);
    setRepairs(updated);
  };
  
  const deleteRepairProgress = async (repairId, noteId) => {
    const updated = repairs.map(r => {
      if (r.id === repairId) {
        return { ...r, progress: r.progress.filter(n => n.id !== noteId) };
      }
      return r;
    });
    await saveKey('repairs', updated);
    setRepairs(updated);
  };
  
  const deleteRepair = async (id) => {
    const updated = repairs.filter(r => r.id !== id);
    await saveKey('repairs', updated);
    setRepairs(updated);
  };

  // Polls
  const addPoll = async (data) => {
    if (!apt) return;
    const newPoll = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
      votes: {},
      status: data.status || 'approved',
      createdBy: currentUser?.id
    };
    const updated = [...polls, newPoll];
    await saveKey('apm_polls', updated);
    setPolls(updated);
    
    if (newPoll.status === 'approved') {
      await addAnnouncement({
        title: 'Yeni Anket: ' + newPoll.question,
        content: 'Lütfen Anketler sayfasına giderek oy kullanın.',
        type: 'info',
        duration: 7
      });
    }
  };

  const approvePoll = async (pollId) => {
    const updated = polls.map(p => p.id === pollId ? { ...p, status: 'approved' } : p);
    await saveKey('apm_polls', updated);
    setPolls(updated);
    const poll = updated.find(p => p.id === pollId);
    if (poll) {
      await addAnnouncement({
        title: 'Yeni Anket: ' + poll.question,
        content: 'Lütfen Anketler sayfasına giderek oy kullanın.',
        type: 'info',
        duration: 7
      });
    }
  };

  const rejectPoll = async (pollId) => {
    const updated = polls.map(p => p.id === pollId ? { ...p, status: 'rejected' } : p);
    await saveKey('apm_polls', updated);
    setPolls(updated);
  };

  const votePoll = async (pollId, optionIndex) => {
    if (!apt || !currentUser) return;
    const updated = polls.map(p => {
      if (p.id === pollId) {
        return {
          ...p,
          votes: { ...p.votes, [currentUser.id]: optionIndex }
        };
      }
      return p;
    });
    await saveKey('apm_polls', updated);
    setPolls(updated);
  };

  const deletePoll = async (id) => {
    if (!apt) return;
    const updated = polls.filter(p => p.id !== id);
    await saveKey('apm_polls', updated);
    setPolls(updated);
  };

  // Dues
  const addDue = async (dueData) => {
    const newDue = { ...dueData, id: genId(), status: 'unpaid', createdAt: new Date().toISOString() };
    const updated = [...dues, newDue];
    await saveKey('dues', updated);
    setDues(updated);
  };
  
  const addBulkDues = async (userIds, dueData) => {
    const newDues = userIds.map(userId => ({
      ...dueData,
      userId,
      id: genId(),
      status: 'unpaid',
      createdAt: new Date().toISOString()
    }));
    const updated = [...dues, ...newDues];
    await saveKey('dues', updated);
    setDues(updated);
  };

  const markDueAsPaid = async (id) => {
    let newTx;
    const updated = dues.map(d => {
      if (d.id === id) {
        newTx = {
          id: genId(),
          description: d.description || 'Aidat Ödemesi',
          amount: Number(d.amount),
          type: 'income',
          category: 'Aidat',
          userId: d.userId,
          createdAt: new Date().toISOString()
        };
        return { ...d, status: 'paid', paidAt: new Date().toISOString(), transactionId: newTx.id };
      }
      return d;
    });
    
    if (newTx) {
      const newTransactions = [...transactions, newTx];
      await saveKey('transactions', newTransactions);
      setTransactions(newTransactions);
    }
    await saveKey('dues', updated);
    setDues(updated);
  };

  const markMultipleDuesAsPaid = async (dueIds) => {
    const duesToPay = dues.filter(d => dueIds.includes(d.id) && d.status === 'unpaid');
    if (duesToPay.length === 0) return;
    
    const totalAmount = duesToPay.reduce((sum, d) => sum + Number(d.amount), 0);
    const userId = duesToPay[0].userId; 
    
    const desc = duesToPay.map(d => `${d.month}/${d.year}`).join(', ') + ' Aidat Tahsilatı';
    
    const newTx = {
      id: genId(),
      description: desc,
      amount: totalAmount,
      type: 'income',
      category: 'Aidat',
      userId: userId,
      isBulkDueTx: true,
      linkedDueIds: dueIds,
      createdAt: new Date().toISOString()
    };
    
    const newTransactions = [...transactions, newTx];
    await saveKey('transactions', newTransactions);
    setTransactions(newTransactions);

    const updated = dues.map(d => {
      if (dueIds.includes(d.id)) {
        return { ...d, status: 'paid', paidAt: new Date().toISOString(), bulkTransactionId: newTx.id };
      }
      return d;
    });
    await saveKey('dues', updated);
    setDues(updated);
  };

  const revertDueAsUnpaid = async (dueId) => {
    if (!apt) return;
    const due = dues.find(d => d.id === dueId);
    if (!due) return;

    if (due.transactionId) {
      await deleteTransaction(due.transactionId);
    } else if (due.bulkTransactionId) {
      const allDuesInBulk = dues.filter(d => d.bulkTransactionId === due.bulkTransactionId);
      if (allDuesInBulk.length <= 1) {
        await deleteTransaction(due.bulkTransactionId);
      } else {
        toast.error('Bu ödeme toplu yapıldığı için geri almak kasa kaydını düzeltmez. Tüm toplu ödemeyi geri almak gerekebilir. Lütfen dikkat edin.');
      }
    }

    const updated = dues.map(d => {
      if (d.id === dueId) {
        return { ...d, status: 'unpaid', paidAt: null, transactionId: null, bulkTransactionId: null };
      }
      return d;
    });
    await saveKey('dues', updated);
    setDues(updated);
  };

  const deleteDue = async (id) => {
    if (!apt) return;
    const updated = dues.filter(d => d.id !== id);
    await saveKey('dues', updated);
    setDues(updated);
  };

  // ---------------- Apartman Settings ----------------
  const updateApartmentDetails = async (updates) => {
    if (!apt) return;
    if (updates.monthlyDues !== undefined && Number(updates.monthlyDues) !== Number(apt.monthlyDues)) {
      const existing = announcements.find(a => a.title === 'Aidat Tutarı Güncellendi');
      if (existing) {
        await updateAnnouncement(existing.id, {
          content: `Yeni sabit aidat tutarı ${updates.monthlyDues} TL olarak belirlenmiştir.`,
          createdAt: new Date().toISOString(),
          readBy: []
        });
      } else {
        await addAnnouncement({
          title: 'Aidat Tutarı Güncellendi',
          content: `Yeni sabit aidat tutarı ${updates.monthlyDues} TL olarak belirlenmiştir.`,
          type: 'info',
          duration: 7
        });
      }
    }
    const updated = { ...apt, ...updates };
    await dbService.saveApartment(apt.id, updated);
    setApt(updated);
  };

  const updateAptName = (name) => updateApartmentDetails({ name });
  const updateMonthlyDues = (amount) => updateApartmentDetails({ monthlyDues: Number(amount) });
  const updateFlatsCount = (count) => updateApartmentDetails({ flatsCount: Number(count) });
  
  const updateBlocks = (count) => {
    const c = Number(count);
    const blocksArray = [];
    if (c > 0) {
      for (let i = 0; i < c; i++) {
        blocksArray.push(String.fromCharCode(65 + i));
      }
    }
    updateApartmentDetails({ blocks: blocksArray });
  };

  const generateNewCode = async () => {
    if (apt) {
      const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const updated = { ...apt, code: newCode };
      await dbService.saveApartment(apt.id, updated);
      setApt(updated);
      return newCode;
    }
  };

  const getUsers = async () => {
    const users = await dbService.getUsers();
    return users.filter(u => u.aptId === apt?.id);
  };

  const deleteUser = async (userId) => {
    await dbService.deleteUser(userId);
    await generateNewCode();
  };

  const addUserByAdmin = async (userData) => {
    const users = await dbService.getUsers();
    if (users.find(u => u.email === userData.email)) return { success: false, message: 'Bu e-posta kullanımda' };
    
    let hashedPass = userData.password;
    if (userData.password) {
      const { hashPassword } = await import('../services/db');
      hashedPass = await hashPassword(userData.password);
    }

    const role = userData.residentType === 'Yönetici' ? 'admin' : 'resident';
    const newUser = { ...userData, password: hashedPass, id: genId(), role, aptId: apt.id, createdAt: new Date().toISOString() };
    await dbService.addUser(newUser);
    return { success: true };
  };

  const deleteApartment = async () => {
    if (!apt) return;
    const aptId = apt.id;
    await dbService.deleteApartmentData(aptId);
    let users = await dbService.getUsers();
    users = users.filter(u => u.aptId !== aptId);
    for (const u of users) await dbService.deleteUser(u.id);
    logout();
  };

  return (
    <AptContext.Provider value={{
      apt, isLoading,
      transactions, addTransaction, deleteTransaction,
      announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementAsRead,
      requests, addRequest, updateRequestStatus, updateRequestData, addRequestProgress, updateRequestProgressNote, deleteRequestProgress, deleteRequest, approveRequest,
      repairs, addRepair, updateRepairStatus, updateRepairData, addRepairProgress, deleteRepairProgress, deleteRepair,
      polls, addPoll, approvePoll, rejectPoll, votePoll, deletePoll,
      dues, addDue, addBulkDues, markDueAsPaid, markMultipleDuesAsPaid, revertDueAsUnpaid, deleteDue,
      updateAptName, generateNewCode, updateMonthlyDues, updateFlatsCount, updateBlocks, updateApartmentDetails, getUsers, deleteUser, addUserByAdmin, deleteApartment,
      genId
    }}>
      {children}
    </AptContext.Provider>
  );
}
export function useApt() {
  return useContext(AptContext);
}
