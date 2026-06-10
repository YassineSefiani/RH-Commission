import { Builder, By, until } from 'selenium-webdriver';

async function testConnexionAdmin() {
    // 1. Initialisation du navigateur Firefox
    let driver = await new Builder().forBrowser('firefox').build();

    try {
        console.log("Lancement du test de connexion pour l'utilisateur Yassine (ADMIN)...");
        
        // 2. Navigation vers la page de login
        await driver.get('http://localhost:5173');

        // 3. Récupération des éléments du formulaire
        let emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
        let passwordInput = await driver.findElement(By.id('password'));
        let loginButton = await driver.findElement(By.id('btn-login'));

        console.log("Saisie des identifiants...");
        
        // 4. Injection des identifiants
        await emailInput.sendKeys('yassine.admin@abcdis.com');
        await passwordInput.sendKeys('Admin1234!');
        
        // 5. Validation du formulaire
        await loginButton.click();

        // 6. Vérification de la redirection
        console.log("Vérification de la redirection...");
        await driver.wait(until.urlContains('/dashboard'), 5000);
        
        console.log("✅ Test réussi : L'utilisateur ADMIN est bien connecté et redirigé !");

    } catch (error) {
        console.error("❌ Échec du test :", error.message);
    } finally {
        // 7. Nettoyage
        await driver.quit();
    }
}

testConnexionAdmin();