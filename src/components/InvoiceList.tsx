import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { invoiceService, clientService, businessService } from '../lib/services';
import { Invoice, Client, BusinessProfile } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Search, Filter, MoreVertical, Trash2, Eye, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { useTranslation } from 'react-i18next';

interface InvoiceListProps {
  user: User;
  onNewInvoice: () => void;
  onEditInvoice: (id: string) => void;
}

export function InvoiceList({ user, onNewInvoice, onEditInvoice }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const fetchData = async () => {
    setLoading(true);
    const [invoicesData, clientsData, profileData] = await Promise.all([
      invoiceService.getInvoices(user.uid),
      clientService.getClients(user.uid),
      businessService.getProfile(user.uid)
    ]);
    setInvoices(invoicesData);
    setClients(clientsData);
    setProfile(profileData);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await invoiceService.deleteInvoice(user.uid, id);
    setConfirmDeleteId(null);
    fetchData();
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-[#1a1e1b] font-normal">{t('invoices.title')}</h1>
          <p className="text-natural-text/60 mt-1 font-sans">{t('invoices.subtitle')}</p>
        </div>
        <button
          onClick={onNewInvoice}
          className="btn-natural-primary shadow-lg shadow-natural-accent/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('invoices.newInvoice')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-[0_4px_12px_rgba(61,74,64,0.05)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99a19b]" />
          <input
            type="text"
            placeholder={t('invoices.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none transition-all font-sans"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5">
        <div className="w-full">
          <div>
            <div className="grid grid-cols-6 pb-4 border-b border-gray-100 text-[11px] uppercase tracking-[0.5px] text-[#99a19b] font-semibold">
              <span className="col-span-2">{t('invoices.table.client')} & ID</span>
              <span>{t('invoices.table.date')}</span>
              <span>{t('invoices.table.amount')}</span>
              <span>{t('invoices.table.status')}</span>
              <span className="text-right">{t('common.actions')}</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="py-12 text-center text-[#99a19b]">{t('common.loading')}</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-16 text-center text-natural-text/40 font-serif italic">
                  {search ? t('invoices.empty') : t('invoices.empty')}
                </div>
              ) : (
                filteredInvoices.map((invoice, i) => (
                  <motion.div 
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-6 py-5 group hover:bg-natural-bg/30 px-4 rounded-xl transition-all items-center"
                  >
                    <div className="col-span-2 flex flex-col justify-center">
                      <span className="font-bold text-[#1a1e1b] font-sans">#ID-{invoice.id.slice(0, 4)}</span>
                      <span className="text-xs text-[#99a19b] mt-0.5">{invoice.number}</span>
                    </div>
                    <div className="flex items-center text-sm text-[#2d332f] font-sans">
                      {formatDate(invoice.date)}
                    </div>
                    <div className="flex items-center text-lg font-serif font-bold text-natural-text">
                      {formatCurrency(invoice.total)}
                    </div>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${invoice.status === 'paid' ? 'bg-[#e9f2eb] text-[#4a6d51]' : 
                          invoice.status === 'sent' ? 'bg-[#fdf5e6] text-[#b08d4b]' : 
                          invoice.status === 'overdue' ? 'bg-[#fff1f1] text-[#c46464]' : 
                          'bg-gray-100 text-gray-400'}`}>
                        {t(`dashboard.overview.${invoice.status}`) || invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {profile && clients.find(c => c.id === invoice.clientId) && (
                        <PDFDownloadLink
                          document={<InvoicePDF invoice={invoice} client={clients.find(c => c.id === invoice.clientId)!} profile={profile} />}
                          fileName={`${invoice.number}.pdf`}
                          className="p-2 text-[#99a19b] hover:text-natural-accent hover:bg-natural-accent/5 rounded-lg transition-all"
                        >
                          {({ loading }) => (
                            <Download className="w-5 h-5" />
                          )}
                        </PDFDownloadLink>
                      )}
                      <button 
                        onClick={() => onEditInvoice(invoice.id)}
                        className="p-2 text-[#99a19b] hover:text-natural-accent hover:bg-natural-accent/5 rounded-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {confirmDeleteId === invoice.id ? (
                        <button 
                          onClick={() => handleDelete(invoice.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                        >
                          {t('common.delete')}?
                        </button>
                      ) : (
                        <button 
                          onClick={() => setConfirmDeleteId(invoice.id)}
                          className="p-2 text-[#99a19b] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
