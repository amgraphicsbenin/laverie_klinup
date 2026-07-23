export const getThemeColors = (isDarkMode) => {
  return {
    bg: isDarkMode ? '#000000' : '#ffffff',
    bgAlt: isDarkMode ? '#09090b' : '#ffffff',
    card: isDarkMode ? '#121212' : '#ffffff',
    border: isDarkMode ? '#27272a' : '#e2e8f0',
    borderLight: isDarkMode ? '#27272a' : 'rgba(0, 0, 0, 0.05)',
    text: isDarkMode ? '#ffffff' : '#09090b',
    textMain: isDarkMode ? '#ffffff' : '#09090b',
    textMuted: isDarkMode ? '#a1a1aa' : '#64748b',
    textLight: isDarkMode ? '#d4d4d8' : '#a1a1aa',
    primary: '#002cf7',
    divider: isDarkMode ? '#27272a' : '#f1f5f9',
    inputBg: isDarkMode ? '#09090b' : '#ffffff',
    statusBar: isDarkMode ? 'light' : 'dark',
  };
};
