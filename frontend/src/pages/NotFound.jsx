import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <MapPin size={40} />
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="primary-button">
        Go Home
      </Link>
    </div>
  );
}
