import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Index from '@/pages/Index';
import MySupplies from '@/pages/MySupplies';
import MyBooks from '@/pages/MyBooks';
import Profile from '@/pages/Profile';
import Steward from '@/pages/Steward';
import StartCommunity from '@/pages/StartCommunity';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-supplies" element={<MySupplies />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/steward" element={<Steward />} />
            <Route path="/start-community" element={<StartCommunity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
