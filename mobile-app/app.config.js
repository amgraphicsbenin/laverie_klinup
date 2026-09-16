/**
 * Expo Dynamic App Configuration for KLIN UP
 * 
 * Ce fichier étend app.json pour supporter dynamiquement les 3 environnements :
 * - test       -> App Name: "KLIN UP (Test)",  Package: com.klinup.laverie.test
 * - staging    -> App Name: "KLIN UP (Bêta)",  Package: com.klinup.laverie.beta
 * - production -> App Name: "KLIN UP",         Package: com.klinup.laverie
 * 
 * Permet d'installer les applications de Test, Bêta et Production côte-à-côte
 * sur le même appareil Android sans conflit de signature ni d'identifiant.
 */

module.exports = ({ config }) => {
  const env = (process.env.APP_ENV || process.env.EXPO_PUBLIC_APP_ENV || 'production').toLowerCase();

  const envProfiles = {
    test: {
      name: 'KLIN UP (Test)',
      androidPackage: 'com.klinup.laverie.test',
      iosBundleId: 'com.klinup.laverie.test',
      badgeColor: '#eab308', // Jaune Test
    },
    staging: {
      name: 'KLIN UP (Bêta)',
      androidPackage: 'com.klinup.laverie.beta',
      iosBundleId: 'com.klinup.laverie.beta',
      badgeColor: '#f97316', // Orange Bêta
    },
    production: {
      name: 'KLIN UP',
      androidPackage: 'com.klinup.laverie',
      iosBundleId: 'com.klinup.laverie',
      badgeColor: '#002cf7', // Bleu KLIN UP officiel
    },
  };

  const currentProfile = envProfiles[env] || envProfiles.production;

  return {
    ...config,
    name: currentProfile.name,
    ios: {
      ...(config.ios || {}),
      bundleIdentifier: currentProfile.iosBundleId,
    },
    android: {
      ...(config.android || {}),
      package: currentProfile.androidPackage,
    },
    extra: {
      ...(config.extra || {}),
      appEnv: env,
      profileName: currentProfile.name,
      badgeColor: currentProfile.badgeColor,
    },
  };
};

