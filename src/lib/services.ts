import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Invoice, Client, Product, BusinessProfile, InvoiceStatus } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const businessService = {
  getProfile: async (userId: string): Promise<BusinessProfile | null> => {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? snap.data() as BusinessProfile : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },
  saveProfile: async (userId: string, profile: BusinessProfile) => {
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

export const clientService = {
  getClients: async (userId: string): Promise<Client[]> => {
    const path = `users/${userId}/clients`;
    try {
      const q = query(collection(db, 'users', userId, 'clients'), orderBy('name'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  saveClient: async (userId: string, client: Partial<Client>) => {
    const id = client.id || doc(collection(db, 'temp')).id;
    const path = `users/${userId}/clients/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'clients', id), { ...client, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  deleteClient: async (userId: string, clientId: string) => {
    const path = `users/${userId}/clients/${clientId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'clients', clientId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

export const productService = {
  getProducts: async (userId: string): Promise<Product[]> => {
    const path = `users/${userId}/products`;
    try {
      const q = query(collection(db, 'users', userId, 'products'), orderBy('name'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  saveProduct: async (userId: string, product: Partial<Product>) => {
    const id = product.id || doc(collection(db, 'temp')).id;
    const path = `users/${userId}/products/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'products', id), { ...product, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  deleteProduct: async (userId: string, productId: string) => {
    const path = `users/${userId}/products/${productId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

export const invoiceService = {
  getInvoices: async (userId: string): Promise<Invoice[]> => {
    const path = `users/${userId}/invoices`;
    try {
      const q = query(collection(db, 'users', userId, 'invoices'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  saveInvoice: async (userId: string, invoice: Partial<Invoice>) => {
    const id = invoice.id || doc(collection(db, 'temp')).id;
    const path = `users/${userId}/invoices/${id}`;
    try {
      const data = {
        ...invoice,
        id,
        updatedAt: serverTimestamp(),
        createdAt: invoice.createdAt || serverTimestamp(),
      };
      await setDoc(doc(db, 'users', userId, 'invoices', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  deleteInvoice: async (userId: string, invoiceId: string) => {
    const path = `users/${userId}/invoices/${invoiceId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'invoices', invoiceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
