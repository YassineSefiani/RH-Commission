import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import ConstraintsPage from "./pages/ConstraintsPage";
import CalculationPage from "./pages/CalculationPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import NewConstraintPage from "./pages/NewConstraintPage";
import PersonnelPage from "./pages/PersonnelPage";
import Layout from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/dashboard",
    element: <Layout><DashboardPage /></Layout>,
  },
  {
    path: "/constraints",
    element: <Layout><ConstraintsPage /></Layout>,
  },
  {
    path: "/constraints/new",
    element: <Layout><NewConstraintPage /></Layout>,
  },
  {
    path: "/calculation",
    element: <Layout><CalculationPage /></Layout>,
  },
  {
    path: "/history",
    element: <Layout><HistoryPage /></Layout>,
  },
  {
    path: "/personnel",
    element: <Layout><PersonnelPage /></Layout>,
  },
  {
    path: "/settings",
    element: <Layout><SettingsPage /></Layout>,
  },
]);