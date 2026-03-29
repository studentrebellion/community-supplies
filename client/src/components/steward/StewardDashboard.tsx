import { useEffect, useState } from 'react';
import { steward as stewardApi, joinRequests as joinRequestsApi } from '@/lib/api';
import { Shield, Users, Package, MessageSquare, Globe } from 'lucide-react';
import EditSupplyModal from '@/components/EditSupplyModal';

export default function StewardDashboard() {
  const [tab, setTab] = useState('members');

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8 text-terracotta" />
        <div>
          <h1 className="text-3xl font-bold font-serif text-deep-brown">Steward Dashboard</h1>
          <p className="text-deep-brown/50 text-sm">Community overview and activity</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-deep-brown/15">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'supplies', label: 'Supplies', icon: Package },
          { id: 'requests', label: 'Requests', icon: MessageSquare },
          { id: 'communities', label: 'Communities', icon: Globe },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm flex items-center gap-2 border-b-2 -mb-px ${
              tab === t.id ? 'border-terracotta text-terracotta font-medium' : 'border-transparent text-deep-brown/50 hover:text-deep-brown'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-deep-brown/15 rounded-sm p-6">
        {tab === 'members' && <MembersTab />}
        {tab === 'supplies' && <SuppliesTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'communities' && <CommunitiesTab />}
      </div>
    </div>
  );
}

function MembersTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinReqs, setJoinReqs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      stewardApi.members().then(d => setMembers(d.members)),
      joinRequestsApi.list().then(d => setJoinReqs(d.requests)),
    ]).finally(() => setLoading(false));
  }, []);

  const vouch = async (reqId: string) => {
    await joinRequestsApi.vouch(reqId);
    // Refresh
    const [m, r] = await Promise.all([stewardApi.members(), joinRequestsApi.list()]);
    setMembers(m.members);
    setJoinReqs(r.requests);
  };

  if (loading) return <p className="text-deep-brown/50">Loading...</p>;

  const pending = joinReqs.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-lg font-serif font-semibold text-deep-brown mb-3">Pending Requests ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-sand/50 rounded-sm">
                <div>
                  <p className="font-medium text-deep-brown">{req.name}</p>
                  <p className="text-xs text-deep-brown/50">{req.email} · {req.cross_streets}</p>
                </div>
                <button onClick={() => vouch(req.id)}
                  className="px-3 py-1.5 bg-terracotta text-white text-sm rounded-sm hover:bg-terracotta/90">
                  Vouch
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-serif font-semibold text-deep-brown mb-3">All Members ({members.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-deep-brown/15 text-left">
                <th className="pb-2 pr-4 font-medium text-deep-brown/50">Name</th>
                <th className="pb-2 pr-4 font-medium text-deep-brown/50">Username</th>
                <th className="pb-2 pr-4 font-medium text-deep-brown/50">Role</th>
                <th className="pb-2 font-medium text-deep-brown/50">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-b border-deep-brown/10">
                  <td className="py-2.5 pr-4">{m.name}</td>
                  <td className="py-2.5 pr-4 text-deep-brown/60">@{m.username}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-sm ${m.role === 'steward' ? 'bg-terracotta/10 text-terracotta' : 'bg-sand text-deep-brown/70'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {m.vouched_at ? (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-sm">Vouched</span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SuppliesTab() {
  const [suppliesList, setSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingSupply, setEditingSupply] = useState<any>(null);

  const fetchSupplies = () => {
    stewardApi.allSupplies().then(d => setSupplies(d.supplies)).finally(() => setLoading(false));
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
      const token = localStorage.getItem('auth_token');
      console.log('[Steward] Deleting supply:', id);
      const res = await fetch(`/api/supplies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Steward] Delete response status:', res.status);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete' }));
        throw new Error(data.error || 'Failed to delete');
      }
      setSupplies(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('[Steward] Delete error:', err);
      alert(err.message || 'Failed to delete supply');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (id: string, currentlyLentOut: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/supplies/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lent_out: !currentlyLentOut }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSupplies(prev => prev.map(s => s.id === id ? { ...s, lent_out: !currentlyLentOut } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update availability');
    }
  };

  if (loading) return <p className="text-deep-brown/50">Loading...</p>;

  return (
    <div>
      <h3 className="text-lg font-serif font-semibold text-deep-brown mb-3">All Supplies ({suppliesList.length})</h3>
      <div className="space-y-2">
        {suppliesList.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 bg-sand/30 rounded-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-deep-brown">{s.name}</p>
              <p className="text-xs text-deep-brown/50">{s.category} · {s.owner_name}</p>
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
      <EditSupplyModal
        supply={editingSupply}
        isOpen={!!editingSupply}
        onClose={() => setEditingSupply(null)}
        onSaved={(updated) => {
          setSupplies(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
        }}
      />
    </div>
  );
}

function RequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stewardApi.supplyRequests().then(d => setRequests(d.requests)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-deep-brown/50">Loading...</p>;
  if (requests.length === 0) return <p className="text-deep-brown/50">No borrow requests yet.</p>;

  return (
    <div className="space-y-2">
      {requests.map(r => (
        <div key={r.id} className="p-3 bg-sand/30 rounded-sm">
          <p className="font-medium text-deep-brown">{r.sender_name} → {r.supply_name}</p>
          <p className="text-sm text-deep-brown/60 mt-1">{r.message}</p>
          <p className="text-xs text-deep-brown/40 mt-1">Contact: {r.sender_contact}</p>
        </div>
      ))}
    </div>
  );
}

function CommunitiesTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
      .then(r => r.json())
      .then(d => setRequests(d.requests || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-deep-brown/50">Loading...</p>;
  if (requests.length === 0) return <p className="text-deep-brown/50">No community requests yet.</p>;

  return (
    <div className="space-y-2">
      {requests.map(r => (
        <div key={r.id} className="p-3 bg-sand/30 rounded-sm">
          <p className="font-medium text-deep-brown">{r.name} ({r.email})</p>
          <p className="text-sm text-deep-brown/60 mt-1">{r.reason}</p>
          <span className="text-xs px-2 py-0.5 rounded-sm bg-sand text-deep-brown/70">{r.status}</span>
        </div>
      ))}
    </div>
  );
}
