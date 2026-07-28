import { DEFAULT_STAFF, DEFAULT_CUSTOMERS, DEFAULT_ORDERS, DEFAULT_LOGS, DEFAULT_CATALOG, DEFAULT_STORES, DEFAULT_ROLES } from './seeds.js';

export const memoryDb = {
  stores: [],
  selected_store_id: 'all',
  roles: DEFAULT_ROLES,
  staff: DEFAULT_STAFF,
  customers: DEFAULT_CUSTOMERS,
  orders: DEFAULT_ORDERS,
  logs: DEFAULT_LOGS,
  catalog: DEFAULT_CATALOG,
  current_user: null,
  pin_reset_requests: [],
  settings: {
    express_hours: 6,
    express_markup: 50,
    normal_hours: 48,
    receipt_header: "KLIN UP - Laverie & Pressing Premium",
    receipt_footer: "Merci de votre confiance ! A bientot chez KLIN UP."
  },
  cash_closures: [],
  debt_payments: []
};

export const listeners = new Set();

export const notifyListeners = () => {
  listeners.forEach(l => l());
};
