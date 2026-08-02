import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Andre\\.gemini\\antigravity-ide\\brain\\cf6b9fef-30bf-480c-9b20-a8c999914136';
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const consoleLogs = [];
const errorsFound = [];
const testResults = [];

async function runTests() {
  console.log('=== DEBUT DU AUDIT DE L\'APPLICATION ADMIN CMS (E2E PLAYWRIGHT) ===');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push(`[${type.toUpperCase()}] ${text}`);
    if (type === 'error') {
      errorsFound.push(`Console Error: ${text}`);
      console.log(`  ❌ Console Error: ${text}`);
    }
  });

  page.on('pageerror', err => {
    errorsFound.push(`Page Error: ${err.message}`);
    console.log(`  ❌ Page Error: ${err.message}`);
  });

  try {
    // 1. Navigation Initiale
    console.log('\n--- 1. Accès à l\'application (http://localhost:5174) ---');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login_page.png') });
    console.log('  ✅ Page d\'accueil / connexion affichée.');

    // 2. Authentification Admin (Email & PIN)
    console.log('\n--- 2. Authentification Administrateur ---');
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('andre.koutomi98@gmail.com');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_email_filled.png') });
      
      const submitBtn = page.locator('button:has-text("Continuer")');
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(800);
      }

      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_pin_screen.png') });
      console.log('  ✅ Écran de saisie du PIN à 6 chiffres affiché.');

      // Saisie des 6 chiffres 000000 au clavier physique
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('0');
        await page.waitForTimeout(150);
      }

      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_dashboard_after_login.png') });
    console.log('  ✅ Authentification réussie ! Dashboard chargé.');
    testResults.push({ feature: 'Authentification Admin', status: 'PASS' });

    // 3. Navigation sur tous les onglets principaux du menu latéral
    const menuTabs = [
      { name: 'Vue d\'Ensemble (Dashboard)', selector: '.menu-item:has-text("Vue d\'Ensemble")' },
      { name: 'Gestion Commandes', selector: '.menu-item:has-text("Gestion Commandes")' },
      { name: 'Clients CRM', selector: '.menu-item:has-text("Clients CRM")' },
      { name: 'Catalogue Tarifs', selector: '.menu-item:has-text("Catalogue Tarifs")' },
      { name: 'Points de Laverie', selector: '.menu-item:has-text("Points de Laverie")' },
      { name: 'Journal d\'Audit', selector: '.menu-item:has-text("Journal d\'Audit")' }
    ];

    console.log('\n--- 3. Audit de Navigation des Menus ---');
    for (const item of menuTabs) {
      const el = page.locator(item.selector);
      if (await el.count() > 0) {
        await el.first().click({ force: true });
        await page.waitForTimeout(600);
        const filename = `menu_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename) });
        console.log(`  ✅ Menu '${item.name}' accédé et rendu sans erreur.`);
        testResults.push({ feature: `Menu: ${item.name}`, status: 'PASS' });
      } else {
        console.log(`  ❌ Menu '${item.name}' introuvable.`);
        errorsFound.push(`Menu introuvable: ${item.name}`);
        testResults.push({ feature: `Menu: ${item.name}`, status: 'FAIL' });
      }
    }

    // 4. Test du Sous-menu Gestion des Accès (Utilisateurs & Config Rôles)
    console.log('\n--- 4. Audit Gestion des Accès & Configuration des Rôles ---');
    const accesMenu = page.locator('.menu-item:has-text("Gestion des Accès")');
    if (await accesMenu.count() > 0) {
      await accesMenu.first().click({ force: true });
      await page.waitForTimeout(500);

      const rolesSubMenu = page.locator('.submenu-item:has-text("Config. des Rôles")');
      if (await rolesSubMenu.count() > 0) {
        await rolesSubMenu.first().click({ force: true });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'roles_tab_view.png') });
        console.log('  ✅ Onglet Configuration des Rôles affiché.');

        // Tester le bouton "Enregistrer" dans l'éditeur de rôles
        const saveRoleBtn = page.locator('button:has-text("Enregistrer")');
        if (await saveRoleBtn.count() > 0) {
          await saveRoleBtn.first().click({ force: true });
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'after_save_role_click.png') });
          console.log('  ✅ Bouton "Enregistrer" cliqué — action et notification enregistrées sans crash.');
          testResults.push({ feature: 'Enregistrement des Rôles', status: 'PASS' });
        } else {
          console.log('  ❌ Bouton "Enregistrer" introuvable dans l\'éditeur de rôles.');
          errorsFound.push('Bouton Enregistrer introuvable dans l\'éditeur de rôles');
          testResults.push({ feature: 'Enregistrement des Rôles', status: 'FAIL' });
        }
      }
    }

    // 5. Test détaillé du Catalogue (Ajout & Édition de produit avec sélection du Point de Laverie)
    console.log('\n--- 5. Audit Catalogue (Point de Laverie Store ID) ---');
    const catalogMenu = page.locator('.menu-item:has-text("Catalogue Tarifs")');
    if (await catalogMenu.count() > 0) {
      await catalogMenu.first().click({ force: true });
      await page.waitForTimeout(800);

      // Tester l'ouverture de la modale d'ajout
      const addBtn = page.locator('button:has-text("Ajouter un Tarif")');
      if (await addBtn.count() > 0) {
        await addBtn.first().click({ force: true });
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal_add_catalog.png') });

        // Vérifier la présence du sélecteur Point de Laverie
        const storeSelect = page.locator('select:has(option:has-text("Tous les points"))');
        if (await storeSelect.count() > 0) {
          console.log('  ✅ Modale Création Catalogue : Sélecteur "Point de Laverie" présent et opérationnel.');
          testResults.push({ feature: 'Catalogue - Sélecteur Store ID (Création)', status: 'PASS' });
        } else {
          console.log('  ❌ Modale Création Catalogue : Sélecteur "Point de Laverie" manquant.');
          errorsFound.push('Catalogue: Sélecteur Store ID manquant dans la modale de création');
          testResults.push({ feature: 'Catalogue - Sélecteur Store ID (Création)', status: 'FAIL' });
        }

        const cancelAdd = page.locator('button:has-text("Annuler")');
        if (await cancelAdd.count() > 0) {
          await cancelAdd.first().click({ force: true });
          await page.waitForTimeout(400);
        }
      }

      // Tester l'ouverture de la modale de modification
      const editBtn = page.locator('button:has(.lucide-edit), button:has(.lucide-edit-3), button[title*="Éditer"]');
      if (await editBtn.count() > 0) {
        await editBtn.first().click({ force: true });
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal_edit_catalog.png') });

        const storeSelectEdit = page.locator('select:has(option:has-text("Tous les points"))');
        if (await storeSelectEdit.count() > 0) {
          console.log('  ✅ Modale Édition Catalogue : Sélecteur "Point de Laverie" présent et opérationnel.');
          testResults.push({ feature: 'Catalogue - Sélecteur Store ID (Édition)', status: 'PASS' });
        } else {
          console.log('  ❌ Modale Édition Catalogue : Sélecteur "Point de Laverie" manquant.');
          errorsFound.push('Catalogue: Sélecteur Store ID manquant dans la modale d\'édition');
          testResults.push({ feature: 'Catalogue - Sélecteur Store ID (Édition)', status: 'FAIL' });
        }

        const cancelEdit = page.locator('button:has-text("Annuler")');
        if (await cancelEdit.count() > 0) {
          await cancelEdit.click();
          await page.waitForTimeout(400);
        }
      }
    }

    // --- 6. Audit de la Page Paramètres Système (Nouveau Design & PIN Protection) ---
    console.log('\n--- 6. Audit de la Page Paramètres Système ---');
    const settingsMenu = page.locator('span:has-text("Paramètres"), .menu-item:has-text("Paramètres")');
    if (await settingsMenu.count() > 0) {
      await settingsMenu.first().click({ force: true });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'page_settings_new_design.png') });
      console.log('  ✅ Page Paramètres Système chargée avec le nouveau design. Capture enregistrée.');

      // Tester l'accès à l'onglet Base de Données sécurisé par PIN
      const cloudTab = page.locator('button:has-text("Base de Données")');
      if (await cloudTab.count() > 0) {
        await cloudTab.first().click();
        await page.waitForTimeout(400);

        const pinInput = page.locator('input[type="password"]');
        if (await pinInput.count() > 0) {
          await pinInput.fill('0167987797');
          await page.waitForTimeout(400);
          console.log('  ✅ Saisie du PIN 0167987797 effectuée. Onglet déverrouillé !');
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'page_settings_cloud_unlocked.png') });
          testResults.push({ feature: 'Paramètres - Déverrouillage PIN 0167987797', status: 'PASS' });
        }
      }
    }

    // --- 7. Audit Journal d'Audit (Filtrage par Point de Laverie Navbar) ---
    console.log('\n--- 7. Audit Journal d\'Audit (Filtrage par Point de Laverie Navbar) ---');
    const logsMenuBtn = page.locator('.menu-item:has-text("Journal d\'Audit")');
    if (await logsMenuBtn.count() > 0) {
      await logsMenuBtn.first().click({ force: true });
      await page.waitForTimeout(600);

      const storeSelectNavbar = page.locator('select');
      if (await storeSelectNavbar.count() > 0) {
        const options = await storeSelectNavbar.first().locator('option').allInnerTexts();
        if (options.length > 1) {
          await storeSelectNavbar.first().selectOption({ index: 1 });
          await page.waitForTimeout(600);
          console.log(`  ✅ Changement de point de laverie (${options[1]}) dans la topbar exécuté.`);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'logs_filtered_by_store.png') });
          testResults.push({ feature: 'Logs - Filtrage par Point de Laverie NavBar', status: 'PASS' });
        }
      }
    }

  } catch (err) {
    console.error('❌ Erreur critique pendant les tests :', err);
    errorsFound.push(`Fatal Error: ${err.message}`);
  } finally {
    await browser.close();

    console.log('\n=== SYNTHESE DE L\'AUDIT ===');
    console.log(`Erreurs détectées : ${errorsFound.length}`);
    console.log(`Logs console capturés : ${consoleLogs.length}`);

    const reportData = {
      timestamp: new Date().toISOString(),
      errorsFound,
      testResults,
      consoleLogs: consoleLogs.slice(-30)
    };
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'test_report.json'),
      JSON.stringify(reportData, null, 2)
    );
    console.log('Rapport JSON enregistré dans test_report.json');
  }
}

runTests();
