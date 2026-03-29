import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supplies as suppliesApi } from '@/lib/api';
import { ArrowLeft, Package } from 'lucide-react';
import EditSupplyModal from '@/components/EditSupplyModal';

export default function MySupplies() {
  const [suppliesList, setSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingSupply, setEditingSupply] = useState<any>(null);

  const fetchSupplies = () => {
    suppliesApi.my().then(d => setSupplies(d.supplies)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSupplies(); }, []);

  const handleDelete = async (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setDeleting(id);
    setConfirmId(null);
    try {
      console.log('[MySupplies] Deleting supply:', id);
      await suppliesApi.remove(id);
      console.log('[MySupplies] Deleted successfully');
      setSupplies(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('[MySupplies] Delete error:', err);
      alert(err.message || 'Failed to delete supply');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (id: string, currentlyLentOut: boolean) => {
    try {
      await suppliesApi.update(id, { lent_out: !currentlyLentOut });
      setSupplies(prev => prev.map(s => s.id === id ? { ...s, lent_out: !currentlyLentOut } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update availability');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-6xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-deep-brown/60 hover:text-deep-brown">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-center gap-2">
          <Package className="h-8 w-8 text-terracotta" />
          <div>
            <h1 className="text-3xl font-bold font-serif text-deep-brown">My Supplies</h1>
            <p className="text-deep-brown/50 text-sm">Manage your listed items</p>
          </div>
        </div>

        {/* Tabs (just supplies) */}
        <div className="flex gap-1 border-b border-deep-brown/15">
          <button
            className="px-4 py-2.5 text-sm flex items-center gap-2 border-b-2 -mb-px border-terracotta text-terracotta font-medium"
          >
            <Package className="h-4 w-4" /> Supplies
          </button>
        </div>

        {/* Content */}
        <div className="bg-white border border-deep-brown/15 rounded-sm p-6">
          {loading ? (
            <p className="text-deep-brown/50">Loading...</p>
          ) : suppliesList.length === 0 ? (
            <p className="text-deep-brown/50">You haven't listed any supplies yet.</p>
          ) : (
            <div>
              <h3 className="text-lg font-serif font-semibold text-deep-brown mb-3">
                Your Supplies ({suppliesList.length})
              </h3>
              <div className="space-y-2">
                {suppliesList.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-sand/30 rounded-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-deep-brown">{s.name}</p>
                      <p className="text-xs text-deep-brown/50">{s.category} · {s.condition}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleAvailability(s.id, s.lent_out)}
                        className="flex items-center gap-1.5 group"
                        title={s.lent_out ? 'Click to mark available' : 'Click to mark unavailable'}
                      >
                        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.lent_out ? 'bg-amber-300' : 'bg-green-400'}`}>
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${s.lent_out ? 'translate-x-1' : 'translate-x-[18px]'}`} />
                        </span>
                        <span className={`text-xs ${s.lent_out ? 'text-amber-700' : 'text-green-700'}`}>
                          {s.lent_out ? 'Unavailable' : 'Available'}
                        </span>
                      </button>
                      {confirmId === s.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deleting === s.id}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded-sm disabled:opacity-50"
                          >
                            {deleting === s.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1 text-deep-brown/50 hover:bg-sand rounded-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingSupply(s)}
                            className="text-xs px-2 py-1 text-terracotta hover:bg-terracotta/10 rounded-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <EditSupplyModal
          supply={editingSupply}
          isOpen={!!editingSupply}
          onClose={() => setEditingSupply(null)}
          onSaved={(updated) => {
            setSupplies(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
          }}
        />
      </div>
    </div>
  );
}
