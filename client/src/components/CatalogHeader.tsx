import { useAuth } from '@/hooks/useAuth';
import { Search, Menu, User, LogOut, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface CatalogHeaderProps {
  onNavigate: (tab: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function CatalogHeader({ onNavigate, onSearch, searchQuery }: CatalogHeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-deep-brown/15 sticky top-0 z-40" style={{ backgroundColor: 'color-mix(in oklab, var(--color-sand) 30%, white)' }}>
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('browse')}
          className="text-xl font-serif font-bold text-deep-brown hover:text-terracotta shrink-0"
        >
          Community Supplies
        </button>

        {/* Search — desktop */}
        <form
          onSubmit={(e) => { e.preventDefault(); }}
          className="flex-1 max-w-md hidden sm:block"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-deep-brown/40" />
            <input
              type="search"
              placeholder="Search supplies..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-deep-brown/20 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2 ml-auto">
          <button
            onClick={() => onNavigate('browse')}
            className="px-3 py-1.5 text-sm text-deep-brown/70 hover:text-deep-brown hover:bg-sand rounded-sm"
          >
            Browse
          </button>
          <button
            onClick={() => onNavigate('add')}
            className="px-3 py-1.5 text-sm bg-terracotta text-white rounded-sm hover:bg-terracotta/90"
          >
            + Add Item
          </button>

          {user?.role === 'steward' && (
            <button
              onClick={() => onNavigate('steward')}
              className="px-3 py-1.5 text-sm text-deep-brown/70 hover:text-deep-brown hover:bg-sand rounded-sm"
            >
              Steward
            </button>
          )}

          {/* User menu — desktop */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-deep-brown/60 hover:text-deep-brown hover:bg-sand rounded-sm"
            >
              <User className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-deep-brown/15 rounded-sm shadow-lg py-1 z-50">
                <div className="px-3 py-2 text-xs text-deep-brown/50 border-b border-deep-brown/10">
                  @{user?.username}
                </div>
                <Link
                  to="/my-supplies"
                  className="block px-3 py-2 text-sm hover:bg-sand"
                  onClick={() => setMenuOpen(false)}
                >
                  My Supplies
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-sm hover:bg-sand"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden ml-auto p-2 text-deep-brown/60 hover:text-deep-brown"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-deep-brown/15 bg-white">
          {/* Mobile search */}
          <div className="px-4 py-3 border-b border-deep-brown/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-deep-brown/40" />
              <input
                type="search"
                placeholder="Search supplies..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-deep-brown/20 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
          </div>

          {/* Mobile nav links */}
          <div className="px-2 py-2 space-y-1">
            <div className="px-3 py-1.5 text-xs text-deep-brown/50">
              @{user?.username}
            </div>
            <button
              onClick={() => { onNavigate('browse'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm text-deep-brown hover:bg-sand rounded-sm"
            >
              Browse
            </button>
            <button
              onClick={() => { onNavigate('add'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm text-deep-brown font-medium hover:bg-sand rounded-sm flex items-center gap-2"
            >
              <span className="text-terracotta">+</span> Add Item
            </button>
            <Link
              to="/my-supplies"
              className="block px-3 py-2.5 text-sm text-deep-brown hover:bg-sand rounded-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Supplies
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2.5 text-sm text-deep-brown hover:bg-sand rounded-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            {user?.role === 'steward' && (
              <button
                onClick={() => { onNavigate('steward'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm text-deep-brown hover:bg-sand rounded-sm"
              >
                Steward Dashboard
              </button>
            )}
            <div className="border-t border-deep-brown/10 mt-1 pt-1">
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-sm flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
