# 🔗 Intégration Backend Spring Boot + H2

## ✅ Migration Complétée

Le frontend React a été **complètement migré** pour utiliser votre backend Spring Boot au lieu de localStorage.

---

## 📁 Structure du Projet

```
votre-projet/
├── frontend/              ← Code Figma Make (React)
│   └── src/
│       ├── app/
│       │   ├── services/
│       │   │   └── api.ts          ← Service API (NOUVEAU)
│       │   ├── context/
│       │   │   ├── ConstraintsContext.tsx  ← Modifié pour utiliser l'API
│       │   │   └── HistoryContext.tsx      ← Modifié pour utiliser l'API
│       │   └── ...
│       └── ...
│
└── backend/               ← Backend Spring Boot (À CRÉER)
    ├── src/main/java/com/abcdis/hrapp/
    │   ├── HrAppApplication.java
    │   ├── controller/
    │   ├── model/
    │   ├── repository/
    │   └── config/
    ├── src/main/resources/
    │   └── application.properties
    └── pom.xml
```

---

## 🚀 Instructions de Démarrage

### 1️⃣ Démarrer le Backend (Spring Boot)

```bash
# Dans le dossier backend/
cd backend
mvn spring-boot:run
```

**Vérifications :**
- ✅ Backend : http://localhost:8080
- ✅ Console H2 : http://localhost:8080/h2-console
- ✅ API Constraints : http://localhost:8080/api/constraints
- ✅ API History : http://localhost:8080/api/history

**Configuration Console H2 :**
```
JDBC URL:  jdbc:h2:mem:abcdis_db
Username:  sa
Password:  (vide)
```

### 2️⃣ Démarrer le Frontend (React)

```bash
# Dans le dossier frontend/
cd frontend
npm run dev
# ou
pnpm dev
```

Le frontend sera accessible sur : http://localhost:5173

---

## 🔄 Fonctionnalités Migrées

### ✅ Contraintes (`ConstraintsContext`)

| Action | Méthode | Endpoint |
|--------|---------|----------|
| Charger toutes les contraintes | `GET` | `/api/constraints` |
| Ajouter une contrainte | `POST` | `/api/constraints` |
| Modifier une contrainte | `PUT` | `/api/constraints/{id}` |
| Supprimer une contrainte | `DELETE` | `/api/constraints/{id}` |
| Activer/Désactiver | `PATCH` | `/api/constraints/{id}/toggle` |

**Fonctionnalités :**
- ✅ Chargement automatique au démarrage
- ✅ Initialisation des contraintes par défaut si la DB est vide
- ✅ Notifications toast pour chaque action
- ✅ Gestion des erreurs avec fallback

### ✅ Historique (`HistoryContext`)

| Action | Méthode | Endpoint |
|--------|---------|----------|
| Charger l'historique | `GET` | `/api/history` |
| Ajouter un calcul | `POST` | `/api/history` |
| Supprimer un calcul | `DELETE` | `/api/history/{id}` |
| Vider l'historique | `DELETE` | `/api/history` |

**Fonctionnalités :**
- ✅ Chargement automatique au démarrage
- ✅ Tri par date décroissante (plus récent en premier)
- ✅ Notifications toast pour chaque action
- ✅ Confirmation avant suppression totale
- ✅ Gestion des erreurs

---

## 🔧 Configuration

### URL de l'API

L'URL du backend est définie dans `/src/app/services/api.ts` :

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

Si votre backend tourne sur un autre port, modifiez cette ligne.

### CORS

Le backend est configuré pour accepter les requêtes depuis `http://localhost:5173`.

Si votre frontend tourne sur un autre port, modifiez :
- `backend/src/main/resources/application.properties`
- `backend/src/main/java/com/abcdis/hrapp/config/CorsConfig.java`

---

## 🐛 Dépannage

### ❌ Erreur : "Impossible de charger les contraintes"

**Cause :** Le backend n'est pas démarré ou inaccessible.

**Solution :**
1. Vérifiez que le backend tourne sur http://localhost:8080
2. Testez manuellement : `curl http://localhost:8080/api/constraints`
3. Vérifiez les logs du backend

### ❌ Erreur CORS

**Symptôme :** Erreur dans la console navigateur : `CORS policy blocked...`

**Solution :**
- Assurez-vous que `CorsConfig.java` autorise `http://localhost:5173`
- Redémarrez le backend après modification

### ❌ Base de données H2 vide

**Symptôme :** Aucune table dans la console H2

**Cause :** JPA n'a pas créé les tables

**Solution :**
1. Vérifiez `application.properties` : `spring.jpa.hibernate.ddl-auto=update`
2. Consultez les logs du backend au démarrage
3. Relancez le backend

### ❌ Les contraintes par défaut ne s'affichent pas

**Solution :**
- Au premier lancement, le frontend créera automatiquement 4 contraintes par défaut
- Rechargez la page si nécessaire

---

## 📊 Test de l'Intégration

### 1. Tester les Contraintes

1. Ouvrez le frontend : http://localhost:5173
2. Connectez-vous (login simple sans backend)
3. Allez sur "Contraintes"
4. Vérifiez que les 4 contraintes par défaut sont affichées
5. Ajoutez une nouvelle contrainte
6. Vérifiez dans la console H2 :
   ```sql
   SELECT * FROM CONSTRAINTS;
   ```

### 2. Tester l'Historique

1. Allez sur "Calcul Commission"
2. Remplissez le formulaire et calculez
3. Vérifiez que le calcul apparaît dans "Historique"
4. Vérifiez dans la console H2 :
   ```sql
   SELECT * FROM CALCULATION_HISTORY;
   ```

---

## 🎯 Avantages de cette Architecture

| Avant (localStorage) | Après (Backend + DB) |
|---------------------|----------------------|
| ❌ Données perdues au changement de navigateur | ✅ Données persistantes |
| ❌ Pas de partage entre utilisateurs | ✅ Base de données centralisée |
| ❌ Limite de 5-10 MB | ✅ Illimité |
| ❌ Pas d'API pour d'autres apps | ✅ API REST réutilisable |

---

## 🔐 Sécurité (À ajouter plus tard)

Pour l'instant, l'application n'a **pas d'authentification backend**.

Pour ajouter l'authentification :
1. Installer Spring Security
2. Implémenter JWT ou OAuth2
3. Protéger les endpoints avec `@PreAuthorize`
4. Modifier le service API frontend pour envoyer les tokens

---

## 📝 Notes Importantes

- **Base H2 en mémoire** : Les données sont **perdues** au redémarrage du backend
- Pour persister les données, modifiez `application.properties` :
  ```properties
  spring.datasource.url=jdbc:h2:file:./data/abcdis_db
  ```

- **Migration vers MySQL** (plus tard) :
  1. Remplacer H2 par MySQL dans `pom.xml`
  2. Modifier `application.properties`
  3. Aucun changement frontend nécessaire !

---

## ✅ Checklist de Vérification

- [ ] Backend Spring Boot démarré sur port 8080
- [ ] Console H2 accessible et tables créées
- [ ] Frontend React démarré sur port 5173
- [ ] Les contraintes par défaut apparaissent
- [ ] Ajout/modification/suppression de contraintes fonctionne
- [ ] Les calculs sont sauvegardés dans l'historique
- [ ] Toasts de notification apparaissent
- [ ] Données visibles dans la console H2

---

**🎉 Félicitations ! Votre application RH est maintenant connectée à un backend Spring Boot avec base de données H2 !**
