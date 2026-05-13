
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface CachedProduct {
  barcode?: string;
  productName: string;
  ingredients: string[];
  isEdible: boolean;
  lastAnalyzed: string;
}

export async function getCachedProductByBarcode(barcode: string): Promise<CachedProduct | null> {
  try {
    const docRef = doc(db, 'products', barcode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CachedProduct;
    }
    return null;
  } catch (error) {
    console.error("Error fetching cached product:", error);
    return null;
  }
}

export async function getCachedProductByName(name: string): Promise<CachedProduct | null> {
  try {
    const q = query(collection(db, 'products'), where('productName', '==', name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as CachedProduct;
    }
    return null;
  } catch (error) {
    console.error("Error searching cached product by name:", error);
    return null;
  }
}

export function normalizeId(barcode?: string, name?: string): string {
  if (barcode) return barcode.trim();
  // If no barcode, create a stable ID from the name by removing spaces, special chars and normalizing
  return (name || 'unknown')
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF]/g, '') // Keep letters/numbers and Hebrew chars
    .trim();
}

export async function cacheProduct(product: CachedProduct) {
  try {
    const id = normalizeId(product.barcode, product.productName);
    // Firestore doesn't allow 'undefined' values. 
    // We create a clean copy without optional undefined fields.
    const cleanProduct = JSON.parse(JSON.stringify(product));
    await setDoc(doc(db, 'products', id), cleanProduct);
  } catch (error) {
    console.error("Error caching product:", error);
  }
}
