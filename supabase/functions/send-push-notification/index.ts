import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function : send-push-notification
 * 
 * Appel via Database Webhook sur la table `orders` (INSERT, UPDATE)
 * ou via un appel HTTP direct depuis n'importe quelle source.
 *
 * Payload attendu :
 * {
 *   "type": "INSERT" | "UPDATE",
 *   "table": "orders",
 *   "record": { ...order fields... },
 *   "old_record": { ...previous order fields... } // pour UPDATE
 * }
 */

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  traitement: 'En cours de traitement',
  en_cours_lavage: 'En cours de lavage',
  en_cours_repassage: 'En cours de repassage',
  pret: 'Prête',
  a_livrer: 'Prête à livrer',
  a_recuperer: 'À récupérer',
  en_cours_livraison: 'En cours de livraison',
  restitue: 'Restituée / Livrée',
  annule: 'Annulée',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload = await req.json();
    const { type: eventType, record: order, old_record: oldOrder } = payload;

    if (!order || !order.id) {
      return new Response(JSON.stringify({ error: 'Payload invalide' }), { status: 400 });
    }

    // Ne traiter que les INSERT et UPDATE sur les commandes
    if (eventType !== 'INSERT' && eventType !== 'UPDATE') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Événement ignoré' }), { status: 200 });
    }

    // Pour les UPDATE, vérifier qu'il y a un vrai changement de statut
    if (eventType === 'UPDATE') {
      const newStatus = order.statut || order.status;
      const prevStatus = oldOrder?.statut || oldOrder?.status;
      if (newStatus === prevStatus) {
        return new Response(JSON.stringify({ skipped: true, reason: 'Statut inchangé' }), { status: 200 });
      }
    }

    // Initialiser le client Supabase (service role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer tous les push tokens du staff actif
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('id, push_token, prenom, nom')
      .not('push_token', 'is', null)
      .eq('statut', 'actif');

    if (staffError) {
      console.error('[send-push] Erreur récupération staff:', staffError.message);
      return new Response(JSON.stringify({ error: staffError.message }), { status: 500 });
    }

    const tokens: string[] = (staffList || [])
      .map((s: { push_token?: string }) => s.push_token)
      .filter((t): t is string => !!t && t.startsWith('ExponentPushToken['));

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'Aucun token disponible' }), { status: 200 });
    }

    // Construire le message de notification
    const ref = order.identifiant_unique_marquage || order.id || 'N/A';
    const newStatus = order.statut || order.status || '';
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;

    let title = '';
    let body = '';
    if (eventType === 'INSERT') {
      title = '🧺 Nouvelle commande reçue';
      body = `Commande ${ref} — ${statusLabel}`;
    } else {
      title = '📦 Statut mis à jour';
      body = `Commande ${ref} → ${statusLabel}`;
    }

    // Envoyer les push notifications via l'API Expo
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        orderId: order.id,
        statut: newStatus,
        ref,
        screen: 'gestion',
      },
      priority: 'high',
      channelId: 'orders',
    }));

    // Expo accepte des batches de 100 messages max
    const batchSize = 100;
    let totalSent = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[send-push] Erreur Expo API:', errText);
      } else {
        totalSent += batch.length;
      }
    }

    console.log(`[send-push] ✅ ${totalSent} notification(s) envoyée(s) pour commande ${ref}`);

    return new Response(JSON.stringify({ sent: totalSent, title, body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[send-push] Exception:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
