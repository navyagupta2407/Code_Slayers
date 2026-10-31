
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

function Login() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <ShieldCheck size={42} />

        <h1>Welcome Back</h1>
        <p>Sign in to your DisasterLens AI account.</p>

        <form>
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
            placeholder="Enter your password"
          />

          <button type="submit">Sign In</button>
        </form>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
