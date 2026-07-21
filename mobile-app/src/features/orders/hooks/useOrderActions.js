/**
 * @file useOrderActions.js
 * @description Hook ViewModel encapsulant la logique métier des actions sur les commandes.
 * Gère le cycle de vie des statuts, les flux d'annulation, de règlement final, et les animations de transition.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../../../services/db';

/**
 * Hook personnalisé pour orchestrer les actions sur les commandes.
 * 
 * @param {Object} options - Dépendances d'affichage et de notification.
 * @param {Function} options.onShowSuccess - Callback pour afficher un toast de succès.
 * @param {Function} options.setSelectedOrder - Met à jour la commande sélectionnée dans la vue détaillée.
 * @param {Function} options.setShowOrderDetails - Contrôle l'affichage de la modale de détails.
 * @returns {Object} États et gestionnaires d'actions pour les commandes.
 */
export default function useOrderActions({
  onShowSuccess,
  setSelectedOrder,
  setShowOrderDetails
}) {
  // --- ÉTATS D'ANIMATION ---
  const [animatingOrderIds, setAnimatingOrderIds] = useState({});

  // --- ÉTATS MODALE D'ANNULATION ---
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // --- ÉTATS MODALE DE PAIEMENT/LIVRAISON ---
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentNextStatus, setPaymentNextStatus] = useState('');

  /**
   * Déclenche une animation visuelle avant d'exécuter la mise à jour effective.
   * @param {String} orderId - ID de la commande.
   * @param {String} nextStatus - Statut cible.
   * @param {Function} callback - Action finale (mutation BD).
   */
  const triggerFinalStatusAnimation = (orderId, nextStatus, callback) => {
    setAnimatingOrderIds(prev => ({ ...prev, [orderId]: nextStatus }));
    setTimeout(async () => {
      await callback();
      setAnimatingOrderIds(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 850);
  };

  /**
   * Initialise le flux d'annulation pour une commande spécifique.
   * @param {Object} order - La commande à annuler.
   */
  const openCancelFlow = (order) => {
    setOrderToCancel(order);
    setCancelModalVisible(true);
  };

  /**
   * Confirme l'annulation de la commande courante avec un motif.
   * @param {String} reason - Raison de l'annulation.
   */
  const confirmCancel = (reason) => {
    if (!orderToCancel) return;
    
    setCancelModalVisible(false);

    const performCancel = async () => {
      try {
        await db.cancelOrder(orderToCancel.id, reason);
        if (onShowSuccess) {
          onShowSuccess("Commande annulée avec succès.");
        }
        if (setShowOrderDetails) {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }
      } catch (e) {
        console.error("Error cancelling order:", e);
        Alert.alert("Erreur", "Impossible d'annuler cette commande.");
      }
    };

    triggerFinalStatusAnimation(orderToCancel.id, 'annule', performCancel);
  };

  /**
   * Initialise le flux de paiement final et de livraison.
   * @param {Object} order - La commande.
   * @param {String} nextStatus - Le statut suivant (ex: 'restitue').
   */
  const openPaymentFlow = (order, nextStatus) => {
    setPaymentOrder(order);
    setPaymentNextStatus(nextStatus);
    setPaymentModalVisible(true);
  };

  /**
   * Valide le règlement et finalise la restitution de la commande.
   * @param {String} method - Mode de paiement ('Espèces' ou 'Mobile Money').
   * @param {String|null} reference - Référence de transaction Mobile Money.
   */
  const confirmPayment = (method, reference) => {
    if (!paymentOrder) return;

    const soldeRestant = paymentOrder.prix_total - (paymentOrder.avance_payee || 0);

    const performUpdate = async () => {
      try {
        await db.deliverOrderWithPayment(
          paymentOrder.id,
          soldeRestant,
          method,
          paymentNextStatus,
          reference
        );
        if (onShowSuccess) {
          onShowSuccess("Paiement enregistré et commande finalisée.");
        }
      } catch (e) {
        console.error("Error validating payment:", e);
        Alert.alert("Erreur", "Impossible de valider le règlement.");
      }
    };

    setPaymentModalVisible(false);
    if (setShowOrderDetails) {
      setShowOrderDetails(false);
      setSelectedOrder(null);
    }

    triggerFinalStatusAnimation(paymentOrder.id, paymentNextStatus, performUpdate);
  };

  /**
   * Met à jour le statut d'une commande instantanément (sans flux de paiement/annulation).
   * @param {Object} order - La commande.
   * @param {String} nextStatus - Le statut cible.
   */
  const updateStatusDirect = async (order, nextStatus) => {
    try {
      await db.updateOrderStatus(order.id, nextStatus);
      const updated = db.getOrders().find(o => o.id === order.id);
      if (updated && setSelectedOrder) setSelectedOrder(updated);
    } catch (e) {
      console.error("Error updating status directly:", e);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  /**
   * Transitionne une commande vers son statut logique suivant.
   * Gère l'affichage automatique de la modale de paiement si le statut cible est final.
   * @param {Object} order - La commande à traiter.
   * @param {Boolean} updateSelected - Si vrai, met à jour la commande sélectionnée dans les détails.
   */
  const handleNextStatus = async (order, updateSelected = false) => {
    let nextStatus = 'en_attente';
    const status = order.statut;
    if (status === 'attente' || status === 'en_attente') nextStatus = 'traitement';
    else if (status === 'traitement') nextStatus = 'en_cours_lavage';
    else if (status === 'lavage_cours' || status === 'en_cours_lavage') nextStatus = 'en_cours_repassage';
    else if (status === 'repassage_cours' || status === 'en_cours_repassage') nextStatus = 'pret';
    else if (status === 'a_livrer') nextStatus = 'en_cours_livraison';
    else if (status === 'en_cours_livraison') nextStatus = 'livre';
    else if (status === 'a_recuperer') nextStatus = 'restitue';
    else return;

    const isFinal = nextStatus === 'livre' || nextStatus === 'restitue';

    // Si la commande est finalisée et n'est pas un forfait, exiger le paiement du solde restant
    if (isFinal && !order.is_subscription_order) {
      setPaymentOrder(order);
      setPaymentNextStatus(nextStatus);
      setPaymentModalVisible(true);
      return;
    }

    const performUpdate = async () => {
      try {
        await db.updateOrderStatus(order.id, nextStatus);
        if (updateSelected) {
          const updated = db.getOrders().find(o => o.id === order.id);
          if (updated && setSelectedOrder) setSelectedOrder(updated);
        }
      } catch (e) {
        console.error("Error performing status update:", e);
        Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
      }
    };

    if (isFinal) {
      if (setShowOrderDetails) {
        setShowOrderDetails(false);
        setSelectedOrder(null);
      }
      triggerFinalStatusAnimation(order.id, nextStatus, performUpdate);
    } else {
      await performUpdate();
    }
  };

  return {
    animatingOrderIds,
    cancelModalVisible,
    setCancelModalVisible,
    orderToCancel,
    paymentModalVisible,
    setPaymentModalVisible,
    paymentOrder,
    paymentNextStatus,
    openCancelFlow,
    confirmCancel,
    openPaymentFlow,
    confirmPayment,
    updateStatusDirect,
    handleNextStatus
  };
}
