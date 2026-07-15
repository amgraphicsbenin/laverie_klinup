import React, { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity,
  Alert, BackHandler, Platform, KeyboardAvoidingView
} from "react-native";
import { Search, Plus, User, MapPin, ChevronLeft, ChevronRight, X, Check } from "lucide-react-native";
import { db } from "../services/db";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function ClientsScreen({ onBack, onSelectClient, onShowSuccess }) {
  const customers = db.getCustomers();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [custNom, setCustNom] = useState("");
  const [custPrenom, setCustPrenom] = useState("");
  const [custTelephone, setCustTelephone] = useState("");
  const [custAdresse, setCustAdresse] = useState("");
  const [custPreferences, setCustPreferences] = useState("Plié");

  useEffect(() => {
    if (Platform.OS === "web") return;
    const backAction = () => {
      if (showCustomerModal) { handleCloseCustomerModal(); return true; }
      if (selectedClient) { setSelectedClient(null); return true; }
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [showCustomerModal, selectedClient]);

  const filteredClients = customers.filter(c => {
    const fullname = `${c.prenom} ${c.nom}`.toLowerCase();
    const phone = (c.telephone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullname.includes(query) || phone.includes(query);
  });

  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustNom(""); setCustPrenom(""); setCustTelephone(""); setCustAdresse(""); setCustPreferences("Plié");
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustNom(""); setCustPrenom(""); setCustTelephone(""); setCustAdresse(""); setCustPreferences("Plié");
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (client) => {
    setEditingCustomer(client);
    setCustNom(client.nom); setCustPrenom(client.prenom); setCustTelephone(client.telephone);
    setCustAdresse(client.adresse || ""); setCustPreferences(client.preferences_pliage || "Plié");
    setSelectedClient(null);
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!custNom || !custTelephone) { Alert.alert("Erreur", "Le nom et le téléphone sont obligatoires."); return; }
    try {
      const isEditing = !!editingCustomer;
      if (isEditing) {
        await db.updateCustomer(editingCustomer.id, { nom: custNom, prenom: custPrenom, telephone: custTelephone, adresse: custAdresse, preferences_pliage: custPreferences });
      } else {
        await db.addCustomer({ nom: custNom, prenom: custPrenom, telephone: custTelephone, adresse: custAdresse, preferences_pliage: custPreferences });
      }
      handleCloseCustomerModal();
      if (onShowSuccess) onShowSuccess(isEditing ? "Profil client modifié avec succès !" : "Nouveau client créé avec succès !");
    } catch (e) { Alert.alert("Erreur", "Impossible d'enregistrer le profil client."); }
  };

  const handleDeleteCustomer = (id) => {
    Alert.alert("Confirmation", "Voulez-vous vraiment supprimer ce client ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => { try { await db.deleteCustomer(id); setSelectedClient(null); } catch (e) { Alert.alert("Erreur", "Impossible de supprimer ce client."); } } }
    ]);
  };

  const getClientOrders = (clientId) => db.getOrders().filter(o => o.customer_id === clientId);
  const formatDate = (dateStr) => { if (!dateStr) return "N/A"; try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; } };
  const formatPrice = (price) => (price || 0).toLocaleString("fr-FR") + " FCFA";

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#eff6ff", "#f8fafc"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#002cf7" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Clients</Text>
            <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{customers.length}</Text></View>
          </View>
          <TouchableOpacity onPress={handleOpenAddCustomer} style={styles.addBtn} activeOpacity={0.8}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Nouveau</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Search size={16} color="#71717a" style={{ marginRight: 8 }} />
          <TextInput placeholder="Rechercher par nom ou téléphone..." placeholderTextColor="#a1a1aa" value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery("")}><X size={14} color="#71717a" /></TouchableOpacity>}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}><User size={32} color="#bfdbfe" /></View>
            <Text style={styles.emptyTitle}>Aucun client trouvé</Text>
            <Text style={styles.emptySubtitle}>{searchQuery ? "Essayez un autre terme de recherche." : "Appuyez sur « Nouveau » pour ajouter un client."}</Text>
          </View>
        ) : (
          filteredClients.map((client, index) => {
            const clientOrders = getClientOrders(client.id);
            const hasActiveSub = client.active_subscription && client.active_subscription.remaining_clothes > 0;
            return (
              <MotiView key={client.id} from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 300, delay: index * 40 }}>
                <TouchableOpacity activeOpacity={0.75} onPress={() => setSelectedClient(client)} style={styles.clientCard}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{(client.prenom?.[0] || "") + (client.nom?.[0] || "")}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <View style={styles.clientNameRow}>
                      <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
                      {hasActiveSub && <View style={styles.subBadge}><Text style={styles.subBadgeText}>Abonné</Text></View>}
                    </View>
                    <Text style={styles.clientPhone}>{client.telephone}</Text>
                    {client.adresse ? <Text style={styles.clientAddress} numberOfLines={1}>{client.adresse}</Text> : null}
                  </View>
                  <View style={styles.clientMeta}>
                    <Text style={styles.clientOrderCount}>{clientOrders.length}</Text>
                    <Text style={styles.clientOrderLabel}>cmde{clientOrders.length > 1 ? "s" : ""}</Text>
                    <ChevronRight size={14} color="#a1a1aa" style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <MotiView from={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15 }} style={styles.fabContainer}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleOpenAddCustomer} style={styles.fab}><Plus size={24} color="#ffffff" /></TouchableOpacity>
      </MotiView>

      {/* FICHE CLIENT */}
      {selectedClient && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectedClient(null)}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <MotiView from={{ opacity: 0, scale: 0.88, translateY: 60 }} animate={{ opacity: 1, scale: 1, translateY: 0 }} transition={{ type: "spring", damping: 16 }} style={styles.ficheModal}>
            <View style={styles.ficheHeader}>
              <View>
                <Text style={styles.ficheTitle}>{selectedClient.prenom} {selectedClient.nom}</Text>
                <Text style={styles.ficheSubtitle}>{selectedClient.telephone}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedClient(null)} style={styles.ficheClose}><X size={18} color="#71717a" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {selectedClient.adresse ? <View style={styles.ficheInfoRow}><MapPin size={14} color="#71717a" /><Text style={styles.ficheInfoText}>{selectedClient.adresse}</Text></View> : null}
              <View style={styles.ficheInfoRow}><Text style={styles.ficheInfoLabel}>Préférences :</Text><Text style={styles.ficheInfoValue}>{selectedClient.preferences_pliage || "Plié"}</Text></View>
              {selectedClient.active_subscription ? (
                <View style={styles.ficheSubBox}>
                  <Text style={styles.ficheSubTitle}>🎫 Abonnement actif</Text>
                  <Text style={styles.ficheSubName}>{selectedClient.active_subscription.name}</Text>
                  <Text style={styles.ficheSubBalance}>{selectedClient.active_subscription.remaining_clothes} vêt. restants / {selectedClient.active_subscription.total_clothes} vêt.</Text>
                </View>
              ) : null}
              <Text style={styles.ficheOrdersTitle}>Commandes ({getClientOrders(selectedClient.id).length})</Text>
              {getClientOrders(selectedClient.id).slice(0, 5).map(o => (
                <View key={o.id} style={styles.ficheOrderRow}>
                  <Text style={styles.ficheOrderId}>#{o.ticket_numero || o.id?.slice(-4)}</Text>
                  <Text style={styles.ficheOrderDate}>{formatDate(o.created_at)}</Text>
                  <Text style={styles.ficheOrderTotal}>{formatPrice(o.total)}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.ficheActions}>
              <TouchableOpacity onPress={() => handleDeleteCustomer(selectedClient.id)} style={styles.ficheDeleteBtn}><Text style={styles.ficheDeleteBtnText}>Supprimer</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleEditCustomer(selectedClient)} style={styles.ficheEditBtn}><Text style={styles.ficheEditBtnText}>Modifier</Text></TouchableOpacity>
            </View>
          </MotiView>
        </View>
      )}

      {/* FORMULAIRE CLIENT */}
      {showCustomerModal && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleCloseCustomerModal}>
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.formModalWrapper} pointerEvents="box-none">
            <MotiView from={{ opacity: 0, scale: 0.9, translateY: 50 }} animate={{ opacity: 1, scale: 1, translateY: 0 }} transition={{ type: "spring", damping: 18 }} style={styles.formModal}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingCustomer ? "Modifier le client" : "Nouveau client"}</Text>
                <TouchableOpacity onPress={handleCloseCustomerModal} style={styles.formClose}><X size={18} color="#71717a" /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                <Text style={styles.formLabel}>Nom *</Text>
                <TextInput style={styles.formInput} value={custNom} onChangeText={setCustNom} placeholder="Nom de famille" placeholderTextColor="#a1a1aa" />
                <Text style={styles.formLabel}>Prénom</Text>
                <TextInput style={styles.formInput} value={custPrenom} onChangeText={setCustPrenom} placeholder="Prénom" placeholderTextColor="#a1a1aa" />
                <Text style={styles.formLabel}>Téléphone *</Text>
                <TextInput style={styles.formInput} value={custTelephone} onChangeText={setCustTelephone} placeholder="+229 XX XX XX XX" keyboardType="phone-pad" placeholderTextColor="#a1a1aa" />
                <Text style={styles.formLabel}>Adresse</Text>
                <TextInput style={styles.formInput} value={custAdresse} onChangeText={setCustAdresse} placeholder="Adresse (optionnel)" placeholderTextColor="#a1a1aa" />
                <Text style={styles.formLabel}>Préférences de pliage</Text>
                <View style={styles.prefRow}>
                  {["Plié", "Suspendu", "Roulé"].map(pref => (
                    <TouchableOpacity key={pref} onPress={() => setCustPreferences(pref)} style={[styles.prefBtn, custPreferences === pref && styles.prefBtnActive]}>
                      <Text style={[styles.prefBtnText, custPreferences === pref && styles.prefBtnTextActive]}>{pref}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity onPress={handleSaveCustomer} style={styles.saveBtn} activeOpacity={0.85}>
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>{editingCustomer ? "Enregistrer les modifications" : "Créer le profil"}</Text>
              </TouchableOpacity>
            </MotiView>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerGradient: { paddingTop: Platform.OS === "android" ? 44 : 8, paddingBottom: 12, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", justifyContent: "center", alignItems: "center", marginRight: 10 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  headerBadge: { backgroundColor: "#dbeafe", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#002cf7" },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#002cf7", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 5, shadowColor: "#002cf7", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  addBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  listContent: { padding: 16, paddingTop: 12 },
  clientCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center", marginRight: 12 },
  clientAvatarText: { fontSize: 16, fontWeight: "700", color: "#002cf7" },
  clientInfo: { flex: 1 },
  clientNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  clientName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  subBadge: { backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  subBadgeText: { fontSize: 9, fontWeight: "700", color: "#16a34a" },
  clientPhone: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  clientAddress: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  clientMeta: { alignItems: "center" },
  clientOrderCount: { fontSize: 16, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  clientOrderLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20 },
  fabContainer: { position: "absolute", bottom: 88, right: 20 },
  fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#002cf7", justifyContent: "center", alignItems: "center", shadowColor: "#002cf7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  ficheModal: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, shadowColor: "#0f172a", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 12 },
  ficheHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  ficheTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  ficheSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  ficheClose: { padding: 6 },
  ficheInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  ficheInfoLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  ficheInfoValue: { fontSize: 13, color: "#0f172a", fontWeight: "600" },
  ficheInfoText: { fontSize: 13, color: "#64748b" },
  ficheSubBox: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#bfdbfe", marginBottom: 12 },
  ficheSubTitle: { fontSize: 12, color: "#002cf7", fontWeight: "700", marginBottom: 4 },
  ficheSubName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  ficheSubBalance: { fontSize: 12, color: "#475569" },
  ficheOrdersTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 8, marginTop: 4 },
  ficheOrderRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  ficheOrderId: { fontSize: 12, color: "#64748b", fontWeight: "600", flex: 1 },
  ficheOrderDate: { fontSize: 12, color: "#94a3b8", flex: 1, textAlign: "center" },
  ficheOrderTotal: { fontSize: 12, fontWeight: "700", color: "#0f172a", flex: 1, textAlign: "right" },
  ficheActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  ficheDeleteBtn: { flex: 1, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#ffe4e6", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  ficheDeleteBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
  ficheEditBtn: { flex: 2, backgroundColor: "#002cf7", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  ficheEditBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  formModalWrapper: { flex: 1, justifyContent: "flex-end" },
  formModal: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, maxHeight: "85%" },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  formClose: { padding: 6 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  formInput: { backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0f172a" },
  prefRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  prefBtn: { flex: 1, borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingVertical: 10, alignItems: "center", backgroundColor: "#f8fafc" },
  prefBtnActive: { backgroundColor: "#eff6ff", borderColor: "#002cf7" },
  prefBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  prefBtnTextActive: { color: "#002cf7" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#002cf7", borderRadius: 16, paddingVertical: 15, marginTop: 20, shadowColor: "#002cf7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
