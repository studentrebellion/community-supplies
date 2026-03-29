import { Link } from 'react-router-dom';
import StartCommunityForm from '@/components/community/StartCommunityForm';
import Footer from '@/components/Footer';

export default function StartCommunity() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="text-2xl font-serif font-bold text-deep-brown hover:text-terracotta">
          Community Supplies
        </Link>
      </header>
      <main className="flex-1 container mx-auto px-4 pb-12">
        <StartCommunityForm />
      </main>
      <Footer />
    </div>
  );
}
