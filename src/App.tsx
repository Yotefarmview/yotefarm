
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { motion } from 'framer-motion';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import i18n from './i18n';
import Layout from './components/layout/Layout';

// Pages
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import MapEditor from './pages/MapEditor';
import AdvancedMapEditor from './pages/AdvancedMapEditor';
import Applications from './pages/Applications';
import Team from './pages/Team';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Router>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen bg-background text-foreground"
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/fazendas" element={<Layout><Farms /></Layout>} />
                <Route path="/mapa-editor" element={<Layout><MapEditor /></Layout>} />
                <Route path="/mapa-avancado" element={<Layout><AdvancedMapEditor /></Layout>} />
                <Route path="/aplicacoes" element={<Layout><Applications /></Layout>} />
                <Route path="/equipe" element={<Layout><Team /></Layout>} />
                <Route path="/configuracoes" element={<Layout><Settings /></Layout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </motion.div>
          </Router>
        </I18nextProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
