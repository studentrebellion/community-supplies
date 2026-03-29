import { useState, useEffect } from 'react';
import { supplies as suppliesApi } from '@/lib/api';
import { categories } from '@/data/categories';
import { X, Loader2 } from 'lucide-react';

interface EditSupplyModalProps {
  supply: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

export default function EditSupplyModal({ supply, isOpen, onClose, onSaved }: EditSupplyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('good');
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [lentOut, setLentOut] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supply) {
      setName(supply.name || '');
      setDescription(supply.description || '');
      setCategory(supply.category || '');
      setCondition(supply.condition || 'good');
      setHouseRules(supply.house_rules || []);
      setLentOut(supply.lent_out || false);
    }
  }, [supply]);

  if (!isOpen || !supply) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { supply: updated } = await suppliesApi.update(supply.id, {
        name,
        description,
        category,
        condition,
        house_rules: houseRules,
        lent_out: lentOut,
      });
      onSaved(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-sm shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-deep-brown/40 hover:text-deep-brown z-10">
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <h2 className="text-xl font-serif font-bold text-deep-brown">Edit Supply</h2>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required
              className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm min-h-[80px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-deep-brown mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm bg-white">
                {categories.filter(c => !c.isSpecial).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-brown mb-1">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="w-full px-3 py-2 border border-deep-brown/20 rounded-sm bg-white">
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Status</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setLentOut(false)}
                className={`flex-1 py-2 text-sm rounded-sm border ${!lentOut ? 'bg-green-50 border-green-300 text-green-700' : 'border-deep-brown/20 text-deep-brown/60'}`}>
                Available
              </button>
              <button type="button" onClick={() => setLentOut(true)}
                className={`flex-1 py-2 text-sm rounded-sm border ${lentOut ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-deep-brown/20 text-deep-brown/60'}`}>
                Lent Out
              </button>
            </div>
          </div>

          {/* House Rules */}
          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1">Borrowing Rules</label>
            {houseRules.length > 0 && (
              <div className="space-y-1 mb-2">
                {houseRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-sand/30 rounded-sm text-sm">
                    <span className="flex-1">{rule}</span>
                    <button type="button" onClick={() => setHouseRules(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-terracotta hover:bg-terracotta/10 rounded-sm p-0.5 shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={newRule} onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newRule.trim()) { e.preventDefault(); setHouseRules(prev => [...prev, newRule.trim()]); setNewRule(''); } }}
                placeholder="Add a rule..." className="flex-1 px-3 py-1.5 border border-deep-brown/20 rounded-sm text-sm" />
              <button type="button" onClick={() => { if (newRule.trim()) { setHouseRules(prev => [...prev, newRule.trim()]); setNewRule(''); } }}
                disabled={!newRule.trim()} className="px-3 py-1.5 border border-deep-brown/20 rounded-sm text-sm hover:bg-sand disabled:opacity-40">+</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-terracotta text-white rounded-sm font-medium hover:bg-terracotta/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-deep-brown/30 rounded-sm text-deep-brown hover:bg-sand">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
