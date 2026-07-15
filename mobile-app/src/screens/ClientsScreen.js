import React, { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity,
  Alert, BackHandler, Platform, KeyboardAvoidingView, Modal
} from "react-native";
import { Search, Plus, User, MapPin, Phone, ChevronRight, X, Check, Edit3, Trash2 } from "lucide-react-native";
import { db } from "../services/db";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";

export default function ClientsScreen({ onBack, onSelectClient, onShowSuccess }) {
  const [customers, setCustomers] = useState(() => db.getCustomers());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [custNom, setCustNom] = useState("");
  const [custPrenom, setCustPrenom] = useState("");
  const [custTelephone, setCustTelephone] = useState("");
  const [custAdresse, setCustAdresse] = useState("");
  const [custPreferences, setCustPreferences] = useState("Plie");

  const refreshCustomers = () => setCustomers(db.getCustomers());

  useEffect(() => {
    if (Platform.OS === "web") return;
    const backAction = () => {
      if (showCustomerModal) { handleCloseCustomerModal(); return true; }
      if (showEditModal) { handleCloseEditModal(); return true; }
      if (selectedClient) { setSelectedClient(null); return true; }
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [showCustomerModal, showEditModal, selectedClient]);

  const abonnesCount = customers.filter(c => c.active_subscription && c.active_subscription.remaining_clothes > 0).length;

  const filteredClients = customers.filter(c => {
    const fullname = `${c.prenom} ${c.nom}`.toLowerCase();
    const phone = (c.telephone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = fullname.includes(query) || phone.includes(query);
    if (!matchesQuery) return false;
    if (filterType === "abonnes") return c.active_subscription && c.active_subscription.remaining_clothes > 0;
    return true;
  });

  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustNom(""); setCustPrenom(""); setCustTelephone(""); setCustAdresse(""); setCustPreferences("Plie");
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setCustNom(""); setCustPrenom(""); setCustTelephone(""); setCustAdresse(""); setCustPreferences("Plie");
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustNom(""); setCustPrenom(""); setCustTelephone(""); setCustAdresse(""); setCustPreferences("Plie");
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (client) => {
    setEditingCustomer(client);
    setCustNom(client.nom); setCustPrenom(client.prenom); setCustTelephone(client.telephone);
    setCustAdresse(client.adresse || ""); setCustPreferences(client.preferences_pliage || "Plie");
    setSelectedClient(null);
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!custNom || !custTelephone) { Alert.alert("Erreur", "Le nom et le telephone sont obligatoires."); return; }
    try {
      const isEditing = !!editingCustomer;
      if (isEditing) {
        await db.updateCustomer(editingCustomer.id, { nom: custNom, prenom: custPrenom, telephone: custTelephone, adresse: custAdresse, preferences_pliage: custPreferences });
        handleCloseEditModal();
      } else {
        await db.addCustomer({ nom: custNom, prenom: custPrenom, telephone: custTelephone, adresse: custAdresse, preferences_pliage: custPreferences });
        handleCloseCustomerModal();
      }
      refreshCustomers();
      if (onShowSuccess) onShowSuccess(isEditing ? "Profil client modifie !" : "Nouveau client cree !");
    } catch (e) { Alert.alert("Erreur", "Impossible d enregistrer le profil client."); }
  };

  const handleDeleteCustomer = (id) => {
    Alert.alert("Confirmation", "Voulez-vous vraiment supprimer ce client ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try { await db.deleteCustomer(id); setSelectedClient(null); refreshCustomers(); }
        catch (e) { Alert.alert("Erreur", "Impossible de supprimer ce client."); }
      }}
    ]);
  };

  const getClientOrders = (clientId) => db.getOrders().filter(o => o.customer_id === clientId);
  const formatDate = (dateStr) => { if (!dateStr) return "N/A"; try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; } };
  const formatPrice = (price) => (price || 0).toLocaleString("fr-FR") + " FCFA";

  const renderForm = (isEditing, onClose) => (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.formModalWrapper} pointerEvents="box-none">
        <MotiView
          from={{ opacity: 0, translateY: 60 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18 }}
          style={styles.formModal}
        >
          <View style={styles.formHandle} />
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>{isEditing ? "Modifier le client" : "Nouveau client"}</Text>
              <Text style={styles.formSubtitle}>{isEditing ? "Mettez a jour les informations" : "Remplissez les informations ci-dessous"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.formClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.formLabel}>Nom *</Text>
            <TextInput style={styles.formInput} value={custNom} onChangeText={setCustNom} placeholder="Nom de famille" placeholderTextColor="#a1a1aa" />
            <Text style={styles.formLabel}>Prenom</Text>
            <TextInput style={styles.formInput} value={custPrenom} onChangeText={setCustPrenom} placeholder="Prenom" placeholderTextColor="#a1a1aa" />
            <Text style={styles.formLabel}>Telephone *</Text>
            <TextInput style={styles.formInput} value={custTelephone} onChangeText={setCustTelephone} placeholder="+229 XX XX XX XX" keyboardType="phone-pad" placeholderTextColor="#a1a1aa" />
            <Text style={styles.formLabel}>Adresse</Text>
            <TextInput style={styles.formInput} value={custAdresse} onChangeText={setCustAdresse} placeholder="Adresse (optionnel)" placeholderTextColor="#a1a1aa" />
            <Text style={styles.formLabel}>Preferences de pliage</Text>
            <View style={styles.prefRow}>
              {["Plie", "Suspendu", "Roule"].map(pref => (
                <TouchableOpacity key={pref} onPress={() => setCustPreferences(pref)} style={[styles.prefBtn, custPreferences === pref && styles.prefBtnActive]}>
                  <Text style={[styles.prefBtnText, custPreferences === pref && styles.prefBtnTextActive]}>{pref}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity onPress={handleSaveCustomer} style={styles.saveBtn} activeOpacity={0.85}>
            <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>{isEditing ? "Enregistrer les modifications" : "Creer le profil"}</Text>
          </TouchableOpacity>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <X size={18} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clients</Text>
          <TouchableOpacity onPress={handleOpenAddCustomer} style={styles.addBtn} activeOpacity={0.8}>
            <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Nouveau</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterHeader}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            placeholder="Rechercher par nom ou telephone..."
            placeholderTextColor="#a1a1aa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={14} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity onPress={() => setFilterType("all")} style={[styles.chip, filterType === "all" && styles.chipActive]}>
            <Text style={[styles.chipText, filterType === "all" && styles.chipTextActive]}>Tous ({customers.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterType("abonnes")} style={[styles.chip, filterType === "abonnes" && styles.chipActive]}>
            <Text style={[styles.chipText, filterType === "abonnes" && styles.chipTextActive]}>Abonnes ({abonnesCount})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredClients.length === 0 ? (
          <Text style={styles.noResultsText}>Aucun client correspondant</Text>
        ) : (
          filteredClients.map((client, index) => {
            const clientOrders = getClientOrders(client.id);
            const hasActiveSub = client.active_subscription && client.active_subscription.remaining_clothes > 0;
            return (
              <MotiView key={client.id} from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 300, delay: index * 40 }}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedClient(client)} style={styles.clientCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>{(client.prenom?.[0] || "") + (client.nom?.[0] || "")}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
                        {hasActiveSub && <View style={styles.subBadge}><Text style={styles.subBadgeText}>Abonne</Text></View>}
                      </View>
                      <View style={styles.clientPhoneRow}>
                        <Phone size={11} color="#71717a" style={{ marginRight: 4 }} />
                        <Text style={styles.clientPhone}>{client.telephone}</Text>
                      </View>
                      {client.adresse ? (
                        <View style={styles.clientPhoneRow}>
                          <MapPin size={11} color="#71717a" style={{ marginRight: 4 }} />
                          <Text style={styles.clientAddress} numberOfLines={1}>{client.adresse}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.clientMeta}>
                      <Text style={styles.clientOrderCount}>{clientOrders.length}</Text>
                      <Text style={styles.clientOrderLabel}>cmde{clientOrders.length > 1 ? "s" : ""}</Text>
                      <ChevronRight size={14} color="#a1a1aa" style={{ marginTop: 4 }} />
                    </View>
                  </View>
                  {hasActiveSub && (
                    <View style={styles.cardSubscriptionGaugeContainer}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={styles.cardSubText}>Abonnement : {client.active_subscription.name}</Text>
                        <Text style={styles.cardSubTextBold}>{client.active_subscription.remaining_clothes} / {client.active_subscription.total_clothes} vet.</Text>
                      </View>
                      {(() => {
                        const rem = client.active_subscription.remaining_clothes;
                        const tot = client.active_subscription.total_clothes;
                        const pct = Math.max(0, Math.min(100, Math.round(((tot - rem) / tot) * 100)));
                        return (<View style={styles.cardProgressBarBg}><View style={[styles.cardProgressBarFill, { width: `${pct}%` }]} /></View>);
                      })()}
                    </View>
                  )}
                </TouchableOpacity>
              </MotiView>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedClient && (
        <Modal animationType="fade" visible={!!selectedClient} onRequestClose={() => setSelectedClient(null)} transparent={true}>
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectedClient(null)}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <MotiView from={{ opacity: 0, scale: 0.92, translateY: 24 }} animate={{ opacity: 1, scale: 1, translateY: 0 }} transition={{ type: "spring", damping: 16 }} style={styles.compactModalView}>
              <View style={styles.compactModalHeader}>
                <View style={styles.ficheAvatarRow}>
                  <View style={styles.ficheAvatarLarge}>
                    <Text style={styles.ficheAvatarTextLarge}>{(selectedClient.prenom?.[0] || "") + (selectedClient.nom?.[0] || "")}</Text>
                  </View>
                  <View>
                    <Text style={styles.compactModalTitle}>{selectedClient.prenom} {selectedClient.nom}</Text>
                    <Text style={styles.ficheSubtitle}>{selectedClient.telephone}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedClient(null)}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  {selectedClient.adresse ? (
                    <View style={styles.ficheInfoRow}><MapPin size={13} color="#71717a" /><Text style={styles.ficheInfoText}>{selectedClient.adresse}</Text></View>
                  ) : null}
                  <View style={styles.ficheInfoRow}>
                    <Text style={styles.ficheInfoLabel}>Preferences :</Text>
                    <Text style={styles.ficheInfoValue}>{selectedClient.preferences_pliage || "Plie"}</Text>
                  </View>
                </View>
                {selectedClient.active_subscription && (
                  <View style={styles.detailCard}>
                    <View style={styles.subscriptionHeader}>
                      <Text style={styles.subscriptionTitle}>Abonnement actif</Text>
                      <View style={styles.subActiveBadge}><Text style={styles.subActiveBadgeText}>ACTIF</Text></View>
                    </View>
                    <Text style={styles.subPlanName}>{selectedClient.active_subscription.name}</Text>
                    <Text style={styles.subPlanBalance}>{selectedClient.active_subscription.remaining_clothes} vet. restants / {selectedClient.active_subscription.total_clothes} vet.</Text>
                    {(() => {
                      const rem = selectedClient.active_subscription.remaining_clothes;
                      const tot = selectedClient.active_subscription.total_clothes;
                      const pct = Math.max(0, Math.min(100, Math.round(((tot - rem) / tot) * 100)));
                      return (<View style={[styles.progressBarBg, { marginTop: 8 }]}><View style={[styles.progressBarFill, { width: `${pct}%` }]} /></View>);
                    })()}
                  </View>
                )}
                <Text style={styles.sectionTitle}>Commandes ({getClientOrders(selectedClient.id).length})</Text>
                <View style={styles.detailCard}>
                  {getClientOrders(selectedClient.id).length === 0 ? (
                    <Text style={[styles.ficheInfoText, { textAlign: "center", paddingVertical: 8 }]}>Aucune commande</Text>
                  ) : (
                    getClientOrders(selectedClient.id).slice(0, 5).map((o, idx) => (
                      <View key={o.id} style={[styles.articleRow, idx > 0 && { borderTopWidth: 1, borderTopColor: "#f1f5f9" }]}>
                        <Text style={styles.articleText}>#{o.ticket_numero || o.id?.slice(-4)}</Text>
                        <Text style={styles.articleText}>{formatDate(o.created_at)}</Text>
                        <Text style={styles.articlePrice}>{formatPrice(o.total)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
              <View style={styles.ficheActions}>
                <TouchableOpacity onPress={() => handleDeleteCustomer(selectedClient.id)} style={styles.ficheDeleteBtn}>
                  <Trash2 size={14} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.ficheDeleteBtnText}>Supprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditCustomer(selectedClient)} style={styles.ficheEditBtn}>
                  <Edit3 size={14} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.ficheEditBtnText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </View>
        </Modal>
      )}

      {showCustomerModal && renderForm(false, handleCloseCustomerModal)}
      {showEditModal && renderForm(true, handleCloseEditModal)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, backgroundColor: "#f8fafc" },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#09090b", letterSpacing: -0.5 },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#002cf7", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: "#002cf7", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  addBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  filterHeader: { backgroundColor: "#ffffff", paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(0, 0, 0, 0.03)" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1.5, borderColor: "#e2e8f0", marginHorizontal: 16, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: "#0f172a", fontWeight: "500", height: "100%" },
  chipRow: { flexDirection: "row", paddingHorizontal: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#f1f5f9", marginRight: 8 },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  chipTextActive: { color: "#ffffff", fontWeight: "600" },
  scrollContent: { padding: 16, paddingBottom: 110 },
  noResultsText: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "500" },
  clientCard: { backgroundColor: "#ffffff", borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: "#ffffff", shadowColor: "#002cf7", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  clientAvatarText: { fontSize: 15, fontWeight: "800", color: "#002cf7" },
  clientNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  clientName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  subBadge: { backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  subBadgeText: { fontSize: 9, fontWeight: "700", color: "#16a34a" },
  clientPhoneRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  clientPhone: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  clientAddress: { fontSize: 11, color: "#94a3b8" },
  clientMeta: { alignItems: "center", marginLeft: "auto" },
  clientOrderCount: { fontSize: 16, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  clientOrderLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  cardSubscriptionGaugeContainer: { marginTop: 10, backgroundColor: "rgba(0, 44, 247, 0.03)", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0, 44, 247, 0.08)" },
  cardSubText: { fontSize: 10, color: "#475569", fontWeight: "500" },
  cardSubTextBold: { fontSize: 10, color: "#002cf7", fontWeight: "700" },
  cardProgressBarBg: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  cardProgressBarFill: { height: "100%", backgroundColor: "#002cf7", borderRadius: 3 },
  compactModalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.45)", padding: 16 },
  compactModalView: { backgroundColor: "#ffffff", borderRadius: 24, padding: 20, width: "100%", maxWidth: 380, maxHeight: "85%", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  compactModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  ficheAvatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ficheAvatarLarge: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  ficheAvatarTextLarge: { fontSize: 18, fontWeight: "800", color: "#002cf7" },
  compactModalTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  ficheSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: "500" },
  compactModalScroll: { paddingBottom: 16 },
  detailCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.04)", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
  ficheInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  ficheInfoLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  ficheInfoValue: { fontSize: 13, color: "#0f172a", fontWeight: "600" },
  ficheInfoText: { fontSize: 13, color: "#64748b" },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  articleRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  articleText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  articlePrice: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  subscriptionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 8, marginBottom: 10 },
  subscriptionTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  subActiveBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  subActiveBadgeText: { fontSize: 9, color: "#15803d", fontWeight: "700" },
  subPlanName: { fontSize: 14, fontWeight: "700", color: "#002cf7" },
  subPlanBalance: { fontSize: 11, color: "#475569", fontWeight: "600", marginTop: 2 },
  progressBarBg: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#002cf7", borderRadius: 4 },
  ficheActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  ficheDeleteBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#ffe4e6", borderRadius: 14, paddingVertical: 12 },
  ficheDeleteBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
  ficheEditBtn: { flex: 2, flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#002cf7", borderRadius: 14, paddingVertical: 12 },
  ficheEditBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  formModalWrapper: { flex: 1, justifyContent: "flex-end" },
  formModal: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, maxHeight: "85%", shadowColor: "#0f172a", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 12 },
  formHandle: { width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  formSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: "500" },
  formClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  formInput: { backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0f172a" },
  prefRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  prefBtn: { flex: 1, borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingVertical: 10, alignItems: "center", backgroundColor: "#f8fafc" },
  prefBtnActive: { backgroundColor: "#eff6ff", borderColor: "#002cf7" },
  prefBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  prefBtnTextActive: { color: "#002cf7" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#002cf7", borderRadius: 16, paddingVertical: 15, marginTop: 20, shadowColor: "#002cf7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
