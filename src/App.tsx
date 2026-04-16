import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, MessageCircle, ArrowRight, Loader2, Play, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const PROFILES = {
    USER: { id: "5581999801544@s.whatsapp.net", name: "Uiltenberg" },
    SPOUSE: { id: "558187889151@s.whatsapp.net", name: "Erika" } // Exemplo de ID
  };

  const [activeProfile, setActiveProfile] = useState(PROFILES.USER);
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const whatsappUrl = `https://wa.me/${activeProfile.id.split('@')[0]}?text=Olá! Estou pronto para minha prática de hoje.`;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: journeyData } = await supabase
        .from('healing_journeys')
        .select('*')
        .eq('session_id', activeProfile.id)
        .eq('status', 'active')
        .single();
      
      if (journeyData) setJourney(journeyData);
      else setJourney(null);

      const { data: logsData } = await supabase
        .from('emotions_log')
        .select('*')
        .eq('session_id', activeProfile.id)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (logsData) setLogs(logsData || []);
      setLoading(false);
    }
    fetchData();
  }, [activeProfile]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Sparkles className="text-green-700 animate-pulse" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto pb-20 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -30, 0], 
              rotate: [0, 10, 0],
              opacity: [0.05, 0.15, 0.05] 
            }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-green-200 rounded-full blur-[100px]"
            style={{ 
              width: 200 + i * 50, 
              height: 200 + i * 50, 
              left: `${(i * 30) % 100}%`, 
              top: `${(i * 20) % 100}%` 
            }}
          />
        ))}
      </div>

      <header className="relative z-10 text-center mt-12 mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-3 py-1 rounded-full bg-green-100 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-green-800"
        >
          Sua Mentoria Louise Hay
        </motion.div>
        
        {/* Profile Switcher */}
        <div className="flex justify-center gap-2 mb-6">
          {Object.values(PROFILES).map((profile) => (
            <button
              key={profile.id}
              onClick={() => setActiveProfile(profile)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border-none cursor-pointer ${
                activeProfile.id === profile.id 
                  ? "bg-green-700 text-white shadow-lg" 
                  : "bg-white/50 text-slate-400 hover:bg-white/80"
              }`}
            >
              {profile.name}
            </button>
          ))}
        </div>

        <h1 className="text-6xl font-serif text-slate-800 leading-tight tracking-tight px-4">
          {journey?.theme || 'Caminho de Luz'}
        </h1>
      </header>

      {/* Progress Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-10 mb-8 text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-100"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="364.4"
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * (journey?.current_day || 0)) / 21 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-green-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-serif text-slate-800">{journey?.current_day || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dia</span>
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-600">Jornada de Transformação</div>
        <div className="text-[10px] tracking-widest text-slate-400 uppercase mt-1">21 Dias de Libertação</div>
      </motion.div>

      {/* Affirmation Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-8"
      >
        <div className="affirmation-card p-12 rounded-[48px] relative overflow-hidden group">
          <Wind className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000" size={200} />
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-amber-400" size={24} />
            <span className="text-xs font-bold tracking-widest opacity-60 uppercase">Afirmação de Poder</span>
          </div>
          <p className="text-3xl font-serif italic leading-snug mb-10">
            "{journey?.affirmation || 'Estou em paz com o processo da vida.'}"
          </p>
          <button 
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="w-full flex items-center justify-center gap-3 bg-white text-green-950 px-8 py-5 rounded-2xl font-bold hover:bg-green-50 transition-all shadow-xl active:scale-[0.98] border-none cursor-pointer"
          >
            Sintonizar no WhatsApp <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Mentor's Insight (NEW) */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 mb-12 px-2"
      >
        <div className="flex items-center gap-2 mb-6">
          <Wind className="text-green-600" size={18} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Sua Mentora Louise Diz</h3>
        </div>
        <div className="glass-panel p-8 border-l-4 border-l-green-600">
          <p className="text-slate-700 leading-relaxed italic">
            "Sempre que diz 'não sei o que fazer', está fechando a porta para a sua própria sabedoria. Diga antes: 'Estou aberto a novas formas de ver esta situação'."
          </p>
        </div>
      </motion.section>

      {/* Healing Moments */}
      <section className="relative z-10 px-2 pb-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-400" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Momentos de Cura</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{logs.length} registros</span>
        </div>
        
        <div className="space-y-4">
          {logs.length > 0 ? logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase letter-spacing-1">
                  {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <div className="w-2 h-2 rounded-full bg-green-400 opacity-50" />
              </div>
              <p className="text-slate-600 text-lg leading-snug line-clamp-2">
                "{log.user_message}"
              </p>
            </motion.div>
          )) : (
            <div className="text-center py-10 opacity-30 italic">Nenhum registro ainda...</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
