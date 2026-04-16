import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, MessageCircle, ArrowRight, Loader2, Play, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('libertacao_user_id'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('libertacao_user_name'));
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [showIdent, setShowIdent] = useState(false);
  const [tempId, setTempId] = useState('');
  const [tempName, setTempName] = useState('');

  const whatsappUrl = userId ? `https://wa.me/${userId.split('@')[0]}?text=Olá ${userName || ''}! Estou pronto para minha prática de hoje.` : '';

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const { data: journeyData } = await supabase
        .from('healing_journeys')
        .select('*')
        .eq('session_id', userId)
        .eq('status', 'active')
        .single();
      
      if (journeyData) setJourney(journeyData);
      else setJourney(null);

      const { data: logsData } = await supabase
        .from('emotions_log')
        .select('*')
        .eq('session_id', userId)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (logsData) setLogs(logsData || []);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  const handleIdentify = (id: string, name: string) => {
    const formattedId = id.includes('@') ? id : `${id.replace(/\D/g, '')}@s.whatsapp.net`;
    localStorage.setItem('libertacao_user_id', formattedId);
    localStorage.setItem('libertacao_user_name', name);
    setUserId(formattedId);
    setUserName(name);
  };

  const startJourney = async (diagnostic: any) => {
    if (!userId) return;
    setLoading(true);
    const theme = diagnostic.area === 'health' ? 'Cura do Corpo' : 
                  diagnostic.area === 'money' ? 'Prosperidade Infinita' : 
                  diagnostic.area === 'relationships' ? 'Harmonia e Amor' : 'Propósito de Vida';
    
    const affirmation = `Eu libero o padrão de ${diagnostic.pattern} e abro meu coração para a ${theme.toLowerCase()}.`;

    const { data } = await supabase
      .from('healing_journeys')
      .insert({
        session_id: userId,
        theme: theme,
        affirmation: affirmation,
        current_day: 1,
        max_days: 21,
        status: 'active'
      })
      .select()
      .single();

    if (data) {
      await supabase.from('emotions_log').insert({
        session_id: userId,
        user_message: `Diagnóstico Inicial (${userName}): Área: ${diagnostic.area}, Padrão: ${diagnostic.pattern}. Nota: ${diagnostic.notes}`,
        emotion_tag: 'initial_diagnostic'
      });
      setJourney(data);
    }
    setLoading(false);
  };

  const resetJourney = async () => {
    if (!userId || !confirm("Deseja realmente reiniciar sua jornada? Os dados atuais serão arquivados.")) return;
    setLoading(true);
    await supabase
      .from('healing_journeys')
      .update({ status: 'completed' })
      .eq('session_id', userId)
      .eq('status', 'active');
    
    setJourney(null);
    setLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    setUserId(null);
    setUserName(null);
    setJourney(null);
    setShowIdent(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Sparkles className="text-green-800 animate-spin mb-4" size={40} />
        <p className="text-xs font-bold tracking-widest text-slate-300 uppercase">Sintonizando...</p>
      </div>
    </div>
  );

  // Phase 1: Landing / Welcome
  if (!userId && !showIdent) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col justify-center items-center p-8 max-w-lg mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-6">
            <Wind className="text-green-800" size={32} />
          </div>
          <h1 className="text-5xl font-serif text-slate-900 leading-[1.1]">
            Transforme sua <span className="text-gradient">Vida</span> em 21 Dias
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Um guia interativo baseado na filosofia de <span className="font-bold text-slate-700">Louise Hay</span> para superar traumas e libertar seu potencial.
          </p>
          <div className="pt-8">
            <button 
              onClick={() => setShowIdent(true)}
              className="btn-primary w-full max-w-xs"
            >
              Começar minha jornada
            </button>
          </div>
          <div className="flex justify-center gap-8 mt-12 opacity-40 grayscale">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest mb-1">React</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest mb-1">Supabase</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest mb-1">AI Mentor</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Phase 2: Identification
  if (!userId && showIdent) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col justify-center items-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-serif text-slate-800 mb-2">Quem está aqui?</h2>
            <p className="text-slate-400">Identifique-se para salvar seu progresso no banco de dados.</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Como quer ser chamado?</label>
              <input 
                type="text"
                placeholder="Seu Nome"
                className="input-zen"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Seu WhatsApp</label>
              <input 
                type="text"
                placeholder="558199999999"
                className="input-zen"
                value={tempId}
                onChange={(e) => setTempId(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleIdentify(tempId, tempName)}
              disabled={!tempId || !tempName}
              className="btn-primary w-full mt-4"
            >
              Confirmar e Entrar
            </button>
            <button onClick={() => setShowIdent(false)} className="w-full text-xs text-slate-400 font-bold uppercase py-4 border-none bg-none cursor-pointer">
              Voltar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Phase 3: Diagnostic Onboarding
  if (!journey) {
    return <Onboarding onComplete={startJourney} profileName={userName || 'você'} onBack={logout} />;
  }

  // Phase 4: Active Dashboard
  return (
    <div className="min-h-screen bg-[#fafaf8] p-6 max-w-lg mx-auto pb-20 relative overflow-hidden">
      <header className="relative z-10 flex justify-between items-center mt-8 mb-12">
        <div>
          <p className="section-label mb-1">Bem-vindo(a),</p>
          <h2 className="text-2xl font-serif text-slate-800">{userName}</h2>
        </div>
        <button onClick={logout} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 transition-colors">
          <Wind size={20} />
        </button>
      </header>

      {/* Main Journey Progress */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-10 mb-8 relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="74" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
              <motion.circle
                cx="80"
                cy="80"
                r="74"
                stroke="var(--zen-sage)"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="465"
                initial={{ strokeDashoffset: 465 }}
                animate={{ strokeDashoffset: 465 - (465 * (journey?.current_day || 0)) / 21 }}
                transition={{ duration: 2, ease: "circOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-serif text-slate-900">{journey?.current_day || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dia</span>
            </div>
          </div>
          <h3 className="text-xl font-serif text-slate-800 mb-1">{journey?.theme}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua Jornada de 21 Dias</p>
        </div>
      </motion.div>

      {/* Power Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="affirmation-card p-12 rounded-[48px] relative overflow-hidden mb-12"
      >
        <Sparkles className="absolute -right-8 -top-8 text-white/5 opacity-20" size={160} />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300/60 mb-6">Afirmação Diária</p>
        <p className="text-3xl font-serif italic leading-tight mb-10">
          "{journey?.affirmation}"
        </p>
        <button 
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full py-5 rounded-2xl bg-white text-green-950 font-bold hover:bg-green-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border-none cursor-pointer"
        >
          Praticar no WhatsApp <ArrowRight size={18} />
        </button>
      </motion.div>

      {/* Insights Section */}
      <section className="relative z-10 mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Wind className="text-green-800" size={18} />
          <h3 className="section-label">A Mentora Louise Diz</h3>
        </div>
        <div className="glass-panel p-8 border-l-4 border-l-green-800">
          <p className="text-slate-600 italic leading-relaxed">
            {diagnosticInsight(journey?.theme)}
          </p>
        </div>
      </section>

      {/* Logs Section */}
      <section className="relative z-10 pb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-400" size={18} />
            <h3 className="section-label">Histórico de Cura</h3>
          </div>
          <button 
            onClick={resetJourney}
            className="text-[10px] font-bold uppercase text-slate-300 hover:text-rose-500 transition-colors border-none bg-none cursor-pointer"
          >
            Recomeçar Jornada
          </button>
        </div>

        <div className="space-y-6">
          {logs.length > 0 ? logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex justify-between mb-4">
                <span className="text-[9px] font-bold text-slate-300 uppercase">
                  {new Date(log.created_at).toLocaleDateString()} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm italic">"{log.user_message.substring(0, 100)}..."</p>
                {log.ai_response && (
                  <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                    <p className="text-[9px] font-bold uppercase text-green-700 mb-1">Mentora</p>
                    <p className="text-green-900 text-sm leading-relaxed">{log.ai_response}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-20 opacity-20 italic">Aguardando sua primeira prática...</div>
          )}
        </div>
      </section>
    </div>
  );
}

// Subcomponents helper
function Onboarding({ onComplete, profileName, onBack }: { onComplete: (data: any) => void, profileName: string, onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [diagnostic, setDiagnostic] = useState({ area: '', pattern: '', notes: '' });

  const steps = [
    {
      title: "Vamos escolher seu caminho",
      subtitle: "Qual área da sua vida apresenta o maior desafio agora?",
      options: [
        { id: 'health', label: 'Saúde Física', icon: Heart },
        { id: 'money', label: 'Prosperidade', icon: Sparkles },
        { id: 'relationships', label: 'Relações', icon: MessageCircle },
        { id: 'self', label: 'Autoestima', icon: Wind }
      ],
      field: 'area'
    },
    {
      title: "A Raiz do Problema",
      subtitle: "Baseado na teoria de Louise Hay, qual desses padrões você sente que te trava?",
      options: [
        { id: 'criticismo', label: 'Criticismo', icon: Wind },
        { id: 'culpa', label: 'Culpa', icon: Heart },
        { id: 'ressentimento', label: 'Ressentimento', icon: MessageCircle },
        { id: 'medo', label: 'Medo', icon: Sparkles }
      ],
      field: 'pattern'
    },
    {
      title: "Seu Desabafo",
      subtitle: "Em uma frase, o que você quer soltar hoje?",
      field: 'notes'
    }
  ];

  const currentStep = steps[step - 1];
  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else onComplete(diagnostic);
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center max-w-lg mx-auto overflow-hidden">
      <div className="mb-12 flex justify-between items-center">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>
        <button onClick={onBack} className="text-[10px] font-bold uppercase text-slate-300 hover:text-slate-500 border-none bg-none cursor-pointer">Voltar</button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="step-container"
        >
          <h2 className="text-4xl font-serif text-slate-900 mb-2">{currentStep.title}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed italic">"{currentStep.subtitle}"</p>

          {currentStep.options ? (
            <div className="grid gap-3">
              {currentStep.options.map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => setDiagnostic({ ...diagnostic, [currentStep.field]: opt.id })}
                  className={`option-btn flex items-center gap-4 ${diagnostic[currentStep.field as keyof typeof diagnostic] === opt.id ? 'selected shadow-md' : 'opacity-60'}`}
                >
                  <opt.icon size={20} className={diagnostic[currentStep.field as keyof typeof diagnostic] === opt.id ? 'text-green-800' : 'text-slate-300'} />
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="input-zen h-40 resize-none"
              placeholder="Escreva com o coração..."
              value={diagnostic.notes}
              onChange={(e) => setDiagnostic({ ...diagnostic, notes: e.target.value })}
            />
          )}

          <button
            disabled={step < 3 && !diagnostic[currentStep.field as keyof typeof diagnostic]}
            onClick={handleNext}
            className="btn-primary w-full mt-10 disabled:opacity-20"
          >
            {step === 3 ? 'Começar Jornada' : 'Próximo'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function diagnosticInsight(theme: string) {
  const insights: any = {
    'Cura do Corpo': '"Eu aceito uma saúde perfeita agora. Eu libero a necessidade de ficar doente."',
    'Prosperidade Infinita': '"A lei da abundância supre todas as minhas necessidades. Eu sou um imã para o bem."',
    'Harmonia e Amor': '"Todos os meus relacionamentos são harmoniosos. Eu me amo e me aceito."',
    'Propósito de Vida': '"Eu sou divinamente guiado em todos os momentos. Minha vida flui com facilidade."'
  };
  return insights[theme] || '"Cada pensamento meu está criando o meu futuro. Eu escolho pensamentos de alegria."';
}

export default App;
