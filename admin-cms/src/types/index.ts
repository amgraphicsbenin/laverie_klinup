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
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface DeliveryZone {
  id: string;
  store_id?: string | null;
  label_zone: string;
  min_km: number;
  max_km: number;
  frais_livraison: number;
  is_active?: boolean;
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
  coordonnees_livraison?: string;
  indicatif?: string;
  preferences_pliage?: string;
  points_fidelite?: number;
  solde_dette?: number;
  active_subscription?: ActiveSubscription | null;
  store_id?: string;
  created_by_id?: string;
  created_by_name?: string;
  created_at?: string;
}

export interface OrderItem {
  article: string;
  service: string;
  quantite: number;
  prix: number;
}

export interface SubscriptionDetails {
  remise_pourcentage?: number;
  remise_montant?: number;
  prix_base_avant_remise?: number;
}

export interface Order {
  id: string;
  customer_id?: string | null;
  statut: OrderStatus;
  type_article: string;
  type_service: string;
  niveau_urgence: string;
  mode_reglement: string;
  avance_payee: number;
  prix_total: number;
  frais_livraison?: number;
  distance_km?: number;
  identifiant_unique_marquage: string;
  created_at?: string;
  due_date?: string | null;
  acompte_paid_at?: string | null;
  solde_paid_at?: string | null;
  items?: OrderItem[];
  created_by_id?: string | null;
  created_by_name?: string | null;
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

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  discount_amount?: number;
  icon_name?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface SupportTicket {
  id: string;
  ticket_type: 'bug' | 'help' | 'feature';
  subject: string;
  module_name: string;
  priority: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
  status: 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé';
  description: string;
  steps_to_reproduce?: string;
  contact_phone?: string;
  contact_email?: string;
  user_id?: string;
  user_name?: string;
  store_id?: string;
  attached_files?: any[];
  response_notes?: string;
  created_at?: string;
  updated_at?: string;
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
  rewards?: RewardItem[];
  delivery_zones?: DeliveryZone[];
  support_tickets?: SupportTicket[];
  current_user: Staff | null;
  pin_reset_requests: PinResetRequest[];
  settings: AdminSettings;
  cash_closures: any[];
  debt_payments: any[];
}
