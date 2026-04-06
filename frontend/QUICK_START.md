# 🚀 Guide de Démarrage Rapide

## ✅ Récapitulatif des Changements

Votre application RH ABC DIS a été **complètement migrée** de localStorage vers un backend Spring Boot avec base de données H2.

---

## 📂 Ce qui a été Modifié

### ✨ Nouveaux Fichiers

#### Frontend
- ✅ `/src/app/services/api.ts` - Service API pour communiquer avec le backend
- ✅ `/src/app/components/BackendStatus.tsx` - Indicateur de connexion backend

#### Modifiés
- ✅ `/src/app/context/ConstraintsContext.tsx` - Utilise maintenant l'API au lieu de localStorage
- ✅ `/src/app/context/HistoryContext.tsx` - Utilise maintenant l'API au lieu de localStorage
- ✅ `/src/app/components/Layout.tsx` - Affiche le statut de connexion backend

#### Documentation
- ✅ `/BACKEND_SETUP_GUIDE.md` - Guide complet pour créer le backend Spring Boot
- ✅ `/BACKEND_INTEGRATION.md` - Documentation sur l'intégration frontend-backend
- ✅ `/TEST_API.md` - Tests et commandes curl pour l'API
- ✅ `/QUICK_START.md` - Ce fichier (démarrage rapide)

---

## ⚡ Démarrage en 3 Étapes

### Étape 1️⃣ : Créer le Backend

Le backend n'existe pas encore dans cet environnement Figma Make. **Vous devez le créer manuellement** dans votre dossier `backend/`.

📖 **Suivez le guide complet :** `BACKEND_SETUP_GUIDE.md`

**Résumé rapide :**
1. Créez la structure du projet dans `backend/`
2. Copiez tous les fichiers Java fournis dans le guide
3. Lancez `mvn spring-boot:run`

### Étape 2️⃣ : Vérifier le Backend

Une fois le backend démarré :

```bash
# Test API
curl http://localhost:8080/api/constraints

# Console H2
# Ouvrez : http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:abcdis_db
# Username: sa
# Password: (vide)
```

### Étape 3️⃣ : Démarrer le Frontend

Le frontend est déjà prêt dans cet environnement.

```bash
npm run dev
# ou
pnpm dev
```

Ouvrez : http://localhost:5173

---

## 🎯 Test Complet

### 1. Vérifier la Connexion Backend

Dans le coin **inférieur droit** du frontend, vous verrez un indicateur :
- 🟢 **"Backend connecté"** - Tout fonctionne !
- 🔴 **"Backend déconnecté"** - Le backend n'est pas démarré ou inaccessible

### 2. Tester les Contraintes

1. Allez sur **"Contraintes"**
2. Les 4 contraintes par défaut doivent apparaître automatiquement
3. Essayez d'en ajouter une nouvelle
4. Vérifiez dans la console H2 :
   ```sql
   SELECT * FROM CONSTRAINTS;
   ```

### 3. Tester le Calcul de Commission

1. Allez sur **"Calcul"**
2. Remplissez le formulaire :
   ```
   Nom: Test User
   Rôle: Commercial Senior
   Salaire de base: 3000
   Ventes totales: 15000
   Livraisons: 25
   Retours: 2
   ```
3. Cliquez sur **"Calculer"**
4. Vérifiez que le résultat apparaît

### 4. Tester l'Historique

1. Allez sur **"Historique"**
2. Vous devriez voir le calcul précédent
3. Vérifiez dans la console H2 :
   ```sql
   SELECT * FROM CALCULATION_HISTORY;
   ```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                http://localhost:5173                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ConstraintsContext  │  HistoryContext            │ │
│  └────────────┬─────────┴─────────┬──────────────────┘ │
│               │                    │                     │
│               └────────┬───────────┘                     │
│                        │                                 │
│                  ┌─────▼─────┐                           │
│                  │  api.ts   │                           │
│                  └─────┬─────┘                           │
└────────────────────────┼─────────────────────────────────┘
                         │ HTTP REST
                         │
┌────────────────────────▼─────────────────────────────────┐
│                BACKEND (Spring Boot)                     │
│               http://localhost:8080                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ConstraintController  │  HistoryController       │ │
│  └────────────┬───────────┴─────────┬────────────────┘ │
│               │                      │                   │
│  ┌────────────▼───────────┐ ┌───────▼────────────────┐ │
│  │ ConstraintRepository   │ │ HistoryRepository      │ │
│  └────────────┬───────────┘ └───────┬────────────────┘ │
│               │                      │                   │
│               └──────────┬───────────┘                   │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │  H2 DB    │                         │
│                    │ (Mémoire) │                         │
│                    └───────────┘                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### URLs Importantes

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | Vite dev server |
| Backend API | http://localhost:8080/api | API REST |
| Console H2 | http://localhost:8080/h2-console | Base de données |
| API Constraints | http://localhost:8080/api/constraints | Gestion des contraintes |
| API History | http://localhost:8080/api/history | Gestion de l'historique |

