
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

function NotFound() {
  return (
    <main className="not-found-page">
      <AlertTriangle size={56} />

      <h1>404</h1>
      <h2>Page Not Found</h2>

      <p>
        Sorry, the page you're looking for doesn't exist
        or may have been moved.
      </p>

      <Link to="/" className="primary-button">
        <ArrowLeft size={18} />
        Back to Home
      </Link>
    </main>
  );
}

export default NotFound;
