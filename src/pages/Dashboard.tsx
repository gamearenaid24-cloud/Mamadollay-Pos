import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingBag
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  limit, 
  orderBy 
} from 'firebase/firestore';

export default function Dashboard() {
  const { outletId } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    productCount: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);

  useEffect(() => {
    if (!outletId) return;

    // 1. Listen to Sales for stats
    const salesQuery = query(collection(db, 'sales'), where('outletId', '==', outletId));
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().total || 0;
      });
      setStats(prev => ({ 
        ...prev, 
        totalSales: total, 
        transactionCount: snapshot.size 
      }));
    });

    // 2. Query Recent Sales
    const recentQuery = query(
      collection(db, 'sales'), 
      where('outletId', '==', outletId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribeRecent = onSnapshot(recentQuery, async (snapshot) => {
      const sales: any[] = [];
      const outletDoc = await getDocs(query(collection(db, 'outlets')));
      const outletMap = new Map();
      outletDoc.forEach(d => outletMap.set(d.id, d.data().name));
      
      snapshot.forEach(doc => {
        const data = doc.data();
        sales.push({
          inv: data.invoice,
          outlet: outletMap.get(data.outletId) || 'Unknown',
          amount: data.total,
          status: data.status?.toUpperCase() || 'PAID'
        });
      });
      setRecentSales(sales);
    });

    // 3. Product count
    getDocs(collection(db, 'products')).then(snap => {
      setStats(prev => ({ ...prev, productCount: snap.size }));
    });

    // 4. Outlets for chart
    onSnapshot(collection(db, 'outlets'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, name: d.data().name }));
      setOutlets(list);
    });

    return () => {
      unsubscribeSales();
      unsubscribeRecent();
    };
  }, [outletId]);

  const cards = [
    { title: 'Total Revenue (MTD)', value: formatCurrency(stats.totalSales), icon: TrendingUp, color: 'text-blue-600', trend: '+12.5% vs Last Month', alert: false },
    { title: 'Active Transactions', value: stats.transactionCount, icon: ShoppingBag, color: 'text-slate-600', trend: 'Live Sync Active', alert: false },
    { title: 'Total Products', value: stats.productCount, icon: Package, color: 'text-slate-600', trend: 'Updated Real-time', alert: false },
    { title: 'Inventory Alerts', value: '42 Items', icon: Users, color: 'text-red-600', trend: 'Critical restock required', alert: true },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={card.title}
            className={cn(
              "bg-white p-5 rounded-xl border border-slate-200 shadow-sm",
              card.alert && "border-l-4 border-l-red-500"
            )}
          >
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{card.title}</div>
            <div className={cn("text-2xl font-bold tracking-tight", card.alert ? "text-red-600" : "text-slate-900")}>
              {card.value}
            </div>
            <div className={cn(
              "text-[10px] font-bold mt-2",
              card.alert ? "text-red-400 italic" : i === 0 ? "text-green-600" : "text-slate-400"
            )}>
              {card.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Recent Sales Activity</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3 text-center">Outlet</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-50">
                {recentSales.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{row.inv}</td>
                    <td className="px-6 py-4 text-center">{row.outlet}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(row.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[9px] font-bold",
                        row.status === 'PAID' || row.status === 'COMPLETED' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight mb-6">Sales by Outlet</h3>
            <div className="flex-1 flex items-end space-x-2 px-2 pb-2">
              {[
                { label: 'JKT', height: '80%', color: 'bg-blue-600' },
                { label: 'BDG', height: '45%', color: 'bg-blue-500' },
                { label: 'SBY', height: '60%', color: 'bg-blue-600' },
                { label: 'MDN', height: '30%', color: 'bg-blue-400' },
                { label: 'DPS', height: '55%', color: 'bg-blue-500' },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: bar.height }}
                    className={`w-full ${bar.color} rounded-t shadow-inner cursor-pointer hover:opacity-80 transition-opacity`}
                  />
                  <span className="text-[9px] mt-2 font-bold text-slate-500">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl text-white shadow-lg">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Sync Status</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Marketplace API</span>
                  <span className="text-[9px] text-green-400 font-bold tracking-tighter">ONLINE</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[100%]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">QRIS Integration</span>
                  <span className="text-[9px] text-green-400 font-bold tracking-tighter">ACTIVE</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[95%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
