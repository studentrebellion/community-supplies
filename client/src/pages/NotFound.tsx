import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-serif font-bold text-terracotta mb-4">404</h1>
        <p className="text-deep-brown/60 mb-6">Page not found</p>
        <Link to="/" className="text-terracotta hover:underline font-medium">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
