import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" onClick={closeMobile}>
        <ShieldCheck size={24} />
        DisasterLens AI
      </Link>

      {/* Desktop links */}
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/map">Disaster Map</Link>
        <Link to="/reports">Reports</Link>
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <Link to="/report">Submit Report</Link>}
        {(role === 'verifier' || role === 'admin') && <Link to="/verify">Verifier</Link>}
        {role === 'admin' && <Link to="/admin">Admin</Link>}
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="navbar-button">Register</Link>
          </>
        )}
        {user && (
          <button className="navbar-button outline" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="navbar-mobile">
          <Link to="/" onClick={closeMobile}>Home</Link>
          <Link to="/map" onClick={closeMobile}>Disaster Map</Link>
          <Link to="/reports" onClick={closeMobile}>Reports</Link>
          {user && <Link to="/dashboard" onClick={closeMobile}>Dashboard</Link>}
          {user && <Link to="/report" onClick={closeMobile}>Submit Report</Link>}
          {(role === 'verifier' || role === 'admin') && (
            <Link to="/verify" onClick={closeMobile}>Verifier Queue</Link>
          )}
          {role === 'admin' && <Link to="/admin" onClick={closeMobile}>Admin</Link>}
          {!user && <Link to="/login" onClick={closeMobile}>Login</Link>}
          {!user && <Link to="/register" onClick={closeMobile}>Register</Link>}
          {user && <button onClick={handleLogout}>Logout</button>}
        </div>
      )}
    </nav>
  );
}
