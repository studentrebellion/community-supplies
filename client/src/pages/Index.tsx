import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';
import CatalogHeader from '@/components/CatalogHeader';
import BrowseSupplies from '@/components/BrowseSupplies';
import AddSupply from '@/components/AddSupply';
import StewardDashboard from '@/components/steward/StewardDashboard';
import AuthGuard from '@/components/auth/AuthGuard';
import Footer from '@/components/Footer';

export default function Index() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'browse');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4" />
          <p className="text-deep-brown/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onTabChange={setActiveTab} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'add':
        return (
          <AuthGuard requireVouched>
            <AddSupply onNavigate={setActiveTab} />
          </AuthGuard>
        );
      case 'steward':
        return (
          <AuthGuard requireSteward>
            <StewardDashboard />
          </AuthGuard>
        );
      default:
        return (
          <AuthGuard requireVouched>
            <BrowseSupplies searchQuery={searchQuery} />
          </AuthGuard>
        );
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <CatalogHeader onNavigate={setActiveTab} onSearch={setSearchQuery} searchQuery={searchQuery} />
      <div className="flex-1">{renderContent()}</div>
      <Footer />
    </main>
  );
}
