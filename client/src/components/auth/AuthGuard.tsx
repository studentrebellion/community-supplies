import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Heart } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  requireVouched?: boolean;
  requireSteward?: boolean;
}

export default function AuthGuard({ children, requireVouched = false, requireSteward = false }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-[50vh] text-deep-brown/60">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white border border-deep-brown/15 rounded-sm p-8 max-w-md text-center">
          <h2 className="text-2xl font-serif font-bold text-deep-brown mb-2">Sign In Required</h2>
          <p className="text-deep-brown/60">Please sign in to access this feature.</p>
        </div>
      </div>
    );
  }

  if (requireSteward && user.role !== 'steward') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white border border-deep-brown/15 rounded-sm p-8 max-w-md text-center">
          <Shield className="h-10 w-10 text-terracotta mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-deep-brown mb-2">Steward Access Required</h2>
          <p className="text-deep-brown/60">You need steward privileges to access this area.</p>
        </div>
      </div>
    );
  }

  if (requireVouched && !user.vouched_at) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white border border-deep-brown/15 rounded-sm p-8 max-w-md text-center">
          <Heart className="h-10 w-10 text-terracotta mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-deep-brown mb-2">Waiting for Vouching</h2>
          <p className="text-deep-brown/60">
            A community steward will review your profile and vouch for you soon.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
