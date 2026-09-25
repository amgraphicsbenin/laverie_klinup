const fs = require('fs');
const path = require('path');

/**
 * Script de normalisation des icônes Android pour Firebase App Distribution & Google Play.
 * 
 * Problème résolu :
 * Expo prebuild génère des fichiers d'icônes nommés avec l'extension `.webp`
 * (ex: ic_launcher.webp, ic_launcher_round.webp) dans les répertoires mipmap-*.
 * De plus, lorsque sharp n'est pas présent, @expo/image-utils écrit des octets PNG
 * dans des fichiers .webp, ce qui bloque le parser d'APK de Firebase App Distribution.
 * Résultat : Firebase App Distribution ne peut pas extraire l'icône de l'APK
 * et affiche un avatar générique tronqué (ex: "ssing", "g Pr").
 *
 * Solution :
 * 1. Renommer / convertir toutes les icônes .webp en vrais .png dans chaque dossier mipmap-*.
 * 2. Supprimer les fichiers .webp redondants pour éviter les conflits AAPT2.
 * 3. Fournir une copie de secours ic_launcher.png et ic_launcher_round.png dans drawable/.
 */

const resDir = path.resolve(__dirname, '../android/app/src/main/res');

if (!fs.existsSync(resDir)) {
  console.log('ℹ️ Répertoire android/app/src/main/res non trouvé. Rien à faire.');
  process.exit(0);
}

console.log('====================================================');
console.log('🎨 Normalisation des icônes Android PNG pour Firebase');
console.log('====================================================');

let totalConverted = 0;

const subDirs = fs.readdirSync(resDir);
for (const dir of subDirs) {
  if (dir.startsWith('mipmap-') && dir !== 'mipmap-anydpi-v26') {
    const fullDir = path.join(resDir, dir);
    const files = fs.readdirSync(fullDir);
    for (const file of files) {
      if (file.endsWith('.webp')) {
        const webpPath = path.join(fullDir, file);
        const pngPath = path.join(fullDir, file.replace(/\.webp$/, '.png'));
        const buf = fs.readFileSync(webpPath);
        
        fs.writeFileSync(pngPath, buf);
        fs.unlinkSync(webpPath);
        totalConverted++;
        console.log(`  ✓ ${dir}/${file} -> ${path.basename(pngPath)}`);
      }
    }
  }
}

// Copie de secours dans res/drawable pour les parsers d'APK anciens
const xxxhdpiLauncher = path.join(resDir, 'mipmap-xxxhdpi', 'ic_launcher.png');
const xxxhdpiRound = path.join(resDir, 'mipmap-xxxhdpi', 'ic_launcher_round.png');
const drawableDir = path.join(resDir, 'drawable');

if (fs.existsSync(drawableDir)) {
  if (fs.existsSync(xxxhdpiLauncher)) {
    fs.copyFileSync(xxxhdpiLauncher, path.join(drawableDir, 'ic_launcher.png'));
    console.log('  ✓ drawable/ic_launcher.png créé');
  }
  if (fs.existsSync(xxxhdpiRound)) {
    fs.copyFileSync(xxxhdpiRound, path.join(drawableDir, 'ic_launcher_round.png'));
    console.log('  ✓ drawable/ic_launcher_round.png créé');
  }
}

console.log('----------------------------------------------------');
console.log(`✅ Succès : ${totalConverted} icône(s) convertie(s) en PNG standard.`);
console.log('====================================================');
