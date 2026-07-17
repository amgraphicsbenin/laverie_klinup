export const getThemeColors = (isDarkMode) => {
  return {
    bg: isDarkMode ? '#0f172a' : '#ffffff',
    bgAlt: isDarkMode ? '#0f172a' : '#ffffff',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : 'rgba(0, 0, 0, 0.05)',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMain: isDarkMode ? '#ffffff' : '#09090b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    textLight: isDarkMode ? '#cbd5e1' : '#a1a1aa',
    primary: '#002cf7',
    divider: isDarkMode ? '#334155' : '#f1f5f9',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    statusBar: isDarkMode ? 'light' : 'dark',
  };
};
