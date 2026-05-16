import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, CartItem } from '../types';
import { 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShoppingCart,
  Zap,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  writeBatch, 
  doc, 
  getDoc,
  onSnapshot
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  LIST = 'list',
  GET = 'get',
}

export default function POS() {
  const { outletId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (!outletId) return;

    // Listen to changes in stocks for this outlet
    const stocksQuery = query(collection(db, 'stocks'), where('outletId', '==', outletId));
    const unsubscribe = onSnapshot(stocksQuery, async (stocksSnap) => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const catsSnap = await getDocs(collection(db, 'categories'));
        
        const catMap = new Map();
        catsSnap.forEach(d => catMap.set(d.id, d.data().name));

        const stockMap = new Map();
        stocksSnap.forEach(d => stockMap.set(d.data().productId, d.data().qty));

        const prodList: Product[] = [];
        productsSnap.forEach(d => {
          const data = d.data();
          prodList.push({
            id: d.id,
            name: data.name,
            sku: data.sku,
            category_id: data.categoryId,
            category_name: catMap.get(data.categoryId) || 'Unknown',
            price: data.price,
            cost: data.cost,
            qty: stockMap.get(d.id) || 0
          });
        });
        setProducts(prodList);
        setLoading(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'products/stocks');
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'stocks');
    });

    return () => unsubscribe();
  }, [outletId]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQty >= product.qty) return prev;
        return prev.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const maxQty = product ? product.qty : 0;
        const newQty = Math.min(maxQty, Math.max(0, item.cartQty + delta));
        return { ...item, cartQty: newQty };
      }
      return item;
    }).filter(item => item.cartQty > 0));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !outletId) return;
    setCheckoutStatus('loading');
    
    const batch = writeBatch(db);
    
    try {
      // 1. Create Sale Header
      const saleRef = await addDoc(collection(db, 'sales'), {
        invoice: `INV-${Date.now()}`,
        outletId,
        total,
        paymentMethod: 'CASH',
        status: 'completed',
        createdAt: serverTimestamp()
      });

      // 2. Update Stocks and Create Sale Items (if we had subcollection, for now keep simple)
      for (const item of cart) {
        const stockRef = doc(db, 'stocks', `${item.id}-${outletId}`);
        const stockDoc = await getDoc(stockRef);
        if (stockDoc.exists()) {
          const currentQty = stockDoc.data().qty;
          batch.update(stockRef, { qty: currentQty - item.cartQty });
        }
      }

      await batch.commit();
      
      setCheckoutStatus('success');
      setTimeout(() => {
        setCart([]);
        setCheckoutStatus('idle');
      }, 1500);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sales/stocks');
      setCheckoutStatus('idle');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-8 h-[calc(100vh-140px)]">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search items by SKU or Name..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.qty <= 0}
                className={cn(
                  "flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl text-left transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98] group relative",
                  product.qty <= 0 && "opacity-50 grayscale pointer-events-none"
                )}
              >
                <div className="w-full aspect-square bg-slate-50 rounded-lg mb-4 flex items-center justify-center text-slate-300">
                  <Package className="w-8 h-8" />
                </div>
                <div className="w-full">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{product.category_name}</span>
                    <span className="text-[10px] font-bold text-slate-400">Qty: {product.qty}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 truncate mb-1 text-sm">{product.name}</h4>
                  <p className="text-slate-900 font-black text-sm">{formatCurrency(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden self-start sticky top-0 h-full">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Active Cart</h3>
          </div>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 border border-slate-200">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
               <ShoppingCart className="w-10 h-10 text-slate-200" />
               <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Cart Empty</p>
             </div>
          ) : (
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-tight">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
                    <button onClick={() => updateQty(item.id, -1)} className="hover:text-blue-600"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-bold text-slate-900 min-w-[18px] text-center">{item.cartQty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="hover:text-blue-600"><Plus className="w-3 h-3" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Gross Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
              <span className="text-slate-500">TOTAL</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutStatus !== 'idle'}
            className={cn(
              "w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-xs uppercase tracking-widest",
              checkoutStatus === 'success' 
                ? "bg-green-500 text-white" 
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:grayscale"
            )}
          >
            {checkoutStatus === 'loading' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : checkoutStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Success</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Execute Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
