import React from 'react';
import { Search, Filter, AlertCircle } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

export default function LogsTab({
  logSearchText,
  setLogSearchText,
  logFilterAction,
  setLogFilterAction,
  filteredLogs,
  staff
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h3 className="chart-title" style={{ margin: 0 }}>Traces d'Audit & Sécurité Opérationnelle</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-control"
            style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '12px' }}
            placeholder="Filtrer localement par description, employé..."
            value={logSearchText}
            onChange={(e) => setLogSearchText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <CustomSelect
            className="input-control"
            style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            value={logFilterAction}
            onChange={(e) => setLogFilterAction(e.target.value)}
          >
            <option value="all">Toutes les actions</option>
            <option value="CONNEXION">Connexion</option>
            <option value="CREATION_COMMANDE">Création Commande</option>
            <option value="MISE_A_JOUR_STATUT">Changements Statuts</option>
            <option value="ANNULATION_COMMANDE">Annulations</option>
            <option value="RÈGLEMENT_DETTE">Règlements Dette</option>
            <option value="MODIFICATION_TARIF">Changements Tarifs</option>
          </CustomSelect>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Horodatage</th>
              <th>Employé</th>
              <th>Action</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                  Aucune ligne de log correspondante.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const user = staff.find(s => s.id === log.user_id);
                const userName = user ? `${user.prenom} ${user.nom}` : 'Système';
                const userRole = user ? user.role : 'Automate';

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div><strong>{userName}</strong></div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userRole}</div>
                    </td>
                    <td>
                      <span className="badge text-uppercase" style={{
                        background: log.action.includes('ANNULATION') || log.action.includes('SUPPR') ? 'var(--status-late-light)' : 'var(--primary-light)',
                        color: log.action.includes('ANNULATION') || log.action.includes('SUPPR') ? 'var(--status-late)' : 'var(--primary)',
                        fontSize: '0.68rem',
                        fontWeight: 700
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {log.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
