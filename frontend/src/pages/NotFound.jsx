import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/common/EmptyState.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <EmptyState icon={Compass} title="404 — Page not found" message="The page you are looking for doesn't exist or has been moved."
        action={<Link to="/dashboard" className="btn-primary">Back to dashboard</Link>} />
    </div>
  );
}
