import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, MessageCircle, ArrowRight, Loader2, Play, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const userPhone = "5581999801544@s.whatsapp.net";
  const whatsappUrl = "https://wa.me/5581999801544?text=Olá! Estou pronto para minha prática de hoje.";

  useEffect(() => {
    async function fetchData() {
      const { data: journeyData } = await supabase.from('healing_journeys').select('*').eq('session_id', userPhone).eq('status', 'active').single();
      if (journeyData) setJourney(journeyData);
      const { data: logsData } = await supabase.from('emotions_log').select('*').eq('session_id', userPhone).order('created_at', { ascending: false }).limit(4);
      if (logsData) setLogs(logsData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Sparkles className="text-green-700 animate-pulse" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto pb-12 relative overflow-hidden">
      {/* Background Floating Lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 8 + i, repeat: Infinity }}
            className="absolute bg-white rounded-full blur-3xl"
            style={{ width: 120 + i * 30, height: 120 + i * 30, left: `${i * 20}%`, top: `${20 + i * 10}%` }}
          />
        ))}
      </div>

      <header className="relative z-10 text-center mt-8 mb-12">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2 text-green-900">
          Espaço de Libertação
        </motion.p>
        <h1 className="text-5xl font-serif text-slate-800 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {journey?.theme || 'Seu Caminho'}
        </h1>
      </header>

      {/* Main Focus / Day Counter */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="glass-panel p-12 mb-10 text-center relative z-10"
      >
        <div className="pulsing-icon inline-flex p-3 bg-white/50 rounded-full mb-4">
          <Calendar className="text-green-800" size={24} />
        </div>
        <div className="text-6xl font-serif text-green-900 mb-2">Dia {journey?.current_day || 0}</div>
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Jornada de 21 Dias</div>
        
        <div className="mt-8 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((journey?.current_day || 1) / 21) * 100}%` }}
            className="bg-green-700 h-full"
          />
        </div>
      </motion.div>

      {/* The Power Affirmation */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10 mb-12">
        <div className="bg-green-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <Wind className="absolute -right-8 -bottom-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000" size={180} />
          <Sparkles className="text-amber-300 mb-6" size={28} />
          <p className="text-2xl font-serif italic leading-relaxed pr-4 mb-8">
            "{journey?.affirmation || 'Sua afirmação aguarda seu coração.'}"
          </p>
          <button 
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="flex items-center gap-3 bg-white text-green-900 px-6 py-4 rounded-2xl font-bold hover:bg-green-50 transition-colors border-none cursor-pointer"
          >
            Praticar agora <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* Healing Moments (Logs) */}
      <section className="relative z-10 px-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Momentos de Cura</h3>
          <Heart className="text-rose-300" size={16} />
        </div>
        
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/40 backdrop-blur-sm p-5 rounded-3xl mb-3 border border-white/60 shadow-sm"
          >
            <p className="text-[#a5a5a5] text-[10px] font-bold mb-2 uppercase tracking-tighter">
              {new Date(log.created_at).toLocaleDateString()}
            </p>
            <p className="text-slate-700 italic text-lg leading-snug">
              "{log.user_message.substring(0, 80)}..."
            </p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

export default App;
