import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  ImageIcon,
  Package,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const rol = admin?.rol || 'editor';

  // ── Navegación dinámica según rol ─────────────────────────
  // superadmin: acceso total
  // admin:      todo excepto Usuarios
  // editor:     solo Dashboard, Cotizaciones y Configuración
  const todosLosItems = [
    { to: '/admin/dashboard',      icon: <LayoutDashboard size={20} />, label: 'Dashboard',       roles: ['superadmin', 'admin', 'editor'] },
    { to: '/admin/cotizaciones',   icon: <FileText size={20} />,        label: 'Cotizaciones',    roles: ['superadmin', 'admin', 'editor'] },
    { to: '/admin/disponibilidad', icon: <Calendar size={20} />,        label: 'Disponibilidad',  roles: ['superadmin', 'admin'] },
    { to: '/admin/servicios',      icon: <Package size={20} />,         label: 'Servicios',       roles: ['superadmin', 'admin'] },
    { to: '/admin/imagenes',       icon: <ImageIcon size={20} />,       label: 'Imágenes',        roles: ['superadmin', 'admin'] },
    { to: '/admin/settings',       icon: <Settings size={20} />,        label: 'Configuración',   roles: ['superadmin', 'admin', 'editor'] },
    { to: '/admin/usuarios',       icon: <Users size={20} />,           label: 'Usuarios',        roles: ['superadmin'] },
  ];

  // Filtrar solo los items que el rol actual puede ver
  const navItems = todosLosItems.filter(item => item.roles.includes(rol));

  // Etiqueta amigable del rol
  const rolLabel = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    editor: 'Editor'
  };

  return (
    <div className="admin-container">
      {sidebarOpen && <div className="admin-overlay" onClick={closeSidebar}></div>}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <span className="admin-brand">Dream Day</span>
          <span className="admin-brand-sub">Panel Admin</span>
          <button className="admin-sidebar-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight size={16} className="admin-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {admin?.nombre?.[0] || 'A'}
            </div>
            <div className="admin-user-details">
              <span className="admin-user-name">{admin?.nombre || 'Admin'}</span>
              <span className="admin-user-role">{rolLabel[rol] || rol}</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="admin-topbar-brand">Dream Day</span>
          <div className="admin-topbar-spacer"></div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
