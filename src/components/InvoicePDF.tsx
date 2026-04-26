import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Invoice, Client, BusinessProfile } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import i18n from '../i18n';

// Font registrations can be done here if needed
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    paddingBottom: 120, // ensure space for footer
  },
  logo: {
    width: 120,
    height: 120,
    objectFit: 'contain',
    marginBottom: 10,
  },
  logoCenter: {
    width: 120,
    height: 120,
    objectFit: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },
  logoRight: {
    width: 120,
    height: 120,
    objectFit: 'contain',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  text: {
    color: '#4B5563',
    marginBottom: 2,
  },
  section: {
    marginBottom: 30,
    flexDirection: 'row',
  },
  billTo: {
    flex: 1,
  },
  invoiceDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderCell: {
    color: '#9CA3AF',
    fontSize: 10,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
  },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  itemTitle: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  itemDesc: {
    color: '#6B7280',
    fontSize: 9,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totals: {
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    color: '#6B7280',
  },
  totalValue: {
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  grandTotalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 20,
    flexDirection: 'row',
  },
  footerBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLeft: { flex: 1 },
  footerCenter: { flex: 1, alignItems: 'center' },
  footerRight: { flex: 1, alignItems: 'flex-end' },
  notes: {
    color: '#6B7280',
    fontSize: 9,
  }
});

interface InvoicePDFProps {
  invoice: Invoice;
  client: Client;
  profile: BusinessProfile;
}

export function InvoicePDF({ invoice, client, profile }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {profile.logoUrl && profile.logoPosition === 'top_left' && <Image src={profile.logoUrl} style={styles.logo} />}
            <Text style={styles.title}>{i18n.t('pdf.title')}</Text>
            <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
          </View>
          <View style={styles.headerCenter}>
            {profile.logoUrl && profile.logoPosition === 'top_center' && <Image src={profile.logoUrl} style={styles.logoCenter} />}
          </View>
          <View style={styles.headerRight}>
            {profile.logoUrl && profile.logoPosition === 'top_right' && <Image src={profile.logoUrl} style={styles.logoRight} />}
            <Text style={styles.businessName}>{profile.name || 'Your Business Name'}</Text>
            {profile.address && <Text style={styles.text}>{profile.address}</Text>}
            {profile.taxId && <Text style={styles.text}>{i18n.t('pdf.taxId')} {profile.taxId}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>{i18n.t('pdf.billTo')}</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.address && <Text style={styles.text}>{client.address}</Text>}
            {client.taxId && <Text style={styles.text}>{i18n.t('pdf.taxId')} {client.taxId}</Text>}
          </View>
          <View style={styles.invoiceDetails}>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 80, color: '#6B7280' }}>{i18n.t('pdf.issueDate')}</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatDate(invoice.date)}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 80, color: '#6B7280' }}>{i18n.t('pdf.dueDate')}</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>{i18n.t('pdf.description')}</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>{i18n.t('pdf.rate')}</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>{i18n.t('pdf.qty')}</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>{i18n.t('pdf.amount')}</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                {/* Product/service notes could go here if they existed */}
              </View>
              <Text style={styles.col2}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{i18n.t('pdf.subtotal')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{i18n.t('pdf.tax')} ({invoice.taxRate}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
              </View>
            )}
            
            {(invoice.adjustments || []).map((adj) => {
              const adjAmount = adj.type === 'percentage' ? (invoice.subtotal || 0) * (adj.value / 100) : adj.value;
              return (
                <View key={adj.id} style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{adj.name} {adj.type === 'percentage' ? `(${adj.value}%)` : ''}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(adjAmount)}</Text>
                </View>
              );
            })}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{i18n.t('pdf.total')}</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerBorder} />
          <View style={styles.footerLeft}>
            {profile.logoUrl && profile.logoPosition === 'bottom_left' && <Image src={profile.logoUrl} style={styles.logo} />}
            {invoice.notes && (
              <View>
                <Text style={styles.sectionTitle}>{i18n.t('pdf.notes')}</Text>
                <Text style={styles.notes}>{invoice.notes}</Text>
              </View>
            )}
          </View>
          <View style={styles.footerCenter}>
            {profile.logoUrl && profile.logoPosition === 'bottom_center' && <Image src={profile.logoUrl} style={styles.logoCenter} />}
          </View>
          <View style={styles.footerRight}>
            {profile.logoUrl && profile.logoPosition === 'bottom_right' && <Image src={profile.logoUrl} style={styles.logoRight} />}
          </View>
        </View>
      </Page>
    </Document>
  );
}
