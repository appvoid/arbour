import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { clientService, productService, invoiceService, businessService } from '../lib/services';
import { Invoice, Client, Product, InvoiceItem, InvoiceStatus, BusinessProfile } from '../types';
import { Plus, Trash2, ArrowLeft, Save, AlertCircle, ShoppingCart, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { useTranslation } from 'react-i18next';

interface InvoiceFormProps {
  user: User;
  invoiceId: string | null;
  onCancel: () => void;
  onSave: () => void;
}

export function InvoiceForm({ user, invoiceId, onCancel, onSave }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    number: `INV-${Math.floor(1000 + Math.random() * 9000).toString()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: InvoiceStatus.DRAFT,
    clientId: '',
    items: [],
    taxRate: 0,
    taxAmount: 0,
    subtotal: 0,
    total: 0,
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [clientsData, productsData, profileData] = await Promise.all([
        clientService.getClients(user.uid),
        productService.getProducts(user.uid),
        businessService.getProfile(user.uid)
      ]);
      setClients(clientsData);
      setProducts(productsData);
      setProfile(profileData);

      if (invoiceId) {
        const invoices = await invoiceService.getInvoices(user.uid);
        const existing = invoices.find(i => i.id === invoiceId);
        if (existing) setInvoice(existing);
      }
      setLoading(false);
    };
    fetchData();
  }, [user.uid, invoiceId]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      productId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    };
    setInvoice({ ...invoice, items: [...(invoice.items || []), newItem] });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(invoice.items || [])];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.name = product.name;
        item.unitPrice = product.unitPrice;
      }
    }
    
    item.amount = item.quantity * item.unitPrice;
    newItems[index] = item;
    calculateTotals(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = (invoice.items || []).filter((_, i) => i !== index);
    calculateTotals(newItems);
  };

  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = subtotal * ((invoice.taxRate || 0) / 100);
    const total = subtotal + taxAmount;
    setInvoice({ ...invoice, items, subtotal, taxAmount, total });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice.clientId || !invoice.items?.length) {
      alert('Please select a client and add at least one item.');
      return;
    }
    setSaving(true);
    try {
      await invoiceService.saveInvoice(user.uid, invoice);
      onSave();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find(c => c.id === invoice.clientId);

  if (loading) return <div className="h-64 flex items-center justify-center text-natural-text/60">{t('common.loading')}</div>;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 hover:bg-white rounded-full transition-all text-natural-text/40 hover:text-natural-text hover:shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-serif text-[#1a1e1b] font-normal tracking-tight">
            {invoiceId ? t('invoices.editTitle') : t('invoices.newTitle')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={onCancel} className="px-6 py-3 text-sm font-medium text-[#7a827c] hover:text-[#1a1e1b] transition-colors">
            {t('invoices.discard')}
          </button>
          
          {invoiceId && profile && selectedClient && (
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice as Invoice} client={selectedClient} profile={profile} />}
              fileName={`${invoice.number}.pdf`}
              className="px-6 py-3 text-sm font-medium text-natural-accent bg-natural-accent/10 hover:bg-natural-accent/20 rounded-xl transition-all flex items-center gap-2"
            >
              {({ loading }) => (
                <>
                  <Download className="w-4 h-4" />
                  {loading ? t('common.loading') : t('invoices.downloadPdf')}
                </>
              )}
            </PDFDownloadLink>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-natural-primary shadow-lg shadow-natural-accent/20 flex items-center gap-2 group"
          >
            {saving ? t('invoices.protecting') : t('invoices.protect')}
            {!saving && <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-serif text-[#1a1e1b] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-natural-sage/60" />
                  {t('invoices.serviceRecord')}
                </h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-natural-accent text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-all px-4 py-2 bg-natural-accent/5 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  {t('invoices.addPosition')}
                </button>
              </div>

              <div className="space-y-4">
                {(invoice.items || []).map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="grid grid-cols-12 gap-5 items-end group bg-natural-bg/5 p-6 rounded-2xl border border-transparent hover:border-natural-sage/20 transition-all"
                  >
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('invoices.workItem')}</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-natural-sage/20 appearance-none cursor-pointer"
                      >
                        <option value="">{t('invoices.selectProduct')}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1 text-center block">{t('invoices.qty')}</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-3 bg-white border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-natural-sage/20 text-center"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3 space-y-2 text-right">
                      <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1 text-right block">{t('invoices.rate')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-natural-sage/20 text-right"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3 flex items-center justify-between gap-4 h-full">
                      <div className="text-right flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest block">{t('invoices.rowTotal')}</label>
                        <div className="w-full py-3">
                          <p className="font-serif font-bold text-natural-text text-xl">{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        className="p-3 bg-white border border-transparent rounded-xl text-[#99a19b] hover:text-red-500 hover:bg-red-50 transition-all self-end mb-0.5"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {(invoice.items || []).length === 0 && (
                  <div 
                    onClick={addItem}
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-natural-sage/20 rounded-2xl cursor-pointer hover:bg-natural-bg/10 transition-all text-natural-text/40 group"
                  >
                    <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-serif italic">{t('invoices.emptyLedger')}</p>
                  </div>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-[1.5px] mb-3 block">{t('invoices.conditions')}</label>
                <textarea
                  value={invoice.notes}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  placeholder={t('invoices.conditionsPlaceholder')}
                  rows={4}
                  className="w-full px-6 py-5 bg-natural-bg/30 border border-transparent rounded-[24px] focus:bg-white focus:ring-2 focus:ring-natural-sage/10 outline-none transition-all resize-none font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Sidebar Status Area */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('invoices.documentIndex')}</label>
                  <input
                    required
                    type="text"
                    value={invoice.number}
                    onChange={(e) => setInvoice({ ...invoice, number: e.target.value })}
                    className="w-full px-5 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white outline-none font-bold text-natural-text"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('invoices.issuedOn')}</label>
                  <input
                    required
                    type="date"
                    value={invoice.date}
                    onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                    className="w-full px-5 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('invoices.validUntil')}</label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                    className="w-full px-5 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('invoices.recipient')}</label>
                  <select
                    required
                    value={invoice.clientId}
                    onChange={(e) => setInvoice({ ...invoice, clientId: e.target.value })}
                    className="w-full px-5 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="">{t('invoices.selectClient')}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('invoices.filingStatus')}</label>
                  <select
                    value={invoice.status}
                    onChange={(e) => setInvoice({ ...invoice, status: e.target.value as InvoiceStatus })}
                    className="w-full px-5 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white outline-none capitalize cursor-pointer"
                  >
                    {Object.values(InvoiceStatus).map(s => (
                      <option key={s} value={s}>{t(`dashboard.overview.${s}`) || s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 shadow-[0_12px_40px_rgba(61,74,64,0.06)] border border-black/5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#99a19b] font-medium tracking-wide">{t('invoices.subtotal')}</span>
                <span className="font-sans font-semibold text-natural-text">{formatCurrency(invoice.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#99a19b] font-medium tracking-wide text-xs uppercase">{t('invoices.adjustments')}</span>
                  <div className="flex items-center bg-natural-bg rounded-lg px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={invoice.taxRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        const taxAmount = (invoice.subtotal || 0) * (rate / 100);
                        setInvoice({ ...invoice, taxRate: rate, taxAmount, total: (invoice.subtotal || 0) + taxAmount });
                      }}
                      className="w-8 bg-transparent text-center text-xs outline-none font-bold"
                    />
                    <span className="text-[10px] opacity-40">%</span>
                  </div>
                </div>
                <span className="font-sans text-natural-text/60">{formatCurrency(invoice.taxAmount || 0)}</span>
              </div>
              <div className="pt-6 mt-2 border-t border-gray-100 flex justify-between items-end">
                <span className="text-[11px] font-bold text-natural-sage uppercase tracking-widest pb-1">{t('invoices.finalBalance')}</span>
                <span className="text-3xl font-serif text-natural-text font-normal">{formatCurrency(invoice.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
