import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { profiles as profilesApi } from '@/lib/api';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [name, setName] = useState('');
  const [introText, setIntroText] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [signalContact, setSignalContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    profilesApi.me().then(({ profile }) => {
      setProfile(profile);
      setName(profile.name || '');
      setIntroText(profile.intro_text || '');
      setZipCode(profile.zip_code || '');
      setSignalContact(profile.signal_contact || '');
    }).finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profilesApi.update({ name, intro_text: introText, zip_code: zipCode, signal_contact: signalContact });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/profiles/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-deep-brown/60 hover:text-deep-brown mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="text-3xl font-serif font-semibold text-deep-brown mb-8">Profile</h1>

        {/* Profile Info */}
        <form onSubmit={handleProfileSave} className="bg-white border border-deep-brown/15 rounded-sm p-6 mb-6 space-y-4">
          <h2 className="text-lg font-serif font-semibold text-deep-brown">Your Info</h2>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Username</label>
            <input value={profile?.username || ''} disabled
              className="w-full px-3 py-2 border border-deep-brown/15 rounded-sm bg-sand/30 text-deep-brown/60" />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Signal Contact</label>
            <input value={signalContact} onChange={e => setSignalContact(e.target.value)}
              className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm"
              placeholder="Signal username or phone number" />
            <p className="text-xs text-deep-brown/50 mt-1">
              This is how neighbors will contact you on Signal about borrowing items.
            </p>
          </div>

          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90 disabled:opacity-50 flex items-center gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> :
              saved ? <><Check className="h-4 w-4" /> Saved!</> : 'Save Changes'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="bg-white border border-deep-brown/15 rounded-sm p-6 space-y-4">
          <h2 className="text-lg font-serif font-semibold text-deep-brown">Change Password</h2>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              required className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              required minLength={6} className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm"
              placeholder="At least 6 characters" />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              required className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm" />
          </div>

          {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
          {passwordMessage && <p className="text-green-700 text-sm">{passwordMessage}</p>}

          <button type="submit" disabled={passwordSaving}
            className="px-6 py-2 bg-deep-brown text-white rounded-sm font-medium hover:bg-deep-brown/90 disabled:opacity-50 flex items-center gap-2">
            {passwordSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</> : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
