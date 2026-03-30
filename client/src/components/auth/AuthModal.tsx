import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup' | null;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, mode: initialMode, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode || 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [signalContact, setSignalContact] = useState('');
  const [signalType, setSignalType] = useState<'username' | 'phone'>('username');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);
  const [phoneWarningAccepted, setPhoneWarningAccepted] = useState(false);
  const { login, signup } = useAuth();

  // Sync with parent when modal opens
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  // Reset phone warning when switching signal type
  useEffect(() => {
    if (signalType === 'username') {
      setPhoneWarningAccepted(false);
    }
  }, [signalType]);

  if (!isOpen || !initialMode) return null;

  const handleSignalTypeChange = (type: 'username' | 'phone') => {
    if (type === 'phone' && !phoneWarningAccepted) {
      setShowPhoneWarning(true);
    } else {
      setSignalType(type);
    }
  };

  const acceptPhoneWarning = () => {
    setPhoneWarningAccepted(true);
    setSignalType('phone');
    setShowPhoneWarning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        if (!signalContact.trim()) {
          setError('Signal contact is required');
          setLoading(false);
          return;
        }
        await signup(username, password, name, signalContact);
      }
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="bg-white rounded-sm shadow-xl w-full max-w-md p-6 animate-fade-in relative"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-serif font-bold text-deep-brown mb-6">
            {mode === 'login' ? 'Welcome' : 'Join the Community'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-deep-brown mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-3 py-2.5 border border-deep-brown/30 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-deep-brown mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                placeholder="Username"
                required
                minLength={3}
                className="w-full px-3 py-2.5 border border-deep-brown/30 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-brown mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password (6+ characters)' : 'Your password'}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-deep-brown/30 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-deep-brown mb-1">Signal Contact</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSignalTypeChange('username')}
                    className={`flex-1 py-1.5 text-sm rounded-sm border transition-colors ${
                      signalType === 'username'
                        ? 'bg-terracotta text-white border-terracotta'
                        : 'border-deep-brown/30 text-deep-brown/70 hover:border-terracotta/50'
                    }`}
                  >
                    Signal Username
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSignalTypeChange('phone')}
                    className={`flex-1 py-1.5 text-sm rounded-sm border transition-colors ${
                      signalType === 'phone'
                        ? 'bg-terracotta text-white border-terracotta'
                        : 'border-deep-brown/30 text-deep-brown/70 hover:border-terracotta/50'
                    }`}
                  >
                    Phone Number
                  </button>
                </div>
                <input
                  type="text"
                  value={signalContact}
                  onChange={(e) => setSignalContact(e.target.value)}
                  placeholder={signalType === 'username' ? 'Your Signal username' : 'Your phone number'}
                  required
                  className="w-full px-3 py-2.5 border border-deep-brown/30 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                />
                <p className="text-xs text-deep-brown/50 mt-1">
                  This is how neighbors will contact you about borrowing items.
                </p>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90 disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <p className="text-center text-sm text-deep-brown/60 mt-5">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={toggleMode} className="text-terracotta font-medium hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={toggleMode} className="text-terracotta font-medium hover:underline">
                  Sign In
                </button>
              </>
            )}
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-deep-brown/40 hover:text-deep-brown text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Phone number privacy warning modal */}
      {showPhoneWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPhoneWarning(false)}>
          <div
            className="bg-white rounded-sm shadow-2xl w-full max-w-sm p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-deep-brown">Heads Up</h3>
            </div>
            <p className="text-sm text-deep-brown/70 leading-relaxed mb-6">
              Your phone number will be visible to other community members so they can contact you on Signal about borrowing items.
              If you'd prefer more privacy, you can use a <strong>Signal username</strong> instead.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhoneWarning(false)}
                className="flex-1 py-2 border border-deep-brown/30 text-deep-brown rounded-sm text-sm font-medium hover:bg-sand"
              >
                Use Username
              </button>
              <button
                onClick={acceptPhoneWarning}
                className="flex-1 py-2 bg-terracotta text-white rounded-sm text-sm font-medium hover:bg-terracotta/90"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
