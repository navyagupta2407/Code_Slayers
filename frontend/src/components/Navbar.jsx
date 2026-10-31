
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <ShieldCheck size={28} />
        <span>DisasterLens AI</span>
      </Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register" className="navbar-button">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
