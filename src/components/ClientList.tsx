import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { clientService } from '../lib/services';
import { Client } from '../types';
import { Plus, Search, Trash2, Mail, MapPin, Phone, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface ClientListProps {
  user: User;
}

export function ClientList({ user }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchClients();
  }, [user.uid]);

  const fetchClients = async () => {
    setLoading(true);
    const data = await clientService.getClients(user.uid);
    setClients(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await clientService.deleteClient(user.uid, id);
    setConfirmDeleteId(null);
    fetchClients();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient?.name || !editingClient?.email) return;
    await clientService.saveClient(user.uid, editingClient);
    setIsModalOpen(false);
    fetchClients();
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-[#1a1e1b] font-normal">{t('clients.title')}</h1>
          <p className="text-natural-text/60 mt-1 font-sans">{t('clients.subtitle')}</p>
        </div>
        <button
          onClick={() => { setEditingClient({}); setIsModalOpen(true); }}
          className="btn-natural-primary shadow-lg shadow-natural-accent/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('clients.newClient')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-[0_4px_12px_rgba(61,74,64,0.05)]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99a19b]" />
          <input
            type="text"
            placeholder={t('clients.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none transition-all font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-16 text-natural-text/40 font-serif italic">{t('clients.empty')}</div>
        ) : (
          filteredClients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[32px] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(61,74,64,0.08)] transition-all relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-natural-bg rounded-2xl flex items-center justify-center text-natural-sidebar font-serif font-bold text-2xl uppercase">
                  {client.name[0]}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                    className="p-2 text-[#99a19b] hover:text-natural-accent hover:bg-natural-accent/5 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {confirmDeleteId === client.id ? (
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                    >
                      {t('common.delete')}?
                    </button>
                  ) : (
                    <button 
                      onClick={() => setConfirmDeleteId(client.id)}
                      className="p-2 text-[#99a19b] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-serif text-[#1a1e1b] text-2xl mb-4 font-normal">{client.name}</h3>
              <div className="space-y-3 text-sm text-[#7a827c]">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 opacity-50" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 opacity-50" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 opacity-50 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 leading-relaxed">{client.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-natural-sidebar/20 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-black/5"
          >
            <h2 className="text-3xl font-serif text-[#1a1e1b] mb-8 font-normal">
              {editingClient?.id ? t('clients.editTitle') : t('clients.newTitle')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('clients.name')}</label>
                <input
                  required
                  type="text"
                  value={editingClient?.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('clients.email')}</label>
                <input
                  required
                  type="email"
                  value={editingClient?.email || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  className="w-full px-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('clients.phone')}</label>
                <input
                  type="text"
                  value={editingClient?.phone || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('clients.address')}</label>
                <textarea
                  value={editingClient?.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full px-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-100 rounded-xl font-medium text-[#7a827c] hover:bg-natural-bg transition-all"
                >
                  {t('clients.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-natural-primary"
                >
                  {t('clients.save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
