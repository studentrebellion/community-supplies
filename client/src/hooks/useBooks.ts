import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { books as booksApi } from '@/lib/api';

interface Book {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  condition: string;
  houseRules: string[];
  ownerId: string;
  ownerName: string;
  ownerEmail: string | null;
  lentOut: boolean;
  lenderNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const transformBook = (raw: any): Book => ({
  id: raw.id,
  title: raw.title,
  author: raw.author,
  genre: raw.genre,
  condition: raw.condition,
  houseRules: raw.house_rules || [],
  ownerId: raw.owner_id,
  ownerName: raw.owner_name || 'Unknown',
  ownerEmail: raw.owner_email || null,
  lentOut: raw.lent_out || false,
  lenderNotes: raw.lender_notes,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

export function useBooks() {
  const queryClient = useQueryClient();

  const { data: books = [], isLoading: loading, error } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { books } = await booksApi.list();
      return books.map(transformBook);
    },
  });

  const addBooks = useMutation({
    mutationFn: async (newBooks: any[]) => {
      const { books } = await booksApi.create(newBooks);
      return books;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
    },
  });

  const updateBook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { book } = await booksApi.update(id, updates);
      return book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      await booksApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
    },
  });

  return { books, loading, error, addBooks, updateBook, deleteBook };
}

export function useMyBooks() {
  const { data: books = [], isLoading: loading, error } = useQuery({
    queryKey: ['my-books'],
    queryFn: async () => {
      const { books } = await booksApi.my();
      return books;
    },
  });

  return { books, loading, error };
}
