import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CotizarPage from './pages/CotizarPage';
import DisponibilidadPage from './pages/DisponibilidadPage';
import ConsultarPage from './pages/ConsultarPage';
import LoginPage from './pages/admin/LoginPage';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import DashboardPage from './pages/admin/DashboardPage';
import CotizacionesPage from './pages/admin/CotizacionesPage';
import CotizacionDetallePage from './pages/admin/CotizacionDetallePage';
import DisponibilidadAdminPage from './pages/admin/DisponibilidadAdminPage';
import ImagenesPage from './pages/admin/ImagenesPage';
import SettingsPage from './pages/admin/SettingsPage';
import ResetPasswordPage from './pages/admin/ResetPasswordPage';
import AdminUserPage from './pages/admin/AdminUserPage';
import SSODemoPage from './pages/SSODemoPage';
import ServiciosPage from './pages/admin/ServiciosPage';
import CategoriasPage from './pages/admin/CategoriasPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/cotizar" element={<CotizarPage />} />
          <Route path="/disponibilidad" element={<DisponibilidadPage />} />
          <Route path="/mi-cotizacion" element={<ConsultarPage />} />
          <Route path="/sso-demo" element={<SSODemoPage />} />
        </Route>
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cotizaciones" element={<CotizacionesPage />} />
          <Route path="cotizaciones/:id" element={<CotizacionDetallePage />} />
          <Route path="disponibilidad" element={<DisponibilidadAdminPage />} />
          <Route path="imagenes" element={<ImagenesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="usuarios" element={<AdminUserPage />} />
          <Route path="servicios" element={<ServiciosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
