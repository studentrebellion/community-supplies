import { useQuery } from '@tanstack/react-query';
import { supplies as suppliesApi } from '@/lib/api';

export function useSupplies() {
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['supplies'],
    queryFn: async () => {
      const { supplies } = await suppliesApi.list();
      return supplies.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        condition: item.condition,
        partyTypes: item.party_types || [],
        dateAvailable: item.date_available || new Date().toISOString().split('T')[0],
        location: item.location,
        neighborhood: item.neighborhood,
        crossStreets: item.cross_streets,
        contactEmail: item.contact_email,
        image: item.image_url,
        images: item.images || (item.image_url ? [item.image_url] : []),
        illustration_url: item.illustration_url,
        houseRules: item.house_rules || [],
        ownerId: item.owner_id,
        lentOut: item.lent_out || false,
        lenderNotes: item.lender_notes,
        owner: {
          name: item.owner_name || 'Unknown',
          zipCode: item.owner_zip_code || '00000',
          location: `${item.owner_zip_code || 'Unknown'} area`,
          signalContact: item.owner_signal_contact || null,
          avatar: '',
        },
      }));
    },
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000, // Poll every 5s so new illustrations appear automatically
    retry: 1,
  });

  return { supplies: data || [], loading, error, refetch };
}