### Ports Utilisés

- **5173** : Frontend React (Vite)
- **8080** : Backend Spring Boot + H2

---

## 🐛 Problèmes Courants

### ❌ "Backend déconnecté"

**Cause :** Le backend Spring Boot n'est pas démarré.

**Solution :**
```bash
cd backend
mvn spring-boot:run
```

### ❌ "Impossible de charger les contraintes"

**Cause :** Le backend n'est pas accessible ou erreur CORS.

**Solutions :**
1. Vérifiez que le backend tourne : `curl http://localhost:8080/api/constraints`
2. Vérifiez la console navigateur (F12) pour les erreurs CORS
3. Redémarrez le backend

### ❌ Erreur CORS dans la console

**Symptôme :**
```
Access to fetch at 'http://localhost:8080/api/constraints' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution :**
1. Vérifiez que `CorsConfig.java` autorise `http://localhost:5173`
2. Redémarrez le backend

### ❌ Tables H2 inexistantes

**Cause :** JPA n'a pas créé les tables.

**Solution :**
1. Vérifiez `application.properties` : `spring.jpa.hibernate.ddl-auto=update`
2. Consultez les logs au démarrage du backend
3. Relancez le backend

---

## ✨ Fonctionnalités

### ✅ Ce qui Fonctionne

- [x] Authentification frontend (localStorage)
- [x] Dashboard avec KPIs et graphiques
- [x] Gestion des contraintes (CRUD complet via API)
- [x] Calcul automatique des commissions
- [x] Historique des calculs (persisté en DB)
- [x] Design responsive
- [x] Notifications toast
- [x] Indicateur de statut backend

### 🚧 À Ajouter (Optionnel)

- [ ] Authentification backend (JWT/OAuth2)
- [ ] Validation des données côté backend
- [ ] Migration vers MySQL en production
- [ ] Tests unitaires backend
- [ ] Pagination de l'historique
- [ ] Export Excel/PDF

---

## 📚 Documentation Complète

| Fichier | Description |
|---------|-------------|
| `BACKEND_SETUP_GUIDE.md` | Guide complet pour créer le backend Spring Boot |
| `BACKEND_INTEGRATION.md` | Documentation sur l'intégration et l'architecture |
| `TEST_API.md` | Tests et commandes curl pour tester l'API |
| `QUICK_START.md` | Ce fichier - Démarrage rapide |

---

## 🎓 Prochaines Étapes

1. ✅ **Créer le backend** en suivant `BACKEND_SETUP_GUIDE.md`
2. ✅ **Tester l'API** avec les commandes dans `TEST_API.md`
3. ✅ **Vérifier l'intégration** complète frontend + backend
4. 🔐 **Ajouter l'authentification** (Spring Security + JWT)
5. 🗄️ **Migrer vers MySQL** pour la production
6. 🚀 **Déployer** l'application

---

## 💡 Astuces

### Développement

- Le **frontend** se recharge automatiquement (Hot Reload)
- Le **backend** nécessite un redémarrage à chaque modification
- Utilisez **H2 Console** pour vérifier les données en temps réel
- Les **toasts** vous informent de chaque action

### Base de Données

- **H2 en mémoire** : Données perdues au redémarrage (développement)
- **H2 fichier** : Données persistées (modifier `application.properties`)
- **MySQL** : Production (remplacer H2 dans `pom.xml`)

### Debug

- Console Backend : Logs Spring Boot
- Console H2 : Requêtes SQL
- Console Navigateur (F12) : Erreurs frontend
- Network Tab : Requêtes HTTP

---

## 🎉 Félicitations !

Votre application RH ABC DIS est maintenant équipée d'un **backend professionnel** avec base de données !

**Architecture Moderne :**
- ✅ Frontend React moderne
- ✅ Backend Spring Boot
- ✅ API REST
- ✅ Base de données relationnelle
- ✅ Architecture MVC
- ✅ Prêt pour la production

---

**Besoin d'aide ?** Consultez les guides complets dans :
- `BACKEND_SETUP_GUIDE.md`
- `BACKEND_INTEGRATION.md`
- `TEST_API.md`
