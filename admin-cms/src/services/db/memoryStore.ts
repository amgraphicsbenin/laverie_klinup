import { DEFAULT_STAFF, DEFAULT_CUSTOMERS, DEFAULT_ORDERS, DEFAULT_LOGS, DEFAULT_CATALOG, DEFAULT_ROLES } from './seeds.js';
import { MemoryStore } from '../../types';

export const memoryDb: MemoryStore = {
  stores: [],
  selected_store_id: 'all',
  roles: DEFAULT_ROLES as any,
  staff: DEFAULT_STAFF as any,
  customers: DEFAULT_CUSTOMERS as any,
  orders: DEFAULT_ORDERS as any,
  logs: DEFAULT_LOGS as any,
  catalog: DEFAULT_CATALOG as any,
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

export const listeners = new Set<() => void>();

export const notifyListeners = (): void => {
  listeners.forEach(l => l());
};
