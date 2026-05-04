import { createBrowserRouter, redirect } from "react-router";
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import ConstraintsPage from "./pages/ConstraintsPage";
import CalculationPage from "./pages/CalculationPage";
import BrandCalculationPage from "./pages/BrandCalculationPage";
import HistoryPage from "./pages/HistoryPage";
import PresencePage from "./pages/PresencePage";
import SettingsPage from "./pages/SettingsPage";
import NewConstraintPage from "./pages/NewConstraintPage";
import PersonnelPage from "./pages/PersonnelPage";
import Layout from "./components/Layout";

/**
 * Loader pour vérifier l'authentification et les permissions par rôle
 * Ajout du type string[] pour corriger l'erreur TS
 */
const requireAuth = (allowedRoles: string[] = []) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const authToken = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole'); 

  // 1. Vérification de l'authentification de base
  if (!isAuthenticated || !authToken) {
    return redirect('/');
  }

  // 2. Vérification des permissions
  // On vérifie que userRole n'est pas null avant d'utiliser .includes()
  if (allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      return redirect('/dashboard');
    }
  }

  return null;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/dashboard",
    element: <Layout><DashboardPage /></Layout>,
    loader: () => requireAuth(),
  },
  {
    path: "/constraints",
    element: <Layout><ConstraintsPage /></Layout>,
    loader: () => requireAuth(['ADMIN', 'ADV']),
  },
  {
    path: "/constraints/new",
    element: <Layout><NewConstraintPage /></Layout>,
    loader: () => requireAuth(['ADMIN', 'ADV']),
  },
  {
    path: "/calculation",
    element: <Layout><CalculationPage /></Layout>,
    loader: () => requireAuth(['ADMIN', 'ADV']),
  },
  {
    path: "/calculation/brand/:brand",
    element: <Layout><BrandCalculationPage /></Layout>,
    loader: () => requireAuth(['ADMIN', 'ADV']),
  },
  {
    path: "/history",
    element: <Layout><HistoryPage /></Layout>,
    loader: () => requireAuth(),
  },
  {
    path: "/presence",
    element: <Layout><PresencePage /></Layout>,
    loader: () => requireAuth(),
  },
  {
    path: "/personnel",
    element: <Layout><PersonnelPage /></Layout>,
    loader: () => requireAuth(),
  },
  {
    path: "/settings",
    element: <Layout><SettingsPage /></Layout>,
    loader: () => requireAuth(),
  },
]);