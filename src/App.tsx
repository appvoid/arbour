import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { ClientList } from './components/ClientList';
import { ProductList } from './components/ProductList';
import { Settings } from './components/Settings';
import { InvoiceForm } from './components/InvoiceForm';
import { LogIn, ReceiptText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

type View = 'dashboard' | 'invoices' | 'clients' | 'products' | 'settings' | 'invoice-form';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-natural-sidebar/10 border-t-natural-sage rounded-full animate-spin"></div>
          <p className="font-serif italic text-natural-text/40">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-bg px-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-natural-sage/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-natural-accent/5 rounded-full blur-3xl"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md w-full bg-white rounded-[40px] shadow-[0_20px_50px_rgba(61,74,64,0.08)] p-12 text-center border border-black/[0.02]"
        >
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-natural-sidebar rounded-[24px] flex items-center justify-center shadow-xl shadow-natural-sidebar/20 rotate-3 transition-transform hover:rotate-0">
              <ReceiptText className="w-10 h-10 text-[#f8f5f2]" />
            </div>
          </div>
          <h1 className="text-4xl font-serif text-[#1a1e1b] mb-3 font-normal tracking-tight">{t('app.title')}</h1>
          <p className="text-[#7a827c] mb-10 font-sans leading-relaxed px-4 text-sm">
            {t('app.subtitle')}
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-4 bg-[#2d332f] text-white py-4 rounded-[18px] hover:bg-[#1a1e1b] transition-all font-medium shadow-lg shadow-natural-sidebar/10 group"
          >
            <LogIn className="w-5 h-5 text-natural-accent group-hover:scale-110 transition-transform" />
            {t('app.signIn')}
          </button>
          <div className="mt-8 pt-8 border-t border-gray-50">
            <p className="text-[10px] uppercase tracking-widest text-[#99a19b] font-bold">{t('app.trustedBy')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const navigateToInvoiceForm = (id: string | null = null) => {
    setEditInvoiceId(id);
    setCurrentView('invoice-form');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} onNewInvoice={() => navigateToInvoiceForm()} onEditInvoice={navigateToInvoiceForm} onViewAll={() => setCurrentView('invoices')} />;
      case 'invoices': return <InvoiceList user={user} onNewInvoice={() => navigateToInvoiceForm()} onEditInvoice={navigateToInvoiceForm} />;
      case 'clients': return <ClientList user={user} />;
      case 'products': return <ProductList user={user} />;
      case 'settings': return <Settings user={user} />;
      case 'invoice-form': return <InvoiceForm user={user} invoiceId={editInvoiceId} onCancel={() => setCurrentView('invoices')} onSave={() => setCurrentView('invoices')} />;
      default: return <Dashboard user={user} onNewInvoice={() => navigateToInvoiceForm()} onEditInvoice={navigateToInvoiceForm} onViewAll={() => setCurrentView('invoices')} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      user={user} 
      onLogout={logOut}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView + (editInvoiceId || '')}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
