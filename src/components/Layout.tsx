import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Users, 
  Package, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: any) => void;
  user: User;
  onLogout: () => void;
}

export function Layout({ children, currentView, onNavigate, user, onLogout }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('layout.dashboard'), icon: LayoutDashboard },
    { id: 'invoices', label: t('layout.invoices'), icon: ReceiptText },
    { id: 'clients', label: t('layout.clients'), icon: Users },
    { id: 'products', label: t('layout.products'), icon: Package },
    { id: 'settings', label: t('layout.settings'), icon: SettingsIcon },
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-natural-bg flex overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-natural-sidebar text-[#f8f5f2] z-40 flex items-center justify-between px-4">
        <span className="font-serif italic tracking-tight text-xl">{t('app.title')}</span>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "bg-natural-sidebar text-[#f8f5f2] flex flex-col fixed inset-y-0 left-0 z-50 w-64 py-10 px-6 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:w-60",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-14 px-2">
          <span className="font-serif italic text-2xl tracking-tight">{t('app.title')}</span>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 hover:bg-white/10 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                currentView === item.id 
                  ? "bg-white/10 text-natural-accent" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                currentView === item.id ? "text-natural-accent" : "text-white/40 group-hover:text-white/60"
              )} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 mt-auto">
          <div className="px-2 mb-4">
            <button
              onClick={toggleLanguage}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('common.language')}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#f8f5f2]">{i18n.language}</span>
            </button>
          </div>
          <div className="flex items-center gap-3 px-2 py-4 mb-4 border-t border-white/10">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('layout.signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:pl-60 pt-16 lg:pt-0">
        <div className="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
