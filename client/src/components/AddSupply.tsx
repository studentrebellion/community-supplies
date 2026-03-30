import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ai, supplies as suppliesApi } from '@/lib/api';
import { categories } from '@/data/categories';
import { Loader2, Upload, Sparkles, Camera } from 'lucide-react';
import { compressImage } from '@/lib/image';

interface AddSupplyProps {
  onNavigate?: (tab: string) => void;
}

export default function AddSupply({ onNavigate }: AddSupplyProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [published, setPublished] = useState(false);
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', category: '', condition: 'good',
    neighborhood: '', cross_streets: '',
    images: [] as string[],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDrafting(true);

    try {
      const { dataUrl, file: compressedFile } = await compressImage(file);
      setUploadedImage(dataUrl);

      const draft = await ai.draftFromImage(compressedFile);
      setForm(prev => ({
        ...prev,
        name: draft.name || '',
        description: draft.description || '',
        category: draft.category || '',
        condition: draft.condition || 'good',
      }));
      setHouseRules(draft.houseRules || []);
      setShowForm(true);
    } catch (err: any) {
      console.error('Image analysis error:', err);
      const msg = err.message?.includes('rate limit')
        ? 'The system is temporarily rate limited. You can fill in details manually or try again in a minute.'
        : 'Failed to analyze image. Fill in details manually.';
      alert(msg);
      setShowForm(true);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.category) {
      alert('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    try {
      await suppliesApi.create({
        name: form.name,
        description: form.description,
        category: form.category,
        condition: form.condition,
        neighborhood: form.neighborhood,
        cross_streets: form.cross_streets,

        images: uploadedImage ? [uploadedImage] : [],
        image_url: uploadedImage || null,
        house_rules: houseRules,
      });
      setPublished(true);
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  if (published) {
    return (
    <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="bg-white border border-deep-brown/15 rounded-sm p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-serif font-bold text-deep-brown mb-2">Item Published!</h2>
            <p className="text-deep-brown/60 mb-6">
              <strong>{form.name}</strong> is now available for your neighbors to browse.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPublished(false); setShowForm(false); setUploadedImage(''); setForm({ name: '', description: '', category: '', condition: 'good', neighborhood: '', cross_streets: '', images: [] }); }}
                className="px-6 py-2.5 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90"
              >
                Add Another Item
              </button>
              <button
                onClick={() => onNavigate ? onNavigate('browse') : window.location.href = '/'}
                className="px-6 py-2.5 border border-deep-brown/30 rounded-sm text-deep-brown hover:bg-sand"
              >
                Browse Catalog
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-deep-brown mb-2">Add an Item</h1>
          <p className="text-deep-brown/60">Share an item with your neighbors</p>
        </div>

        {!showForm ? (
          <div className="bg-white border border-deep-brown/15 rounded-sm p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
              <Upload className="w-12 h-12 text-terracotta" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-deep-brown mb-2">Upload Photo/Image</h2>
            <p className="text-deep-brown/60 mb-6">
              Take a photo of your item or choose an existing image and our system will help draft the listing
            </p>
            {/* Camera capture (mobile) */}
            <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" id="img-camera" disabled={isDrafting} />
            {/* File picker */}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" disabled={isDrafting} />
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <label htmlFor="img-camera" className="sm:hidden">
                <span className={`inline-flex items-center px-6 py-3 bg-terracotta text-white rounded-sm font-medium cursor-pointer hover:bg-terracotta/90 ${isDrafting ? 'opacity-50 cursor-wait' : ''}`}>
                  {isDrafting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</> : <><Camera className="mr-2 h-5 w-5" /> Take Photo</>}
                </span>
              </label>
              <label htmlFor="img-upload">
                <span className={`inline-flex items-center px-6 py-3 border border-deep-brown/30 text-deep-brown rounded-sm font-medium cursor-pointer hover:bg-sand ${isDrafting ? 'opacity-50 cursor-wait' : ''}`}>
                  <Upload className="mr-2 h-5 w-5" /> Choose Image
                </span>
              </label>
            </div>
            <p className="text-sm text-deep-brown/40 mt-4 mb-3">Maximum file size: 5MB</p>
            {!isDrafting && (
              <button
                type="button"
                onClick={() => {
                  setForm({ name: '', description: '', category: '', condition: 'good', neighborhood: '', cross_streets: '', images: [] });
                  setHouseRules([]);
                  setUploadedImage('');
                  setShowForm(true);
                }}
                className="mt-4 text-sm text-deep-brown/60 hover:text-terracotta underline underline-offset-4"
              >
                I don't have an image
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="bg-white border border-deep-brown/15 rounded-sm p-6 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-deep-brown">Item Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-deep-brown mb-1">Item Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required
                    className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm" placeholder="e.g., Folding Tables (2)" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-deep-brown mb-1">Description *</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} required
                    className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm min-h-[100px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-brown mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                    className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm bg-white">
                    <option value="">Select category</option>
                    {categories.filter(c => !c.isSpecial).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-brown mb-1">Condition *</label>
                  <select value={form.condition} onChange={e => setForm(p => ({...p, condition: e.target.value}))}
                    className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm bg-white">
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Borrowing Guidelines */}
            <div className="bg-white border border-deep-brown/15 rounded-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-serif font-semibold text-deep-brown">Borrowing Guidelines</h2>
                <p className="text-sm text-deep-brown/50 mt-1">Set clear expectations for borrowers</p>
              </div>

              {houseRules.length > 0 && (
                <div className="space-y-2">
                  {houseRules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-sand/20 rounded-sm border border-sand">
                      <span className="flex-1 text-sm text-deep-brown">{rule}</span>
                      <button
                        type="button"
                        onClick={() => setHouseRules(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-terracotta hover:bg-terracotta/10 rounded-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-deep-brown mb-1">Add a rule</label>
                <div className="flex gap-2">
                  <input
                    value={newRule}
                    onChange={e => setNewRule(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newRule.trim()) {
                        e.preventDefault();
                        setHouseRules(prev => [...prev, newRule.trim()]);
                        setNewRule('');
                      }
                    }}
                    placeholder="Enter a new rule..."
                    className="flex-1 px-3 py-2 border border-deep-brown/20 rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={() => { if (newRule.trim()) { setHouseRules(prev => [...prev, newRule.trim()]); setNewRule(''); } }}
                    disabled={!newRule.trim()}
                    className="px-3 py-2 border border-deep-brown/20 rounded-sm text-deep-brown hover:bg-sand disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={isLoading}
                className="flex-1 py-3 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90 disabled:opacity-50">
                {isLoading ? 'Publishing...' : 'Publish Item'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setUploadedImage(''); }}
                className="px-6 py-3 border border-deep-brown/30 rounded-sm text-deep-brown hover:bg-sand">
                Start Over
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
