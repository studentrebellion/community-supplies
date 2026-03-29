import { useState } from 'react';
import { community as communityApi } from '@/lib/api';

export default function StartCommunityForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await communityApi.submit({ name, email, reason, questions: questions || null });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white border border-deep-brown/15 rounded-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-8">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-serif font-bold text-deep-brown mb-3">Thank you!</h2>
        <p className="text-deep-brown/60">
          We've received your request. We'll be in touch soon to talk next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-deep-brown/15 rounded-sm max-w-2xl mx-auto my-4 sm:my-8">
      <div className="p-4 sm:p-6 border-b border-deep-brown/10">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-deep-brown">Start a Sharing Community</h2>
        <p className="text-sm text-deep-brown/60 mt-1">
          Tell us about the community you'd like to start and we'll help you get set up.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-deep-brown mb-1">Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full px-3 py-2.5 border border-deep-brown/20 rounded-sm text-base" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deep-brown mb-1">Your Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full px-3 py-2.5 border border-deep-brown/20 rounded-sm text-base" placeholder="you@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deep-brown mb-1">Why do you want to start a sharing community?</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} required
            className="w-full px-3 py-2.5 border border-deep-brown/20 rounded-sm min-h-[120px] text-base"
            placeholder="Tell us about your neighborhood..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-deep-brown mb-1">Questions? (optional)</label>
          <textarea value={questions} onChange={e => setQuestions(e.target.value)}
            className="w-full px-3 py-2.5 border border-deep-brown/20 rounded-sm min-h-[80px] text-base" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90 disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
