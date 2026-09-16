import React from 'react';
import { appEnv } from '../services/supabaseClient';

export default function EnvironmentBanner() {
  if (!appEnv || appEnv === 'production' || appEnv === 'prod') {
    return null;
  }

  const isTest = appEnv === 'test';
  const isStaging = appEnv === 'staging' || appEnv === 'beta';

  const config = isTest
    ? {
        bg: '#fef08a',
        border: '#eab308',
        text: '#854d0e',
        badgeBg: '#ca8a04',
        badgeText: '#ffffff',
        title: 'ENVIRONNEMENT DE TEST (QA)',
        message: 'Base de données Supabase Test active. Les données sont fictives et peuvent être réinitialisées.',
      }
    : {
        bg: '#ffedd5',
        border: '#f97316',
        text: '#9a3412',
        badgeBg: '#ea580c',
        badgeText: '#ffffff',
        title: 'ENVIRONNEMENT DE STAGING (BÊTA)',
        message: 'Base de données Supabase Staging. Validation métier avant mise en production finale.',
      };

  return (
    <div
      style={{
        backgroundColor: config.bg,
        borderBottom: `2px solid ${config.border}`,
        color: config.text,
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '12px',
        fontWeight: '600',
        zIndex: 99999,
        position: 'sticky',
        top: 0,
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <span
        style={{
          backgroundColor: config.badgeBg,
          color: config.badgeText,
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        {config.title}
      </span>
      <span>{config.message}</span>
    </div>
  );
}

