import React, { useState, useEffect } from 'react';
import {
  Bug,
  HelpCircle,
  Lightbulb,
  Send,
  CheckCircle2,
  Paperclip,
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  LifeBuoy,
  FileText,
  ChevronRight,
  RefreshCw,
  X,
  UploadCloud,
  Check,
  Trash2
} from 'lucide-react';
import { db } from '../../../services/db';

export default function HelpTab() {
  const currentUser = db.getCurrentUser();
  const [ticketType, setTicketType] = useState('bug'); // 'bug' | 'help' | 'feature'
  const [subject, setSubject] = useState('');
  const [moduleName, setModuleName] = useState('Gestion des Commandes');
  const [priority, setPriority] = useState('Moyenne'); // 'Basse' | 'Moyenne' | 'Haute' | 'Critique'
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.telephone || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState('');

  // Past tickets list fetched from Database / Memory Store
  const [recentTickets, setRecentTickets] = useState(() => {
    if (db.getSupportTickets) {
      const tickets = db.getSupportTickets();
      if (tickets) return tickets;
    }
    return [];
  });

  useEffect(() => {
    const refreshTickets = () => {
      if (db.getSupportTickets) {
        const list = db.getSupportTickets();
        setRecentTickets(list || []);
      }
    };
    refreshTickets();
  }, []);

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce ticket ?")) return;
    if (db.deleteSupportTicket) {
      await db.deleteSupportTicket(ticketId);
    }
    setRecentTickets(prev => prev.filter(t => t.id !== ticketId));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const fileNames = files.map(f => ({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }));
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendCardToTrello = async (payload) => {
    const apiKey = localStorage.getItem('klinup_trello_api_key') || '';
    const apiToken = localStorage.getItem('klinup_trello_api_token') || '';
    const idList = localStorage.getItem('klinup_trello_list_id') || '';

    if (!apiKey || !apiToken || !idList) return;

    const cardTitle = `[${payload.priority.toUpperCase()}] [${payload.module_name}] ${payload.id} - ${payload.subject}`;
    const cardDesc = `### 🐞 Signalement KLIN UP Admin
- **Référence**: ${payload.id}
- **Type**: ${payload.ticket_type === 'bug' ? 'Signalement de Bug' : payload.ticket_type === 'help' ? "Demande d'Aide" : "Suggestion"}
- **Module**: ${payload.module_name}
- **Priorité**: ${payload.priority}
- **Émetteur**: ${payload.contact_email || 'Staff Admin'} (Tel: ${payload.contact_phone || 'N/A'})
- **Date**: ${new Date().toLocaleString('fr-FR')}

#### 📝 Description :
${payload.description}

${payload.steps_to_reproduce ? `#### 🔄 Étapes pour reproduire :\n${payload.steps_to_reproduce}` : ''}`;

    try {
      const url = `https://api.trello.com/1/cards?idList=${encodeURIComponent(idList.trim())}&key=${encodeURIComponent(apiKey.trim())}&token=${encodeURIComponent(apiToken.trim())}&name=${encodeURIComponent(cardTitle)}&desc=${encodeURIComponent(cardDesc)}`;
      await fetch(url, { method: 'POST' });
      console.log('[Trello] Carte créée sur Trello avec succès !');
    } catch (err) {
      console.warn('[Trello] Erreur lors de l envoi vers Trello:', err);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Veuillez remplir le sujet et la description de votre demande.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newTicketId = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        id: newTicketId,
        ticket_type: ticketType,
        subject: subject.trim(),
        module_name: moduleName,
        priority: priority,
        status: 'Ouvert',
        description: description.trim(),
        steps_to_reproduce: stepsToReproduce.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        attached_files: attachedFiles
      };

      if (db.createSupportTicket) {
        await db.createSupportTicket(payload);
      }

      // Envoi automatique vers Trello si configuré
      await sendCardToTrello(payload);

      setSubmittedTicketId(newTicketId);
      if (db.getSupportTickets) {
        setRecentTickets(db.getSupportTickets());
      }
      setIsSubmitting(false);
      setShowSuccessToast(true);

      // Reset form fields
      setSubject('');
      setDescription('');
      setStepsToReproduce('');
      setAttachedFiles([]);

      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert("Erreur lors de l'enregistrement du ticket. Veuillez réessayez.");
    }
  };

  const getPriorityBadgeStyle = (prio) => {
    switch (prio) {
      case 'Critique': return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Haute': return { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'Moyenne': return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      default: return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const getStatusBadgeStyle = (st) => {
    switch (st) {
      case 'Résolu': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'En cours': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706' };
      default: return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      
      {/* TOAST SUCCESS NOTIFICATION */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <CheckCircle2 size={24} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Ticket enregistré avec succès !</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Référence : <strong>{submittedTicketId}</strong> • Notre équipe technique prend en charge votre demande.
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TOP HEADER CARDS (STATUS & DIRECT CONTACT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* Support Online Badge */}
        <div className="card" style={{
          borderRadius: '16px',
          padding: '1.2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <LifeBuoy size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Support Technique En Ligne</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Disponibilité : Lun - Sam (08h00 - 18h00) • SLA Urgence : &lt; 2h
            </p>
          </div>
        </div>

        {/* Direct Contact Phone / WhatsApp */}
        <div className="card" style={{
          borderRadius: '16px',
          padding: '1.2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Phone size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Assistance Téléphonique / WhatsApp</div>
            <a
              href="https://wa.me/2290167987797"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}
            >
              +229 01 67 98 77 97 ↗
            </a>
          </div>
        </div>

        {/* Email Support */}
        <div className="card" style={{
          borderRadius: '16px',
          padding: '1.2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Mail size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Email du Support Développeur</div>
            <a
              href="mailto:andre.koutomi98@gmail.com"
              style={{ fontSize: '0.82rem', color: '#a855f7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}
            >
              andre.koutomi98@gmail.com ✉
            </a>
          </div>
        </div>

      </div>

      {/* MAIN TWO-COLUMN LAYOUT: TICKET FORM & HISTORY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* ========================================================
           COLUMN 1: SMART SUPPORT & BUG REPORT FORM
           ======================================================== */}
        <div className="card" style={{
          borderRadius: '18px',
          padding: '1.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} color="var(--primary)" /> Formulaire de Demande d'Aide & Signalement
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Décrivez votre problème ou besoin pour recevoir une intervention rapide de l'équipe technique.
            </p>
          </div>

          {/* TICKET TYPE PILLS SELECTOR */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-app)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setTicketType('bug')}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: ticketType === 'bug' ? 'var(--bg-card)' : 'transparent',
                color: ticketType === 'bug' ? '#ef4444' : 'var(--text-secondary)',
                fontWeight: ticketType === 'bug' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: ticketType === 'bug' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Bug size={15} /> Signalement de Bug
            </button>
            <button
              type="button"
              onClick={() => setTicketType('help')}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: ticketType === 'help' ? 'var(--bg-card)' : 'transparent',
                color: ticketType === 'help' ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: ticketType === 'help' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: ticketType === 'help' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <HelpCircle size={15} /> Demande d'Aide
            </button>
            <button
              type="button"
              onClick={() => setTicketType('feature')}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: ticketType === 'feature' ? 'var(--bg-card)' : 'transparent',
                color: ticketType === 'feature' ? '#a855f7' : 'var(--text-secondary)',
                fontWeight: ticketType === 'feature' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: ticketType === 'feature' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Lightbulb size={15} /> Idée / Suggestion
            </button>
          </div>

          <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Sujet de la demande */}
            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                Sujet / Titre de la demande <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input-control"
                placeholder={ticketType === 'bug' ? "Ex: Impossible d'imprimer la facture sur l'atelier Cotonou" : "Ex: Comment configurer les prix de livraison pour 10km ?"}
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px' }}
              />
            </div>

            {/* Module concerné & Niveau d'Urgence */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                  Module Concerné
                </label>
                <select
                  className="input-control"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px' }}
                >
                  <option value="Vue d'Ensemble">Vue d'Ensemble (Dashboard)</option>
                  <option value="Gestion des Commandes">Gestion des Commandes</option>
                  <option value="Clients CRM">Clients CRM & Fidélité</option>
                  <option value="Catalogue Tarifs">Catalogue Tarifs</option>
                  <option value="Points de Laverie">Points de Laverie</option>
                  <option value="Frais de Livraison (GPS)">Frais de Livraison (GPS)</option>
                  <option value="Gestion des Accès">Gestion des Accès / Personnel</option>
                  <option value="Modèles de Reçus">Modèles de Reçus & Impression</option>
                  <option value="Configuration Système">Configuration Système (DB, Cloud, Trello)</option>
                  <option value="Autre">Autre / Général</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                  Niveau de Priorité
                </label>
                <select
                  className="input-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 700 }}
                >
                  <option value="Basse">🟢 Basse (Question / Détail)</option>
                  <option value="Moyenne">🟡 Moyenne (Gêne mineure)</option>
                  <option value="Haute">🟠 Haute (Fonctionnalité bloquée)</option>
                  <option value="Critique">🔴 Critique (Panne système)</option>
                </select>
              </div>
            </div>

            {/* Description détaillée */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  Description Détaillée <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{description.length} caractères</span>
              </div>
              <textarea
                className="input-control"
                rows="4"
                placeholder="Expliquez en détail le problème rencontré ou la question souhaitée..."
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', resize: 'vertical' }}
              />
            </div>

            {/* Étapes pour reproduire (si Bug) */}
            {ticketType === 'bug' && (
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                  Étapes pour reproduire le bug (Facultatif)
                </label>
                <textarea
                  className="input-control"
                  rows="2"
                  placeholder="Ex: 1. Aller sur Commandes 2. Cliquer sur Valider 3. Un message d'erreur s'affiche"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.82rem', borderRadius: '10px', resize: 'vertical' }}
                />
              </div>
            )}

            {/* Informations de contact de l'émetteur */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                  Téléphone de contact
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ex: 0197000000"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                  Email de contact
                </label>
                <input
                  type="email"
                  className="input-control"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="votre.email@klinup.com"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px' }}
                />
              </div>
            </div>

            {/* Pièces jointes / Capture d'écran */}
            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                Pièce Jointe / Capture d'écran (Facultatif)
              </label>
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                background: 'var(--bg-app)',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <UploadCloud size={24} color="var(--primary)" style={{ marginBottom: '0.25rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Cliquez ou glissez une image / fichier ici
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  PNG, JPG, PDF (max 10MB)
                </div>
              </div>

              {attachedFiles.length > 0 && (
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-app)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        <Paperclip size={13} color="var(--primary)" />
                        <span>{file.name} ({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton de Soumission */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 44, 247, 0.3)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" /> Envoi du ticket en cours...
                </>
              ) : (
                <>
                  <Send size={16} /> Envoyer la Demande au Support
                </>
              )}
            </button>
          </form>
        </div>

        {/* ========================================================
           COLUMN 2: HISTORIQUE DES TICKETS & FAQ RAPIDE
           ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* RECENT TICKETS CARD */}
          <div className="card" style={{
            borderRadius: '18px',
            padding: '1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--primary)" /> Vos Tickets Récents
              </h3>
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontSize: '0.7rem' }}>
                {recentTickets.length} Tickets
              </span>
            </div>

            {recentTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Aucun ticket soumis pour le moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentTickets.map((tck) => {
                  const prioStyle = getPriorityBadgeStyle(tck.priority);
                  const statusStyle = getStatusBadgeStyle(tck.status);

                  return (
                    <div
                      key={tck.id}
                      style={{
                        borderRadius: '14px',
                        padding: '1rem',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        transition: 'transform 0.2s ease, boxShadow 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                            {tck.id}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: prioStyle.bg,
                            color: prioStyle.color,
                            border: `1px solid ${prioStyle.border}`
                          }}>
                            {tck.priority}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: statusStyle.bg,
                            color: statusStyle.color
                          }}>
                            {tck.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(tck.id)}
                            title="Supprimer ce ticket"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              opacity: 0.8
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {tck.subject}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <span>Module : <strong>{tck.module_name || tck.module}</strong></span>
                        <span>{new Date(tck.created_at || tck.date || Date.now()).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FAQ RAPIDE */}
          <div className="card" style={{
            borderRadius: '18px',
            padding: '1.4rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} color="var(--primary)" /> Foire Aux Questions (FAQ)
            </h4>

            <details style={{ background: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
              <summary style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                Comment réinitialiser le PIN d'un employé ?
              </summary>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Rendez-vous dans <strong>Gestion des Accès &gt; Gestion Utilisateurs</strong>, sélectionnez l'employé et cliquez sur "Réinitialiser PIN". Le PIN par défaut `000000` sera attribué.
              </p>
            </details>

            <details style={{ background: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
              <summary style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                Comment ajouter une zone de frais de livraison GPS ?
              </summary>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Allez dans <strong>Paramètres &gt; Frais de Livraison (GPS)</strong>, saisissez les coordonnées centrales de votre laverie puis ajoutez une tranche kilométrique avec son tarif en FCFA.
              </p>
            </details>

            <details style={{ background: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
              <summary style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                Que faire en cas d'interruption de connexion Supabase ?
              </summary>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                L'application bascule automatiquement en mode hors-ligne. Les données saisies sont enregistrées localement et synchronisées dès le rétablissement du réseau.
              </p>
            </details>
          </div>

        </div>

      </div>

    </div>
  );
}
