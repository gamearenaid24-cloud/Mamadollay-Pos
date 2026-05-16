/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import POS from './pages/POS';
import Products from './pages/Products';
import Outlets from './pages/Outlets';
import { motion, AnimatePresence } from 'motion/react';

function Navigation() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Polishing Interface...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'products': return <Products />;
      case 'outlets': return <Outlets />;
      case 'orders': 
        return (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <span className="text-xl">📜</span>
             </div>
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Transaction Records</h3>
             <p className="text-slate-500 text-xs mt-2 max-w-sm">Historical ledger access is being synchronized. All sales are currently saved to the secure cloud.</p>
          </div>
        );
      case 'customers':
        return (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <span className="text-xl">👥</span>
             </div>
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Customer Directory</h3>
             <p className="text-slate-500 text-xs mt-2 max-w-sm">CRM module integration pending. Customer profiles are captured individually at the point of sale.</p>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
