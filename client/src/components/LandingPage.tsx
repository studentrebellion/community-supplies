import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from './auth/AuthModal';

interface LandingPageProps {
  onTabChange: (tab: string) => void;
}

export default function LandingPage({ onTabChange }: LandingPageProps) {
  const { user } = useAuth();
  const [modalMode, setModalMode] = useState<'login' | 'signup' | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — vertically centered */}
      <section className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-deep-brown mb-4 leading-tight">
            Community Supplies
          </h1>
          <p className="text-lg sm:text-xl text-dusk-pink mb-3">
            Borrow what you need. Share what you have.
          </p>
          <p className="text-base text-deep-brown/50 mb-10 max-w-xl mx-auto">
            A free, open-source tool for neighborhoods to share supplies, tools, party gear, and more.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => user ? onTabChange('browse') : setModalMode('login')}
              className="px-8 py-3 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90 text-base"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={!!modalMode}
        mode={modalMode}
        onClose={() => setModalMode(null)}
        onSuccess={() => onTabChange('browse')}
      />
    </div>
  );
}
