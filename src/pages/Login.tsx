import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { seedDemoData } from '../lib/seed';

export default function Login() {
  const [email, setEmail] = useState('admin@mail.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      await seedDemoData();
      setError('Seed complete! You can now login.');
    } catch (err) {
      setError('Seed failed. Check console.');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check connection.');
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        {/* Left: Branding */}
        <div className="hidden md:flex md:w-5/12 bg-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">E</div>
               <h1 className="text-xl font-black tracking-tight italic">ERP POS v2</h1>
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-6">
              Empowering <br />
              <span className="text-blue-400 uppercase tracking-widest text-sm font-black">Modern Retail</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Multi-outlet Ready</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Enterprise Inventory</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-slate-500 text-[10px] uppercase font-bold tracking-widest pt-10 border-t border-slate-800">
             © 2024 Prof-Polish Systems
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-7/12 p-10 md:p-14">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-1">System Authentication</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise Access Required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm"
                  placeholder="name@enterprise.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Access Password</label>
                 <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tighter">Emergency Recovery</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] rounded-lg font-bold uppercase tracking-tight"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Initialize Session</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Secured by AES-256 Protocol
          </p>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleSeed}
              disabled={seedLoading}
              className="text-[9px] text-slate-400 hover:text-blue-500 font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {seedLoading ? 'Initializing...' : 'Initialize Demo Database'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
