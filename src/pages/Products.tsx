import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  query, 
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Package, Plus, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Products() {
  const { outletId, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category_id: 'cat-01',
    category_name: 'General Product',
    price: 0,
    cost: 0
  });

  useEffect(() => {
    // Listen to Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const list: Product[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as any));
      setProducts(list);
      setLoading(false);
    });

    // Listen to Stocks for this outlet
    if (!outletId) return;
    const unsubStocks = onSnapshot(
      query(collection(db, 'stocks'), where('outlet_id', '==', outletId)),
      (snap) => {
        const stockMap: Record<string, number> = {};
        snap.forEach(d => {
          const data = d.data();
          stockMap[data.productId] = data.qty;
        });
        setStocks(stockMap);
      }
    );

    return () => {
      unsubProducts();
      unsubStocks();
    };
  }, [outletId]);

  const handleAdjustStock = async (productId: string, currentQty: number) => {
    if (!outletId) return;
    const adjustAmount = window.prompt(`Adjust stock quantity (current: ${currentQty}):`, currentQty.toString());
    
    if (adjustAmount === null || isNaN(parseInt(adjustAmount))) return;
    
    const newQty = parseInt(adjustAmount);
    setUpdating(productId);
    
    try {
      const stockRef = doc(db, 'stocks', `${productId}-${outletId}`);
      await setDoc(stockRef, {
        productId,
        outlet_id: outletId,
        qty: newQty
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `stocks/${productId}-${outletId}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: Number(newProduct.price),
        cost: Number(newProduct.cost),
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewProduct({
        name: '',
        sku: '',
        category_id: 'cat-01',
        category_name: 'General Product',
        price: 0,
        cost: 0
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Inventory & Stock</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Catalog Mgmt</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md"
          >
            + New Item
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden"
            >
              <form onSubmit={handleCreateProduct} className="flex flex-col h-full sm:h-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Catalogue: New Product</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                </div>
                
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500" 
                      placeholder="e.g. Classic White T-Shirt"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SKU Code</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500" 
                        placeholder="SKU-001"
                        value={newProduct.sku}
                        onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        value={newProduct.category_id}
                        onChange={e => setNewProduct({...newProduct, category_id: e.target.value, category_name: e.target.options[e.target.selectedIndex].text})}
                      >
                        <option value="cat-01">General Product</option>
                        <option value="cat-02">Clothing</option>
                        <option value="cat-03">Food & Beverage</option>
                        <option value="cat-04">Electronics</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Unit Cost</label>
                      <input 
                        required
                        type="number" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                        placeholder="0"
                        value={newProduct.cost}
                        onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Retail Price</label>
                      <input 
                        required
                        type="number" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                        placeholder="0"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isSaving}
                    type="submit" 
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    <span>Save Product</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
             <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Search Catalog</div>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <input 
                   type="text" 
                   placeholder="Search SKU/Name..." 
                   className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
               </div>
             </div>

             <div className="pt-4 border-t border-slate-100">
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Legend</div>
               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                    <div className="w-2 h-2 bg-green-500 rounded-full" /> Healthy Stock
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" /> Low Inventory
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase">
                    <div className="w-2 h-2 bg-red-500 rounded-full" /> Out Of Stock
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
           <div className="inline-block min-w-full align-middle">
             <table className="min-w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Product Info</th>
                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">SKU Code</th>
                    <th className="px-4 md:px-6 py-4 text-center">Available Stock</th>
                    <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Unit Price</th>
                    <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-50">
                   {loading ? (
                     <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading catalog...</td></tr>
                   ) : filtered.length === 0 ? (
                     <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No products found</td></tr>
                   ) : filtered.map(p => {
                     const qty = stocks[p.id] || 0;
                     return (
                       <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-4 md:px-6 py-4">
                            <div className="font-bold text-slate-900 whitespace-nowrap">{p.name}</div>
                            <div className="text-[9px] text-blue-600 uppercase font-black whitespace-nowrap tracking-tighter">{p.category_name || 'General Product'}</div>
                         </td>
                         <td className="px-4 md:px-6 py-4 font-mono font-bold text-slate-500">{p.sku}</td>
                         <td className="px-4 md:px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black min-w-[50px] text-center",
                                qty > 10 ? "bg-green-100 text-green-700" : qty > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              )}>
                                {qty}
                              </span>
                              {qty < 5 && qty > 0 && <span className="text-[8px] text-amber-500 font-bold uppercase mt-1">Low Stock</span>}
                              {qty <= 0 && <span className="text-[8px] text-red-500 font-bold uppercase mt-1">Empty</span>}
                            </div>
                         </td>
                         <td className="px-4 md:px-6 py-4 text-right font-black text-slate-900">{formatCurrency(p.price)}</td>
                         <td className="px-4 md:px-6 py-4 text-right">
                            <button 
                              onClick={() => handleAdjustStock(p.id, qty)}
                              disabled={updating === p.id}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                updating === p.id ? "bg-slate-100 text-slate-400" : "hover:bg-blue-50 text-blue-600"
                              )}
                            >
                              {updating === p.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                         </td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
