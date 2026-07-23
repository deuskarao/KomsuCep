import { createContext, useContext, useState, useEffect } from 'react';
import { dbService, hashPassword } from '../services/db';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('apm_currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('apm_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('apm_currentUser');
    }
  }, [currentUser]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const user = await dbService.login(email, password);
      if (user) {
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, message: 'E-posta veya şifre hatalı' };
    } catch (e) {
      return { success: false, message: e.message || 'Giriş sırasında hata oluştu' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const users = await dbService.getUsers();
      if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Bu e-posta zaten kayıtlı' };
      }
      
      const aptId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const aptCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const userId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      
      const newApt = { id: aptId, name: userData.aptName, code: aptCode, blocks: userData.blocks || [], flatsCount: userData.flatsCount || 1, monthlyDues: 0, createdBy: userId, createdAt: new Date().toISOString() };
      await dbService.saveApartment(aptId, newApt);
      
      const hashedPass = await hashPassword(userData.password);
      const newUser = { id: userId, name: userData.name, email: userData.email, password: hashedPass, phone: userData.phone || '', role: 'admin', residentType: 'Ev Sahibi', block: '', flatNo: null, aptId: aptId, createdAt: new Date().toISOString() };
      await dbService.addUser(newUser);
      
      setCurrentUser(newUser);
      return { success: true, aptCode };
    } catch (e) {
      // error handled
      return { success: false, message: 'Hata oluştu' };
    } finally {
      setIsLoading(false);
    }
  };

  const join = async (userData) => {
    setIsLoading(true);
    try {
      const users = await dbService.getUsers();
      if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Bu e-posta zaten kayıtlı' };
      }

      const foundApt = await dbService.findApartmentByCode(userData.code);
      if (!foundApt) {
        return { success: false, message: 'Geçersiz apartman kodu' };
      }

      const userId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const hashedPass = await hashPassword(userData.password);
      const newUser = { id: userId, name: userData.name, email: userData.email, password: hashedPass, phone: userData.phone || '', role: 'resident', residentType: userData.residentType || '', block: userData.block || '', flatNo: userData.flatNo || null, aptId: foundApt.id, createdAt: new Date().toISOString() };
      
      await dbService.addUser(newUser);
      setCurrentUser(newUser);
      return { success: true, aptName: foundApt.name };
    } catch (e) {
      // error handled
      return { success: false, message: 'Hata oluştu' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userId, data) => {
    const users = await dbService.getUsers();
    
    const currentUserToUpdate = users.find(u => u.id === userId);
    if (!currentUserToUpdate) return { success: false, message: 'Kullanıcı bulunamadı' };
    
    let finalData = { ...data };
    if (data.password) {
      finalData.password = await hashPassword(data.password);
    }
    await dbService.updateUser(userId, finalData);
    
    if (currentUser?.id === userId) {
      setCurrentUser({ ...currentUser, ...finalData });
    }
    return { success: true };
  };

  const updateUserByAdmin = async (userId, data) => {
    const userDoc = await dbService.getUser(userId);
    if (!userDoc) return { success: false, message: 'Kullanıcı bulunamadı' };
    
    let updatedRole = userDoc.role;
    if (data.residentType === 'Yönetici') {
      updatedRole = 'admin';
    } else if (data.residentType === 'Kiracı' || data.residentType === 'Ev Sahibi') {
      updatedRole = 'resident';
    }
    
    let finalData = { ...data };
    if (data.password) {
      finalData.password = await hashPassword(data.password);
    }
    await dbService.updateUser(userId, { ...finalData, role: updatedRole });
    return { success: true };
  };

  const forgotPassword = async (email) => {
    try {
      await dbService.forgotPassword(email);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || 'Bir hata oluştu.' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await dbService.resetPassword(token, newPassword);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || 'Şifre sıfırlanırken hata oluştu.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, register, join, updateProfile, updateUserByAdmin, forgotPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
