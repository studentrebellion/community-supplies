import AuthGuard from '@/components/auth/AuthGuard';
import StewardDashboard from '@/components/steward/StewardDashboard';

export default function Steward() {
  return (
    <AuthGuard requireSteward>
      <StewardDashboard />
    </AuthGuard>
  );
}
