import { useState, useMemo } from 'react';
import { useSupplies } from '@/hooks/useSupplies';
import { categories, isSpecialCategory, getCategoryName } from '@/data/categories';
import { cn } from '@/lib/utils';
import { Loader2, X, MapPin, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface BrowseSuppliesProps {
  searchQuery?: string;
}

export default function BrowseSupplies({ searchQuery: externalQuery = '' }: BrowseSuppliesProps) {
  const { supplies, loading } = useSupplies();
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [searchQuery] = useState(externalQuery);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);

  const filteredSupplies = useMemo(() => {
    if (isSpecialCategory(categoryFilter)) return [];
    return supplies.filter((supply: any) => {
      if (supply.lentOut) return false;
      const matchesCategory = categoryFilter === 'all' || supply.category === categoryFilter;
      const matchesCondition = conditionFilter === 'all' || supply.condition === conditionFilter;
      const q = (externalQuery || searchQuery).toLowerCase();
      const matchesSearch = q === '' ||
        supply.name.toLowerCase().includes(q) ||
        supply.description.toLowerCase().includes(q);
      return matchesCategory && matchesCondition && matchesSearch;
    });
  }, [supplies, categoryFilter, conditionFilter, searchQuery, externalQuery]);

  const openDetail = (supply: any) => {
    setSelectedSupply(supply);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Category sidebar */}
      <aside className="hidden md:block w-56 border-r border-deep-brown/15 p-4 shrink-0">
        <h3 className="text-xs font-semibold text-deep-brown/50 uppercase tracking-wider mb-3">Categories</h3>
        <nav className="space-y-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'w-full text-left px-3 py-2 text-sm rounded-sm',
              categoryFilter === 'all' ? 'bg-terracotta/10 text-terracotta font-medium' : 'text-deep-brown hover:bg-white'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-sm flex items-center gap-2',
                  categoryFilter === cat.id ? 'bg-terracotta/10 text-terracotta font-medium' : 'text-deep-brown hover:bg-white'
                )}
              >
                <Icon className="h-4 w-4" /> {cat.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {/* Mobile category filter */}
        <div className="md:hidden overflow-x-auto border-b border-deep-brown/15 px-3 py-2 flex gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs rounded-full border',
              categoryFilter === 'all' ? 'bg-terracotta text-white border-terracotta' : 'border-deep-brown/20 text-deep-brown/70 hover:border-terracotta/50'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                'shrink-0 px-3 py-1.5 text-xs rounded-full border whitespace-nowrap',
                categoryFilter === cat.id ? 'bg-terracotta text-white border-terracotta' : 'border-deep-brown/20 text-deep-brown/70 hover:border-terracotta/50'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          {/* Filters */}
          <div className="hidden md:flex items-center gap-4 bg-white border border-deep-brown/15 rounded-sm p-3 mb-6">
            <label className="text-xs font-medium text-deep-brown/50">Condition:</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="text-xs border border-deep-brown/20 rounded-sm px-2 py-1 bg-white"
            >
              <option value="all">Any</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
            <span className="text-xs text-deep-brown/40 ml-auto">
              {filteredSupplies.length} item{filteredSupplies.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Grid */}
          {filteredSupplies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-deep-brown/50">No supplies found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredSupplies.map((supply: any) => (
                <div
                  key={supply.id}
                  onClick={() => openDetail(supply)}
                  className="bg-white border border-deep-brown/15 rounded-sm overflow-hidden hover:shadow-md group cursor-pointer"
                >
                  <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'color-mix(in oklab, var(--color-terracotta) 10%, transparent)' }}>
                    {supply.illustration_url && supply.illustration_url !== 'none' ? (
                      <img src={supply.illustration_url} alt={supply.name} className="w-full h-full object-contain p-4" />
                    ) : supply.image ? (
                      <img src={supply.image} alt={supply.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-serif font-medium text-center p-4 text-deep-brown/60">
                        {supply.name}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-deep-brown text-sm leading-tight mb-1 group-hover:text-terracotta">
                      {supply.name}
                    </h3>
                    <p className="text-xs text-deep-brown/50 line-clamp-2 mb-2">{supply.description}</p>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSupply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedSupply(null)}>
          <div className="bg-white rounded-sm shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in relative"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedSupply(null)}
              className="absolute top-3 right-3 text-deep-brown/40 hover:text-deep-brown z-10">
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: 'color-mix(in oklab, var(--color-terracotta) 10%, transparent)' }}>
              {selectedSupply.illustration_url && selectedSupply.illustration_url !== 'none' ? (
                <img src={selectedSupply.illustration_url} alt={selectedSupply.name} className="w-full h-full object-contain p-6" />
              ) : selectedSupply.image ? (
                <img src={selectedSupply.image} alt={selectedSupply.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-serif font-medium text-center p-6 text-deep-brown/60">
                  {selectedSupply.name}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-deep-brown">{selectedSupply.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium px-2 py-0.5 bg-sand rounded-sm text-deep-brown/70">
                    {getCategoryName(selectedSupply.category)}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-sm text-deep-brown/70" style={{ backgroundColor: 'color-mix(in oklab, var(--color-terracotta) 10%, transparent)' }}>
                    {selectedSupply.condition}
                  </span>
                </div>
              </div>

              <p className="text-sm text-deep-brown/70 leading-relaxed">{selectedSupply.description}</p>

              {selectedSupply.houseRules?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-deep-brown mb-1">House Rules</h3>
                  <ul className="text-sm text-deep-brown/60 space-y-1">
                    {selectedSupply.houseRules.map((rule: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-terracotta mt-0.5">•</span> {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contact the Lender — Signal info */}
              <div className="border-t border-deep-brown/15 pt-4">
                <h3 className="text-sm font-semibold text-deep-brown mb-3">Contact the Lender</h3>
                <div className="bg-sand/50 border border-deep-brown/10 rounded-sm p-4 space-y-2">
                  {selectedSupply.owner?.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-deep-brown">
                        {selectedSupply.owner.name}
                      </span>
                    </div>
                  )}
                  {selectedSupply.owner?.signalContact && (
                    <div className="flex items-center gap-2 text-sm text-deep-brown/70">
                      <MessageCircle className="h-4 w-4 text-terracotta shrink-0" />
                      <span>
                        Signal: <strong className="text-deep-brown">{selectedSupply.owner.signalContact}</strong>
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-deep-brown/40 mt-2">
                  Reach out on Signal to arrange borrowing this item.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
