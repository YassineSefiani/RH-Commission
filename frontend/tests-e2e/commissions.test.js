import { Builder, By, until } from 'selenium-webdriver';
import os from 'os';
import path from 'path';

async function runRealCommissionTest() {
    let driver = await new Builder().forBrowser('firefox').build();
    
    const marques = ['Coca Cola', "Wall's", 'Ferrero Rocher'];

    try {
        console.log("🚀 Démarrage du test d'intégration global...");

        // --- ÉTAPE 1 : CONNEXION ---
        await driver.get('http://localhost:5173');
        
        let emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
        let passwordInput = await driver.findElement(By.id('password'));
        let loginButton = await driver.findElement(By.id('btn-login'));

        console.log("Identification (ADMIN)...");
        await emailInput.sendKeys('yassine.admin@abcdis.com');
        await passwordInput.sendKeys('Admin1234!');
        await loginButton.click();

        await driver.wait(until.urlContains('/dashboard'), 5000);
        console.log("✅ Connecté.");

        // --- ÉTAPE 2 : NAVIGATION VERS /calculation ---
        console.log("Ouverture du menu Calcul...");
        let navCalc = await driver.wait(until.elementLocated(By.css('a[href="/calculation"]')), 5000);
        await navCalc.click();
        
        await driver.wait(until.urlContains('/calculation'), 5000);

        // --- ÉTAPE 2.5 : IMPORT DES FICHIERS EXCEL ---
        console.log("📂 Préparation de l'import Excel...");
        
        // Résolution automatique du chemin vers ton Bureau Windows
        const bureauDir = path.join(os.homedir(), 'Desktop');
        
        // Création des chemins absolus avec les noms exacts de tes fichiers
        const excelFiles = [
            path.join(bureauDir, 'Objectifs.xlsx'),
            path.join(bureauDir, 'Realisations.xlsx'),
            path.join(bureauDir, 'Triage.xlsx'),
            path.join(bureauDir, 'Volume.xlsx')
        ];

        // Pour un champ <input multiple>, Selenium requiert que les chemins soient séparés par un saut de ligne
        const uploadPaths = excelFiles.join('\n');

        // On cible ton <input type="file" className="hidden"> et on y injecte les fichiers
        let fileInput = await driver.findElement(By.css('input[type="file"]'));
        await fileInput.sendKeys(uploadPaths);

        console.log("⏳ Importation et traitement en cours...");
        
        // On attend 3 secondes pour laisser le temps à ta fonction handleFileSelected de lire les buffers
        await driver.sleep(3000);
        console.log("✅ Fichiers injectés dans l'application !");

        // --- ÉTAPE 3 : TEST DES MARQUES ---
        for (const marque of marques) {
            console.log(`\n🔍 Analyse de la marque : ${marque}...`);

            const xpathSelector = marque.includes("'") 
                ? `//h3[text()="${marque}"]`
                : `//h3[text()='${marque}']`;

            let carteMarque = await driver.wait(until.elementLocated(By.xpath(xpathSelector)), 5000);
            await carteMarque.click();

            await driver.wait(until.urlContains('/brand/'), 5000);
            await driver.sleep(1000);

            console.log(`   Déclenchement des règles pour ${marque}...`);
            let btnCalculer = await driver.wait(until.elementLocated(By.xpath('//button[contains(@class, "bg-orange-500")]')), 5000);
            await btnCalculer.click();

            await driver.sleep(1500);
            console.log(`   ✅ Calcul appliqué avec succès.`);

            let btnRetour = await driver.findElement(By.xpath('//button[contains(@class, "border-gray-200") and contains(@class, "bg-white") and contains(@class, "inline-flex")]'));
            await btnRetour.click();

            await driver.wait(until.urlMatches(/\/calculation$/), 5000);
        }

        console.log("\n🎯 Scénario terminé ! Test d'intégration complet validé.");

    } catch (error) {
        console.error("\n❌ Échec du test :", error.message);
    } finally {
        await driver.quit();
    }
}

runRealCommissionTest();