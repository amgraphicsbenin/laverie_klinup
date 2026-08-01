import { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { sendSystemNotification } from '../services/notificationService';
import { getCurrentLang, subscribeToLangChange } from '../services/i18n';

export function useDbState() {
  const [customers, setCustomers] = useState(() => db.getCustomers() || []);
  const [orders, setOrders] = useState(() => db.getOrders() || []);
  const [catalog, setCatalog] = useState(() => db.getCatalog() || []);
  const [notifications, setNotifications] = useState(() => (typeof db.getNotifications === 'function' ? db.getNotifications() : []));
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser() || null);
  const [isRemote, setIsRemote] = useState(() => (typeof db.isRemote === 'function' ? db.isRemote() : false));
  const [isDarkMode, setIsDarkMode] = useState(() => (typeof db.isDarkMode === 'function' ? db.isDarkMode() : false));
  const [currentLang, setCurrentLang] = useState(() => getCurrentLang());

  const prevUnreadCountRef = useRef((typeof db.getNotifications === 'function' ? db.getNotifications() : []).filter(n => !n.read).length);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Load initial values
    setCustomers(db.getCustomers() || []);
    setOrders(db.getOrders() || []);
    setCatalog(db.getCatalog() || []);
    const initialNotifs = typeof db.getNotifications === 'function' ? db.getNotifications() : [];
    setNotifications(initialNotifs);
    prevUnreadCountRef.current = initialNotifs.filter(n => !n.read).length;
    setCurrentUser(db.getCurrentUser() || null);
    setIsRemote(typeof db.isRemote === 'function' ? db.isRemote() : false);
    setIsDarkMode(typeof db.isDarkMode === 'function' ? db.isDarkMode() : false);
    setCurrentLang(getCurrentLang());

    const unsubscribe = db.subscribe(() => {
      setCustomers(db.getCustomers() || []);
      setOrders(db.getOrders() || []);
      setCatalog(db.getCatalog() || []);
      const newNotifs = typeof db.getNotifications === 'function' ? db.getNotifications() : [];
      setNotifications(newNotifs);

      const unreadCount = newNotifs.filter(n => !n.read).length;
      if (!isInitialMount.current && unreadCount > prevUnreadCountRef.current) {
        const latestNotif = newNotifs.find(n => !n.read);
        sendSystemNotification(latestNotif?.action || 'KLIN UP', latestNotif?.details || 'Nouvelle notification');
      }
      prevUnreadCountRef.current = unreadCount;
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }

      setCurrentUser(db.getCurrentUser() || null);
      setIsRemote(typeof db.isRemote === 'function' ? db.isRemote() : false);
      setIsDarkMode(typeof db.isDarkMode === 'function' ? db.isDarkMode() : false);
      setCurrentLang(getCurrentLang());
    });

    const unsubLang = subscribeToLangChange((newLang) => {
      setCurrentLang(newLang);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (typeof unsubLang === 'function') {
        unsubLang();
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
