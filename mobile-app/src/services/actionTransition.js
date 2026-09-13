/**
 * @file actionTransition.js
 * @description Service de transition avec Spinner HeroUI Indeterminate (2 secondes)
 * et fusion d'animation de succès dans le même modal pour la clôture de commande.
 */

let transitionListener = null;
let isCurrentlyTransitioning = false;

/**
 * Enregistre le gestionnaire d'affichage de la modale de transition (utilisé par App.js)
 */
export const registerTransitionHandler = (handler) => {
  transitionListener = handler;
};

/**
 * Déclenche une transition visuelle avec le Spinner HeroUI.
 * Supporte une transition fluide vers un état de succès dans le même modal.
 * 
 * @param {string} [message='Traitement en cours...'] - Message de chargement
 * @param {number} [duration=2000] - Durée de la phase spinner
 * @param {Object} [successOptions=null] - { message: string, duration?: number }
 * @returns {Promise<void>}
 */
export const triggerActionTransition = (
  message = 'Traitement en cours...',
  duration = 2000,
  successOptions = null
) => {
  return new Promise((resolve) => {
    isCurrentlyTransitioning = true;

    if (transitionListener) {
      transitionListener({ visible: true, phase: 'loading', message });
    }

    setTimeout(() => {
      if (successOptions && successOptions.message) {
        if (transitionListener) {
          transitionListener({
            visible: true,
            phase: 'success',
            message: successOptions.message,
          });
        }
        const successDuration = successOptions.duration || 1200;
        setTimeout(() => {
          if (transitionListener) {
            transitionListener({ visible: false, phase: 'idle', message: '' });
          }
          isCurrentlyTransitioning = false;
          resolve();
        }, successDuration);
      } else {
        if (transitionListener) {
          transitionListener({ visible: false, phase: 'idle', message: '' });
        }
        isCurrentlyTransitioning = false;
        resolve();
      }
    }, duration);
  });
};

/**
 * Enveloppe une action asynchrone pour afficher le Spinner HeroUI pendant au moins 2 secondes,
 * avec support optionnel d'une animation de confirmation fusionnée dans le même modal.
 * 
 * @param {Function} asyncAction - La fonction asynchrone à exécuter
 * @param {string} [message='En cours...'] - Le message affiché pendant le spinner
 * @param {number} [minDuration=2000] - Durée minimale du spinner (2s)
 * @param {Object} [successOptions=null] - { message: string, duration?: number }
 * @returns {Promise<any>}
 */
export const withActionTransition = async (
  asyncAction,
  message = 'En cours...',
  minDuration = 2000,
  successOptions = null
) => {
  if (isCurrentlyTransitioning) {
    return typeof asyncAction === 'function' ? asyncAction() : undefined;
  }
  isCurrentlyTransitioning = true;

  if (transitionListener) {
    transitionListener({ visible: true, phase: 'loading', message });
  }

  const startTime = Date.now();
  let result;
  let actionError = null;

  try {
    if (typeof asyncAction === 'function') {
      result = await asyncAction();
    }
  } catch (err) {
    actionError = err;
  }

  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minDuration - elapsed);

  if (remaining > 0) {
    await new Promise(r => setTimeout(r, remaining));
  }

  if (actionError) {
    if (transitionListener) {
      transitionListener({ visible: false, phase: 'idle', message: '' });
    }
    isCurrentlyTransitioning = false;
    throw actionError;
  }

  // Animation de succès fusionnée dans le MÊME modal
  if (successOptions && successOptions.message) {
    if (transitionListener) {
      transitionListener({
        visible: true,
        phase: 'success',
        message: successOptions.message,
      });
    }
    const successDuration = successOptions.duration || 1200;
    await new Promise(r => setTimeout(r, successDuration));
  }

  if (transitionListener) {
    transitionListener({ visible: false, phase: 'idle', message: '' });
  }
  isCurrentlyTransitioning = false;

  return result;
};

export const isActionTransitioning = () => isCurrentlyTransitioning;

export default {
  triggerActionTransition,
  withActionTransition,
  registerTransitionHandler,
  isActionTransitioning,
};
