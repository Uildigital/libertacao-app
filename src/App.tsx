import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const userPhone = "5581999801544@s.whatsapp.net";
  const whatsappUrl = "https://wa.me/5581999801544?text=Olá! Estou pronto para minha prática de hoje.";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // 1. Buscar a jornada ativa
      const { data: journeyData } = await supabase
        .from('healing_journeys')
        .select('*')
        .eq('session_id', userPhone)
        .eq('status', 'active')
        .single();
        
      if (journeyData) setJourney(journeyData);

      // 2. Buscar os logs de emoções
      const { data: logsData } = await supabase
        .from('emotions_log')
        .select('*')
        .eq('session_id', userPhone)
        .order('created_at', { ascending: false })
        .limit(3);

      if (logsData) setLogs(logsData);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9f5]">
        <Loader2 className="animate-spin text-green-700" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto" style={{background: '#f8f9f5'}}>
      <header className="mb-10 mt-4 px-2">
        <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2 opacity-70">Painel de Libertação</h2>
        <h1 className="text-4xl font-serif text-slate-800" style={{ fontFamily: 'Playfair Display, serif' }}>
          {journey ? journey.theme : 'Sua Jornada'}
        </h1>
      </header>

      {/* Card da Jornada Atual */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-8 text-center rounded-[32px] bg-white/70 shadow-xl border border-white"
      >
        <div className="inline-flex items-center justify-center p-4 bg-yellow-50 rounded-full mb-4">
          <Calendar className="text-amber-700" size={32} />
        </div>
        <h3 className="text-2xl font-semibold mb-1 text-slate-800">
          Dia {journey ? journey.current_day : '0'} de 21
        </h3>
        <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-bold">PROCESSO ATIVO</p>
        <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((journey?.current_day || 1) / 21) * 100}%` }}
            className="bg-green-600 h-3 rounded-full"
          ></motion.div>
        </div>
      </motion.div>

      {/* Card da Afirmação */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="p-8 bg-green-50/50 rounded-[32px] mb-8 border-l-[6px] border-green-600 shadow-sm"
      >
        <Sparkles className="text-green-600 mb-4" size={24} />
        <p className="text-2xl italic font-serif leading-relaxed text-slate-700 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
          "{journey ? journey.affirmation : 'Carregando sua afirmação poderosa...'}"
        </p>
        <button 
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-800 active:scale-95 transition-all shadow-lg border-none cursor-pointer"
        >
          Praticar no WhatsApp <ArrowRight size={18} />
        </button>
      </motion.div>

      {/* Histórico Rápido */}
      <div className="mb-4 px-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Últimas Interações</h3>
        {logs.map((log, index) => (
          <div key={index} className="bg-white/40 p-4 rounded-2xl mb-2 text-sm border border-white/50">
            <p className="text-slate-400 text-xs mb-1">{new Date(log.created_at).toLocaleDateString()}</p>
            <p className="text-slate-700 font-medium">"{log.user_message.substring(0, 60)}..."</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
