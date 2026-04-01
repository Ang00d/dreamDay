import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

function Layout({ onCartClick }) {
  return (
    <div className="layout">
      <Header onCartClick={onCartClick} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
