export type Role = 'super_admin' | 'manager' | 'editeur_catalogue' | 'agent_accueil' | 'agent_lavage_repassage' | 'livreur';

export type OrderStatus =
  | 'en_attente'
  | 'traitement'
  | 'en_cours_lavage'
  | 'en_cours_repassage'
  | 'pret'
  | 'a_livrer'
  | 'a_recuperer'
  | 'en_cours_livraison'
  | 'restitue'
  | 'annule';

export interface Store {
  id: string;
  nom: string;
  code: string;
  adresse: string;
  ville?: string;
  telephone?: string;
  responsable_id?: string;
  responsable_nom?: string;
  statut: 'actif' | 'inactif';
  created_at?: string;
}

export interface StaffPermissions {
  can_view_dashboard?: boolean;
  can_manage_orders?: boolean;
  can_manage_crm?: boolean;
  can_edit_catalog?: boolean;
  can_view_logs?: boolean;
  can_manage_staff?: boolean;
}

export interface Staff {
  id: string;
  nom: string;
  prenom: string;
  role: Role;
  email: string;
  telephone?: string;
  code_pin?: string;
  statut: 'actif' | 'inactif';
  store_id?: string;
  permissions?: StaffPermissions;
  created_at?: string;
}

export interface ActiveSubscription {
  catalog_item_id: string;
  name: string;
  total_clothes: number;
  remaining_clothes: number;
  subscribed_at: string;
  expires_at: string;
}

export interface Customer {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse?: string;
  indicatif?: string;
  preferences_pliage?: string;
  points_fidelite?: number;
  solde_dette?: number;
  store_id?: string;
  created_by_id?: string;
  created_by_name?: string;
  active_subscription?: ActiveSubscription | null;
  created_at?: string;
}

export interface OrderItem {
  article: string;
  service: string;
  quantite: number;
  prix: number;
  description?: string;
}

export interface SubscriptionDetails {
  name?: string;
  previous_balance?: number;
  new_balance?: number;
  clothes_deducted?: number;
  remise_pourcentage?: number;
  remise_montant?: number;
  prix_base_avant_remise?: number;
  type_livraison?: 'recuperation' | 'livraison';
  immediate_subscription?: {
    id: string;
    name: string;
    prix: number;
  };
}

export interface Order {
  id: string;
  customer_id: string;
  statut: OrderStatus;
  type_article?: string;
  type_service?: string;
  niveau_urgence?: 'Normal' | 'Express';
  mode_reglement?: string;
  avance_payee?: number;
  prix_total?: number;
  total?: number;
  avance?: number;
  remise_pourcentage?: number;
  remise_montant?: number;
  prix_base_avant_remise?: number;
  identifiant_unique_marquage?: string;
  ticket_numero?: string;
  created_at?: string;
  due_date?: string;
  acompte_paid_at?: string | null;
  solde_paid_at?: string | null;
  items?: OrderItem[];
  created_by_id?: string | null;
  created_by_name?: string | null;
  motif_annulation?: string | null;
  store_id?: string;
  est_en_retard?: boolean;
  is_subscription_order?: boolean;
  subscription_details?: SubscriptionDetails | null;
  reference_momo?: string;
  reference_paiement?: string;
}

export interface CatalogItem {
  id: string;
  article: string;
  service: string;
  prix: number;
  categorie?: 'individuel' | 'abonnement' | 'exclusif';
  description?: string;
  is_active?: boolean;
  statut?: 'actif' | 'inactif';
  store_id?: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  store_id?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface PinResetRequest {
  id: string;
  email: string;
  staff_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AdminSettings {
  express_hours: number;
  express_markup: number;
  normal_hours: number;
  receipt_header: string;
  receipt_footer: string;
}

export interface MemoryStore {
  stores: Store[];
  selected_store_id: string;
  roles: { id: Role; label: string }[];
  staff: Staff[];
  customers: Customer[];
  orders: Order[];
  logs: ActivityLog[];
  catalog: CatalogItem[];
  current_user: Staff | null;
  pin_reset_requests: PinResetRequest[];
  settings: AdminSettings;
  cash_closures: any[];
  debt_payments: any[];
}
