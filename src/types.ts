export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export type LogoPosition = 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';

export interface Adjustment {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface BusinessProfile {
  name: string;
  email: string;
  address?: string;
  taxId?: string;
  logoUrl?: string;
  logoPosition?: LogoPosition;
  currency: string;
  defaultAdjustments?: Adjustment[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
  taxId?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  costPrice?: number;
  imageUrl?: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  clientId: string;
  items: InvoiceItem[];
  taxRate: number; // Keeping for backward compatibility
  taxAmount: number;
  adjustments?: Adjustment[];
  subtotal: number;
  total: number;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}
