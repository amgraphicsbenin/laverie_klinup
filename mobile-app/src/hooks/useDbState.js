import { useState, useEffect } from 'react';
import { db } from '../services/db';

export function useDbState() {
  const [customers, setCustomers] = useState(db.getCustomers());
  const [orders, setOrders] = useState(db.getOrders());
  const [catalog, setCatalog] = useState(db.getCatalog());
  const [currentUser, setCurrentUser] = useState(db.getCurrentUser());
  const [isRemote, setIsRemote] = useState(db.isRemote());
  const [isDarkMode, setIsDarkMode] = useState(db.isDarkMode ? db.isDarkMode() : false);

  useEffect(() => {
    // Load initial values
    setCustomers(db.getCustomers());
    setOrders(db.getOrders());
    setCatalog(db.getCatalog());
    setCurrentUser(db.getCurrentUser());
    setIsRemote(db.isRemote());
    setIsDarkMode(db.isDarkMode ? db.isDarkMode() : false);

    const unsubscribe = db.subscribe(() => {
      setCustomers(db.getCustomers());
      setOrders(db.getOrders());
      setCatalog(db.getCatalog());
      setCurrentUser(db.getCurrentUser());
      setIsRemote(db.isRemote());
      setIsDarkMode(db.isDarkMode ? db.isDarkMode() : false);
    });
    return () => unsubscribe();
  }, []);

  return { customers, orders, catalog, currentUser, isRemote, isDarkMode };
}
