import React, { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity,
  Alert, BackHandler, Platform, KeyboardAvoidingView, Modal
} from "react-native";
import { Search, Plus, MapPin, Phone, ChevronRight, X, Edit3, Trash2, Award, CreditCard, Calendar } from "lucide-react-native";
import { db } from "../../../services/db";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { useScrollPaddingBottom } from "../../../hooks/useTabBarHeight";
import { CustomSelect } from "../../../components/CustomSelect";
import { useDbState } from "../../../hooks/useDbState";

export default function ClientsScreen({ onBack, onSelectClient, onShowSuccess }) {
  const { currentUser, isDarkMode } = useDbState();
  const styles = getStyles(isDarkMode);
  const [customers, setCustomers] = useState(() => db.getCustomers());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isFicheVisible, setIsFicheVisible] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCrmSubId, setSelectedCrmSubId] = useState("");

  const [custNom, setCustNom] = useState("");
  const [custPrenom, setCustPrenom] = useState("");
  const [custTelephone, setCustTelephone] = useState("");
  const [custAdresse, setCustAdresse] = useState("");
  const [custPreferences, setCustPreferences] = useState("Plié");

  const scrollPaddingBottom = useScrollPaddingBottom();

  const refreshCustomers = () => setCustomers(db.getCustomers());

  const handleSelectClientForFiche = (client) => {
    setSelectedClient(client);
    setIsFicheVisible(true);
  };

  const handleCloseFiche = () => {
    setIsFicheVisible(false);
    setTimeout(() => {
      setSelectedClient(null);
      setSelectedCrmSubId("");
    }, 250);
  };

  const catalog = db.getCatalog();

  const handleSubscribeCrm = (customerId, planId) => {
    if (!planId) {
      Alert.alert("Erreur", "Veuillez sélectionner un forfait d'abonnement.");
      return;
    }
    const updatedCust = db.subscribeCustomer(customerId, planId);
    if (updatedCust) {
      Alert.alert("Succès", `Abonnement souscrit avec succès pour ${updatedCust.prenom} ${updatedCust.nom} !`);
      setSelectedCrmSubId('');
      setSelectedClient({ ...updatedCust });
      refreshCustomers();
    }
  };

  const handleUnsubscribeCrm = (customerId) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir résilier cet abonnement ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Résilier", 
          style: "destructive",
          onPress: () => {
            const updatedCust = db.unsubscribeCustomer(customerId);
            if (updatedCust) {
              Alert.alert("Succès", "Abonnement résilié avec succès !");
              setSelectedClient({ ...updatedCust });
              refreshCustomers();
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (Platform.OS === "web") return;
    const backAction = () => {
      if (showCustomerModal) { handleCloseCustomerModal(); return true; }
      if (showEditModal) { handleCloseEditModal(); return true; }
      if (selectedClient) { handleCloseFiche(); return true; }
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
    setCustNom(""); setCustPrenom(""); setCustTelephone(""); setCustAdresse(""); setCustPreferences("Plié");
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
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
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!custNom || !custTelephone) { Alert.alert("Erreur", "Le nom et le telephone sont obligatoires."); return; }
    try {
      const isEditing = !!editingCustomer;
      if (isEditing) {
        db.updateCustomer(editingCustomer.id, { nom: custNom, prenom: custPrenom, telephone: custTelephone, adresse: custAdresse, preferences_pliage: custPreferences });
        handleCloseEditModal();
      } else {
        db.addCustomer({ nom: custNom, prenom: custPrenom, telephone: custTelephone, adresse: custAdresse, preferences_pliage: custPreferences });
        handleCloseCustomerModal();
      }
      refreshCustomers();
      if (onShowSuccess) onShowSuccess(isEditing ? "Profil client modifie !" : "Nouveau client cree !");
    } catch (e) {
      console.error("Error saving customer:", e);
      Alert.alert("Erreur", "Impossible d enregistrer le profil client.");
    }
  };

  const handleDeleteCustomer = (id) => {
    Alert.alert("Confirmation", "Voulez-vous vraiment supprimer ce client ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => {
        try {
          db.deleteCustomer(id);
          setSelectedClient(null);
          refreshCustomers();
          if (onShowSuccess) onShowSuccess("Profil client supprimé avec succès.");
        }
        catch (e) {
          console.error("Error deleting customer:", e);
          Alert.alert("Erreur", "Impossible de supprimer ce client.");
        }
      }}
    ]);
  };

  const getClientOrders = (clientId) => db.getOrders().filter(o => o.customer_id === clientId);

  const formatPrice = (price) => (price || 0).toLocaleString("fr-FR") + " FCFA";

  const renderForm = (isEditing, onClose, visible) => (
    <Modal
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      transparent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.compactModalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <MotiView
            from={{ opacity: 0, scale: 0.88, translateY: 48 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 16, mass: 0.8 }}
            style={styles.compactModalView}
          >
            <View style={styles.compactModalHeader}>
              <Text style={styles.compactModalTitle}>
                {isEditing ? "Modifier le Profil Client" : "Nouveau Profil Client"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.compactModalScroll} bounces={false} showsVerticalScrollIndicator={false}>
              <View style={styles.compactInputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compactLabel}>Prénom</Text>
                  <TextInput
                    placeholder="Prénom"
                    placeholderTextColor="#a1a1aa"
                    value={custPrenom}
                    onChangeText={setCustPrenom}
                    style={styles.compactInput}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.compactLabel}>Nom *</Text>
                  <TextInput
                    placeholder="Nom"
                    placeholderTextColor="#a1a1aa"
                    value={custNom}
                    onChangeText={setCustNom}
                    style={styles.compactInput}
                  />
                </View>
              </View>

              <Text style={styles.compactLabel}>Téléphone *</Text>
              <TextInput
                placeholder="Ex: +229 97 00 00 00"
                placeholderTextColor="#a1a1aa"
                keyboardType="phone-pad"
                value={custTelephone}
                onChangeText={setCustTelephone}
                style={styles.compactInput}
              />

              <Text style={styles.compactLabel}>Adresse</Text>
              <TextInput
                placeholder="Ex: Cotonou, Haie Vive"
                placeholderTextColor="#a1a1aa"
                value={custAdresse}
                onChangeText={setCustAdresse}
                style={styles.compactInput}
              />

              <Text style={styles.compactLabel}>Préférence de pliage</Text>
              <View style={styles.prefSelector}>
                <TouchableOpacity 
                  onPress={() => setCustPreferences('Plié')}
                  style={[styles.prefOption, custPreferences === 'Plié' && styles.prefOptionActive]}
                >
                  <Text style={[styles.prefText, custPreferences === 'Plié' && styles.prefTextActive]}>Plié</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setCustPreferences('Cintre')}
                  style={[styles.prefOption, custPreferences === 'Cintre' && styles.prefOptionActive]}
                >
                  <Text style={[styles.prefText, custPreferences === 'Cintre' && styles.prefTextActive]}>Sur Cintre</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSaveCustomer}
                style={styles.compactSubmitBtn}
              >
                <Text style={styles.compactSubmitBtnText}>Enregistrer le client</Text>
              </TouchableOpacity>
            </ScrollView>
          </MotiView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
        {/* Horizontal filter chips */}
        <ScrollView 
          horizontal 
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false} 
          style={styles.chipRow}
          onTouchStart={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
          onMouseDown={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
        >
          <TouchableOpacity onPress={() => setFilterType("all")} style={[styles.chip, filterType === "all" && styles.chipActive]}>
            <Text style={[styles.chipText, filterType === "all" && styles.chipTextActive]}>Tous ({customers.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterType("abonnes")} style={[styles.chip, filterType === "abonnes" && styles.chipActive]}>
            <Text style={[styles.chipText, filterType === "abonnes" && styles.chipTextActive]}>Abonnes ({abonnesCount})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
        {filteredClients.length === 0 ? (
          <Text style={styles.noResultsText}>Aucun client correspondant</Text>
        ) : (
          filteredClients.map((client, index) => {
            const clientOrders = getClientOrders(client.id);
            const hasActiveSub = client.active_subscription && client.active_subscription.remaining_clothes > 0;
            return (
              <MotiView key={client.id} from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 120, delay: index * 15 }}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleSelectClientForFiche(client)} style={styles.clientCard}>
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
        <Modal animationType="none" visible={!!selectedClient} onRequestClose={handleCloseFiche} transparent={true}>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: isFicheVisible ? 1 : 0 }}
            transition={{ type: 'timing', duration: 100 }}
            style={{ flex: 1 }}
          >
            <View style={styles.compactModalOverlay}>
              <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleCloseFiche}>
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
              </TouchableOpacity>
              <MotiView
                from={{ opacity: 0, scale: 0.9, translateY: 40 }}
                animate={{
                  opacity: isFicheVisible ? 1 : 0,
                  scale: isFicheVisible ? 1 : 0.9,
                  translateY: isFicheVisible ? 0 : 40
                }}
                transition={{ type: 'spring', damping: 15, mass: 0.8 }}
                style={styles.compactModalView}
              >
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
                  <TouchableOpacity onPress={handleCloseFiche}>
                    <X size={20} color="#71717a" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
                  {(() => {
                    const activeClient = customers.find(c => c.id === selectedClient.id) || selectedClient;
                    return (
                      <>
                        <View style={styles.detailCard}>
                          {activeClient.adresse ? (
                            <View style={styles.ficheInfoRow}><MapPin size={13} color="#71717a" /><Text style={styles.ficheInfoText}>{activeClient.adresse}</Text></View>
                          ) : null}
                          <View style={styles.ficheInfoRow}>
                            <Text style={styles.ficheInfoLabel}>Preferences :</Text>
                            <Text style={styles.ficheInfoValue}>
                              {activeClient.preferences_pliage === 'Cintre' ? 'Sur Cintre' : (activeClient.preferences_pliage || 'Plié')}
                            </Text>
                          </View>
                        </View>

                        {/* Fidélité & Dette */}
                        <View style={styles.detailCard}>
                          <View style={styles.ficheInfoRow}>
                            <Award size={13} color="#71717a" style={{ marginRight: 6 }} />
                            <Text style={styles.ficheInfoLabel}>Points Fidélité :</Text>
                            <Text style={[styles.ficheInfoValue, { color: '#059669', fontWeight: '700' }]}>
                              {activeClient.points_fidelite || 0} pts
                            </Text>
                          </View>
                          <View style={styles.ficheInfoRow}>
                            <CreditCard size={13} color="#71717a" style={{ marginRight: 6 }} />
                            <Text style={styles.ficheInfoLabel}>Solde Dette :</Text>
                            <Text style={[styles.ficheInfoValue, { color: (activeClient.solde_dette || 0) > 0 ? '#ef4444' : '#64748b', fontWeight: '700' }]}>
                              {formatPrice(activeClient.solde_dette || 0)}
                            </Text>
                          </View>
                          <View style={styles.ficheInfoRow}>
                            <Calendar size={13} color="#71717a" style={{ marginRight: 6 }} />
                            <Text style={styles.ficheInfoLabel}>Membre depuis :</Text>
                            <Text style={styles.ficheInfoValue}>
                              {activeClient.created_at ? new Date(activeClient.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </Text>
                          </View>
                        </View>

                        {/* Abonnement Card */}
                        {(() => {
                          const canSubscribe = currentUser?.role !== 'livreur';
                          let subscriptionForm = null;

                          if (activeClient.active_subscription) {
                            const rem = activeClient.active_subscription.remaining_clothes;
                            const tot = activeClient.active_subscription.total_clothes;
                            const pct = Math.max(0, Math.min(100, Math.round(((tot - rem) / tot) * 100)));
                            
                            subscriptionForm = (
                              <View style={{ gap: 8 }}>
                                <Text style={styles.subPlanName}>{activeClient.active_subscription.name}</Text>
                                <Text style={styles.subPlanBalance}>{activeClient.active_subscription.remaining_clothes} vet. restants / {activeClient.active_subscription.total_clothes} vet.</Text>
                                <View style={[styles.progressBarBg, { marginTop: 4 }]}>
                                  <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                  <Text style={{ fontSize: 10, color: '#64748b' }}>
                                    Du : {new Date(activeClient.active_subscription.subscribed_at).toLocaleDateString('fr-FR')}
                                  </Text>
                                  <Text style={{ fontSize: 10, color: '#64748b' }}>
                                    Au : {new Date(activeClient.active_subscription.expires_at).toLocaleDateString('fr-FR')}
                                  </Text>
                                </View>
                                {canSubscribe && (
                                  <TouchableOpacity onPress={() => handleUnsubscribeCrm(activeClient.id)} style={styles.unsubscribeBtn} activeOpacity={0.8}>
                                    <Text style={styles.unsubscribeBtnText}>Résilier l'abonnement</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          } else if (canSubscribe) {
                            subscriptionForm = (
                              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                <View style={{ flex: 1 }}>
                                  <CustomSelect
                                    value={selectedCrmSubId}
                                    onChange={(val) => setSelectedCrmSubId(val)}
                                    options={[
                                      { label: "-- Choisir une formule --", value: "" },
                                      ...catalog.filter(item => item.service === 'abonnement').map(sub => ({
                                        label: `${sub.article} (${sub.prix.toLocaleString('fr-FR')} F/m)`,
                                        value: sub.id
                                      }))
                                    ]}
                                    placeholder="Choisir une formule"
                                  />
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleSubscribeCrm(activeClient.id, selectedCrmSubId)}
                                  style={styles.subscribeBtn}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.subscribeBtnText}>Souscrire</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          } else {
                            subscriptionForm = (
                              <Text style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                                Souscription réservée aux gérants et agents d'accueil
                              </Text>
                            );
                          }

                          return (
                            <>
                              <Text style={styles.sectionTitle}>Forfait d'Abonnement</Text>
                              <View style={styles.detailCard}>
                                <View style={styles.subscriptionHeader}>
                                  <Text style={styles.subscriptionTitle}>Abonnement</Text>
                                  {activeClient.active_subscription && (
                                    <View style={styles.subActiveBadge}><Text style={styles.subActiveBadgeText}>ACTIF</Text></View>
                                  )}
                                </View>
                                {subscriptionForm}
                              </View>
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
                </ScrollView>
                <View style={styles.ficheActions}>
                  {currentUser && currentUser.role !== 'livreur' && (
                    <TouchableOpacity onPress={() => handleDeleteCustomer(selectedClient.id)} style={styles.ficheDeleteBtn}>
                      <Trash2 size={14} color="#ef4444" style={{ marginRight: 4 }} />
                      <Text style={styles.ficheDeleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleEditCustomer(selectedClient)} style={styles.ficheEditBtn}>
                    <Edit3 size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.ficheEditBtnText}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            </View>
          </MotiView>
        </Modal>
      )}

      {renderForm(false, handleCloseCustomerModal, showCustomerModal)}
      {renderForm(true, handleCloseEditModal, showEditModal)}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, backgroundColor: "#ffffff" },
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
  compactInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  compactInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 12,
    width: '100%',
  },
  prefSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  prefOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  prefOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prefText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  prefTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  compactSubmitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    width: '100%',
  },
  compactSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  unsubscribeBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  unsubscribeBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  subscribeBtn: {
    backgroundColor: '#002cf7',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

const getStyles = (isDarkMode) => {
  if (!isDarkMode) return baseStyles;
  
  const overrides = {
    container: { backgroundColor: '#0f172a' },
    header: { backgroundColor: '#0f172a' },
    headerTitle: { color: '#ffffff' },
    backBtn: { backgroundColor: '#1e293b', borderColor: '#334155' },
    filterHeader: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
    searchContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    searchInput: { color: '#ffffff' },
    chip: { backgroundColor: '#334155' },
    chipActive: { backgroundColor: '#002cf7' },
    chipText: { color: '#cbd5e1' },
    chipTextActive: { color: '#ffffff' },
    clientCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    clientAvatar: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    clientAvatarText: { color: '#38bdf8' },
    clientName: { color: '#ffffff' },
    clientPhone: { color: '#cbd5e1' },
    clientFooter: { borderTopColor: '#334155' },
    clientMetaText: { color: '#cbd5e1' },
    emptyStateContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    emptyStateText: { color: '#94a3b8' },
    
    // Modal & Form overrides
    modalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    modalContent: { backgroundColor: '#1e293b', borderColor: '#334155' },
    modalTitle: { color: '#ffffff' },
    modalLabel: { color: '#e2e8f0' },
    modalInput: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' },
    
    // Compact Modal & Form overrides
    compactModalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    compactModalView: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    compactModalTitle: { color: '#ffffff' },
    compactLabel: { color: '#cbd5e1' },
    compactInput: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' },
    
    // Fiche client details card overrides
    detailCard: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1 },
    ficheAvatarLarge: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    ficheAvatarTextLarge: { color: '#38bdf8' },
    ficheSubtitle: { color: '#cbd5e1' },
    ficheInfoLabel: { color: '#cbd5e1' },
    ficheInfoText: { color: '#ffffff' },
    ficheInfoValue: { color: '#ffffff' },
    sectionTitle: { color: '#cbd5e1' },
    subscriptionTitle: { color: '#ffffff' },
    subPlanName: { color: '#38bdf8' },
    subPlanBalance: { color: '#cbd5e1' },
    progressBarBg: { backgroundColor: '#334155' },
    unsubscribeBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
    unsubscribeBtnText: { color: '#f87171' },
    ficheDeleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
    ficheDeleteBtnText: { color: '#f87171' },
    
    // Segmented controller overrides
    prefSelector: { backgroundColor: '#0f172a' },
    prefOptActive: { backgroundColor: '#1e293b' },
    prefOptText: { color: '#cbd5e1' },
    prefOptTextActive: { color: '#ffffff' },
    
    // Subscriptions overrides
    subContainer: { backgroundColor: '#0f172a', borderColor: '#334155' },
    subActiveTitle: { color: '#ffffff' },
    subMetaRow: { borderTopColor: '#334155' },
    subMetaLabel: { color: '#94a3b8' },
    subMetaValue: { color: '#ffffff' },
    subProgressTrack: { backgroundColor: '#334155' },
  };

  const merged = {};
  Object.keys(baseStyles).forEach(key => {
    merged[key] = StyleSheet.flatten(baseStyles[key]);
  });
  Object.keys(overrides).forEach(key => {
    merged[key] = { ...merged[key], ...overrides[key] };
  });
  return merged;
};
