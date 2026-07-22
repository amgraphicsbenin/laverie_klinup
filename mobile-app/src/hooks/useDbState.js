import { useState, useEffect } from 'react';
import { db } from '../services/db';

export function useDbState() {
  const [customers, setCustomers] = useState(() => db.getCustomers() || []);
  const [orders, setOrders] = useState(() => db.getOrders() || []);
  const [catalog, setCatalog] = useState(() => db.getCatalog() || []);
  const [notifications, setNotifications] = useState(() => (typeof db.getNotifications === 'function' ? db.getNotifications() : []));
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser() || null);
  const [isRemote, setIsRemote] = useState(() => (typeof db.isRemote === 'function' ? db.isRemote() : false));
  const [isDarkMode, setIsDarkMode] = useState(() => (typeof db.isDarkMode === 'function' ? db.isDarkMode() : false));

  useEffect(() => {
    // Load initial values
    setCustomers(db.getCustomers() || []);
    setOrders(db.getOrders() || []);
    setCatalog(db.getCatalog() || []);
    setNotifications(typeof db.getNotifications === 'function' ? db.getNotifications() : []);
    setCurrentUser(db.getCurrentUser() || null);
    setIsRemote(typeof db.isRemote === 'function' ? db.isRemote() : false);
    setIsDarkMode(typeof db.isDarkMode === 'function' ? db.isDarkMode() : false);

    const unsubscribe = db.subscribe(() => {
      setCustomers(db.getCustomers() || []);
      setOrders(db.getOrders() || []);
      setCatalog(db.getCatalog() || []);
      setNotifications(typeof db.getNotifications === 'function' ? db.getNotifications() : []);
      setCurrentUser(db.getCurrentUser() || null);
      setIsRemote(typeof db.isRemote === 'function' ? db.isRemote() : false);
      setIsDarkMode(typeof db.isDarkMode === 'function' ? db.isDarkMode() : false);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return { 
    customers: customers || [], 
    orders: orders || [], 
    catalog: catalog || [], 
    notifications: notifications || [],
    currentUser, 
    isRemote: !!isRemote, 
    isDarkMode: !!isDarkMode 
  };
}
