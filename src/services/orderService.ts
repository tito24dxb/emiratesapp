import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment
} from 'firebase/firestore';
import { incrementProductSales, decrementStock } from './marketplaceService';

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  product_title: string;
  product_type: 'digital' | 'physical' | 'service';
  product_image?: string;
  quantity: number;
  price: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_intent_id?: string;
  payment_method?: string;
  delivery_status: 'pending' | 'delivered' | 'failed';
  digital_download_url?: string;
  digital_download_expires?: any;
  download_count?: number;
  max_downloads: number;
  created_at: any;
  completed_at?: any;
  metadata?: {
    stripe_customer_id?: string;
    stripe_charge_id?: string;
    buyer_ip?: string;
  };
}

export interface CreateOrderData {
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  product_title: string;
  product_type: 'digital' | 'physical' | 'service';
  product_image?: string;
  quantity: number;
  price: number;
  currency: string;
}

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const createOrder = async (orderData: CreateOrderData): Promise<string> => {
  try {
    const orderRef = doc(collection(db, 'marketplace_orders'));
    const orderNumber = generateOrderNumber();

    const order: Omit<MarketplaceOrder, 'id'> = {
      order_number: orderNumber,
      buyer_id: orderData.buyer_id,
      buyer_name: orderData.buyer_name,
      buyer_email: orderData.buyer_email,
      seller_id: orderData.seller_id,
      seller_name: orderData.seller_name,
      seller_email: orderData.seller_email,
      product_id: orderData.product_id,
      product_title: orderData.product_title,
      product_type: orderData.product_type,
      product_image: orderData.product_image,
      quantity: orderData.quantity,
      price: orderData.price,
      total_amount: orderData.price * orderData.quantity,
      currency: orderData.currency,
      payment_status: 'pending',
      delivery_status: 'pending',
      download_count: 0,
      max_downloads: 5,
      created_at: Timestamp.now(),
      metadata: {}
    };

    await setDoc(orderRef, order);
    console.log('Order created:', orderRef.id, orderNumber);
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<MarketplaceOrder | null> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() } as MarketplaceOrder;
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  paymentIntentId?: string,
  paymentMethod?: string
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const updates: any = {
      payment_status: paymentStatus
    };

    if (paymentIntentId) {
      updates.payment_intent_id = paymentIntentId;
    }

    if (paymentMethod) {
      updates.payment_method = paymentMethod;
    }

    if (paymentStatus === 'completed') {
      updates.completed_at = Timestamp.now();
    }

    await updateDoc(orderRef, updates);
    console.log('Order payment status updated:', orderId, paymentStatus);
  } catch (error) {
    console.error('Error updating order payment status:', error);
    throw error;
  }
};

export const updateOrderDeliveryStatus = async (
  orderId: string,
  deliveryStatus: 'pending' | 'delivered' | 'failed'
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    await updateDoc(orderRef, {
      delivery_status: deliveryStatus
    });
    console.log('Order delivery status updated:', orderId, deliveryStatus);
  } catch (error) {
    console.error('Error updating order delivery status:', error);
    throw error;
  }
};

export const setDigitalDownloadUrl = async (
  orderId: string,
  downloadUrl: string,
  expiresInHours: number = 72
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await updateDoc(orderRef, {
      digital_download_url: downloadUrl,
      digital_download_expires: Timestamp.fromDate(expiresAt),
      delivery_status: 'delivered'
    });

    console.log('Digital download URL set for order:', orderId);
  } catch (error) {
    console.error('Error setting download URL:', error);
    throw error;
  }
};

export const incrementDownloadCount = async (orderId: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    await updateDoc(orderRef, {
      download_count: increment(1)
    });
    console.log('Download count incremented for order:', orderId);
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
};

export const canDownload = async (orderId: string): Promise<boolean> => {
  try {
    const order = await getOrder(orderId);
    if (!order) return false;

    if (order.payment_status !== 'completed') return false;

    if (order.download_count && order.download_count >= order.max_downloads) {
      return false;
    }

    if (order.digital_download_expires) {
      const expiresAt = order.digital_download_expires.toDate();
      if (new Date() > expiresAt) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking download permission:', error);
    return false;
  }
};

export const getMyOrders = async (userId: string): Promise<MarketplaceOrder[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('buyer_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceOrder[];
  } catch (error) {
    console.error('Error getting my orders:', error);
    return [];
  }
};

export const getMySales = async (userId: string): Promise<MarketplaceOrder[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('seller_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceOrder[];
  } catch (error) {
    console.error('Error getting my sales:', error);
    return [];
  }
};

export const completeOrder = async (
  orderId: string,
  productId: string,
  productType: 'digital' | 'physical' | 'service',
  quantity: number = 1
): Promise<void> => {
  try {
    await updateOrderPaymentStatus(orderId, 'completed');

    await incrementProductSales(productId);

    if (productType === 'physical') {
      await decrementStock(productId, quantity);
    }

    console.log('Order completed:', orderId);
  } catch (error) {
    console.error('Error completing order:', error);
    throw error;
  }
};

export const getOrderByPaymentIntent = async (
  paymentIntentId: string
): Promise<MarketplaceOrder | null> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(ordersRef, where('payment_intent_id', '==', paymentIntentId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as MarketplaceOrder;
    }
    return null;
  } catch (error) {
    console.error('Error getting order by payment intent:', error);
    return null;
  }
};
