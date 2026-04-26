import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { invoiceService } from '../lib/services';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  user: User;
  onNewInvoice: () => void;
  onEditInvoice: (id: string) => void;
  onViewAll: () => void;
}

export function Dashboard({ user, onNewInvoice, onEditInvoice, onViewAll }: DashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchInvoices = async () => {
      const data = await invoiceService.getInvoices(user.uid);
      setInvoices(data);
      setLoading(false);
    };
    fetchInvoices();
  }, [user.uid]);

  const [marginTimeframe, setMarginTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const stats = {
    total: invoices.reduce((acc, inv) => acc + inv.total, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.total, 0),
    pending: invoices.filter(i => i.status === 'sent').reduce((acc, inv) => acc + inv.total, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((acc, inv) => acc + inv.total, 0),
  };

  const calcMargins = (invs: Invoice[]) => {
    let revenue = 0;
    let cost = 0;
    invs.forEach(inv => {
      if (inv.status !== 'draft') {
        inv.items.forEach(item => {
          revenue += item.amount;
          cost += (item.costPrice || 0) * item.quantity;
        });
      }
    });
    if (revenue === 0) return { profit: 0, margin: 0 };
    const profit = revenue - cost;
    return { profit, margin: (profit / revenue) * 100 };
  };

  const timeframeInvoices = invoices.filter(i => {
    const d = new Date(i.date);
    const now = new Date();
    switch (marginTimeframe) {
      case 'day':
        return d.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      case 'month':
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'year':
        return d.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const margins = calcMargins(timeframeInvoices);

  if (loading) return <div className="h-64 flex items-center justify-center text-natural-text/60">{t('common.loading')}</div>;

  const timeframeLabel = {
    day: t('dashboard.overview.profitDay', 'Profit (Today)'),
    week: t('dashboard.overview.profitWeek', 'Profit (7d)'),
    month: t('dashboard.overview.profitMonth', 'Profit (Month)'),
    year: t('dashboard.overview.profitYear', 'Profit (Year)')
  }[marginTimeframe];

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-[#1a1e1b] font-normal">{t('dashboard.title')}</h1>
          <p className="text-natural-text/60 mt-1 font-sans">{t('dashboard.welcome', { name: user.displayName?.split(' ')[0] || 'Partner' })}</p>
        </div>
        <button
          onClick={onNewInvoice}
          className="btn-natural-primary shadow-lg shadow-natural-accent/20 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.newInvoice')}
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('dashboard.overview.totalOutstanding', 'Total'), value: stats.total },
          { label: t('dashboard.overview.draft', 'Draft'), value: stats.pending },
          { label: t('dashboard.overview.overdue', 'Overdue'), value: stats.overdue },
          { label: timeframeLabel, value: margins.profit, suffix: margins.margin.toFixed(1) + '%', isMargin: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label + i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="natural-card p-6 xl:p-8 relative flex flex-col justify-between overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4 gap-2">
              <p className="text-[11px] uppercase tracking-[1px] text-[#7a827c] font-semibold line-clamp-2">{stat.label}</p>
              {stat.isMargin && (
                <div className="shrink-0 bg-white border border-black/5 rounded-md overflow-hidden dropdown-container shadow-sm">
                  <select 
                    value={marginTimeframe}
                    onChange={(e) => setMarginTimeframe(e.target.value as any)}
                    className="text-[10px] bg-transparent border-none outline-none font-bold cursor-pointer pl-2 pr-6 py-1 text-[#7a827c] appearance-none hover:bg-gray-50 focus:ring-0 focus:outline-none w-full min-w-[70px]"
                  >
                    <option value="day">{t('common.day', 'Today')}</option>
                    <option value="week">{t('common.week', '7 Days')}</option>
                    <option value="month">{t('common.month', 'Month')}</option>
                    <option value="year">{t('common.year', 'Year')}</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex flex-col xl:flex-row xl:items-baseline gap-2 mt-auto">
              <p className="text-3xl font-serif text-natural-text truncate max-w-[100%]">{formatCurrency(stat.value)}</p>
              {stat.suffix && (
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 w-max mb-1 xl:mb-0 ${margins.profit >= 0 ? 'bg-natural-sage/10 text-natural-sage' : 'bg-red-500/10 text-red-600'}`}>
                   {stat.suffix}
                 </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif text-[#1a1e1b]">{t('dashboard.recentInvoices')}</h2>
          <button onClick={onViewAll} className="text-natural-accent text-sm font-medium hover:opacity-80 underline underline-offset-4 decoration-natural-accent/30 transition-all">{t('dashboard.viewAll')}</button>
        </div>
        
        <div className="w-full flex-1">
          <div>
            <div className="grid grid-cols-4 pb-4 border-b border-gray-100 text-[11px] uppercase tracking-[0.5px] text-[#99a19b] font-semibold">
              <span>{t('invoices.table.client')} & ID</span>
              <span>{t('invoices.table.date')}</span>
              <span>{t('invoices.table.amount')}</span>
              <span className="text-right">{t('invoices.table.status')}</span>
            </div>
            
            <div className="divide-y divide-gray-50 mt-2">
              {invoices.length === 0 ? (
                <div className="py-16 text-center text-natural-text/40 font-serif italic">
                  {t('invoices.empty')}
                </div>
              ) : (
                invoices.slice(0, 5).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="grid grid-cols-4 py-5 cursor-pointer hover:bg-natural-bg/30 px-3 rounded-xl transition-all group items-center"
                    onClick={() => onEditInvoice(invoice.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#1a1e1b] font-sans">#ID-{invoice.id.slice(0, 4)}</span>
                      <span className="text-xs text-[#99a19b] mt-0.5">{invoice.number}</span>
                    </div>
                    <div className="flex items-center text-sm text-[#2d332f] font-sans">
                      {formatDate(invoice.date)}
                    </div>
                    <div className="flex items-center text-lg font-serif font-bold text-natural-text">
                      {formatCurrency(invoice.total)}
                    </div>
                    <div className="flex items-center justify-end">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${invoice.status === 'paid' ? 'bg-[#e9f2eb] text-[#4a6d51]' : 
                          invoice.status === 'sent' ? 'bg-[#fdf5e6] text-[#b08d4b]' : 
                          invoice.status === 'overdue' ? 'bg-[#fff1f1] text-[#c46464]' : 
                          'bg-gray-100 text-gray-400'}`}>
                        {t(`dashboard.overview.${invoice.status}`) || invoice.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
