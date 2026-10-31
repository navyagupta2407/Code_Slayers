
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

function Register() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <ShieldCheck size={42} />

        <h1>Create Account</h1>
        <p>Join the DisasterLens AI community.</p>

        <form>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
          />

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Create a password"
          />

          <button type="submit">Create Account</button>
        </form>

        <p>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
