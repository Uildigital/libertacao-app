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
  const [tempId, setTempId] = useState('');
  const [tempName, setTempName] = useState('');

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
        .order('created_at', { ascending: true });
      
      if (logsData) setLogs(logsData || []);
      setLoading(false);
    }
    fetchData();

    // Inscrição em Tempo Real para respostas da IA
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emotions_log', filter: `session_id=eq.${userId}` },
        () => {
          fetchData(); // Recarrega os logs quando houver mudança no banco
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleIdentify = async (id: string, name: string) => {
    let cleanId = id.replace(/\D/g, '');
    if (cleanId.length === 11) cleanId = '55' + cleanId;
    const formattedId = `${cleanId}@s.whatsapp.net`;
    
    localStorage.setItem('libertacao_user_id', formattedId);
    localStorage.setItem('libertacao_user_name', name);
    
    await supabase.from('emotions_log').insert({
      session_id: formattedId,
      user_message: `NOVO ACESSO: ${name} acabou de se cadastrar no app e aguarda boas-vindas.`,
      emotion_tag: 'new_registration'
    });

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
        user_message: `SOLICITAÇÃO DE AJUDA (${userName}): "Sinto que minha dor está em ${theme}. O padrão que me trava é ${diagnostic.pattern}. Minha queixa: ${diagnostic.notes}"`,
        emotion_tag: 'diagnostic'
      });
      setJourney(data);
    }
    setLoading(false);
  };

  const resetJourney = async () => {
    if (!userId || !confirm("Deseja realmente iniciar um novo ciclo? Sua jornada atual será arquivada.")) return;
    setLoading(true);
    await supabase
      .from('healing_journeys')
      .update({ status: 'completed' })
      .eq('session_id', userId)
      .eq('status', 'active');
    
    setJourney(null);
    setLoading(false);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !userId) return;
    await supabase.from('emotions_log').insert({
      session_id: userId,
      user_message: message,
      emotion_tag: 'chat_interaction'
    });
  };

  const logout = () => {
    localStorage.clear();
    setUserId(null);
    setUserName(null);
    setJourney(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Wind className="text-green-800 animate-pulse mb-4" size={40} />
        <p className="text-xs font-bold tracking-widest text-slate-300 uppercase">Acolhendo sua presença...</p>
      </div>
    </div>
  );

  if (!userId) {
    return (
      <div className="min-h-screen bg-transparent p-8 flex flex-col justify-center items-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-12 text-center">
          <div className="inline-flex p-5 bg-white/80 backdrop-blur-xl rounded-full shadow-sm">
            <Heart className="text-rose-500" size={32} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-serif text-slate-900">Seu Espaço de <span className="text-gradient">Libertação</span></h1>
            <p className="text-slate-500 leading-relaxed px-6 italic">
              "A jornada de mil milhas começa com um único passo de amor próprio."
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-xl shadow-green-900/5 space-y-8 text-left border border-white/20">
            <div className="space-y-2">
              <label className="section-label">Como podemos te chamar?</label>
              <input 
                type="text" 
                placeholder="Seu nome" 
                className="input-zen" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="section-label">Seu WhatsApp (com DDD)</label>
              <input 
                type="text" 
                placeholder="Ex: 81 99999-9999" 
                className="input-zen" 
                value={tempId} 
                onChange={(e) => setTempId(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => handleIdentify(tempId, tempName)} 
              disabled={!tempId || !tempName} 
              className="btn-primary w-full py-6 text-base"
            >
              Começar minha cura agora
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Filosofia de Louise Hay
          </p>
        </motion.div>
      </div>
    );
  }

  if (!journey) {
    return <Onboarding onComplete={startJourney} profileName={userName || 'você'} onBack={logout} />;
  }

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto pb-24 relative overflow-hidden">
      <header className="relative z-10 flex justify-between items-end mt-12 mb-10 pt-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="section-label mb-2">Portal de Libertação</p>
          <h1 className="text-4xl font-serif text-slate-800">Caminho de {userName?.split(' ')[0]}</h1>
        </motion.div>
        <button onClick={logout} className="p-4 bg-white/40 backdrop-blur-xl rounded-full text-slate-400 hover:text-rose-600 transition-all border border-white/20">
          <Wind size={20} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 mb-8 relative z-10 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-10">
          <div className="day-badge">
            <span className="text-3xl font-serif text-slate-900">{journey?.current_day || 0}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">de 21 dias</span>
          </div>
          <div className="flex-1 ml-8 space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Evolução</span>
              <span className="text-[10px] font-bold text-slate-400">{Math.round((journey?.current_day / 21) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(journey?.current_day / 21) * 100}%` }}
                className="h-full bg-gradient-to-r from-green-800 to-green-500" 
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-green-50/30 rounded-2xl border border-green-100/50">
          <Sparkles className="text-green-800" size={16} />
          <p className="text-xs font-medium text-green-900">Foco: <span className="font-bold underline decoration-green-800/30">{journey?.theme}</span></p>
        </div>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="insight-card mb-8 relative z-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span className="section-label !text-slate-800 !opacity-100">Visão da Mentora</span>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          {userName}, seu coração está vibrando na frequência do perdão hoje. 
          Note que sua dificuldade com <span className="text-green-900 font-bold">{journey?.theme.toLowerCase()}</span> é um portal para soltar o passado.
        </p>
      </motion.section>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative mb-12"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 rounded-[48px]" />
        <img 
          src="/zen_healing_presence_1776372032791.png" 
          className="w-full h-80 object-cover rounded-[48px] shadow-2xl" 
          alt="Presence"
        />
        <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Mantra de Poder de Hoje
          </p>
          <p className="power-affirmation text-2xl">
            "{journey?.affirmation}"
          </p>
        </div>
      </motion.div>

      <section className="relative z-10 px-2 pb-40">
        <div className="flex justify-between items-center mb-8">
          <h3 className="section-label">Diálogo de Cura</h3>
          <button onClick={resetJourney} className="text-[9px] font-bold uppercase text-slate-400 hover:text-rose-600 border-none bg-none cursor-pointer">
            Arquivar
          </button>
        </div>

        <div className="space-y-8">
          {logs.filter(l => l.emotion_tag !== 'diagnostic' && l.emotion_tag !== 'new_registration').map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${log.ai_response ? 'items-start' : 'items-end'}`}
            >
              <div className={`max-w-[85%] ${log.ai_response ? 'chat-bubble-mentor' : 'chat-bubble-user'}`}>
                <p className="text-sm leading-relaxed">{log.user_message}</p>
              </div>
              {log.ai_response && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="chat-bubble-mentor mt-4 border border-green-200"
                >
                  <p className="font-bold text-[9px] uppercase mb-2">Mentora Louise</p>
                  <p className="text-sm">{log.ai_response}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
          {logs.length === 0 && <div className="text-center py-20 opacity-20 italic">Sua história começa aqui...</div>}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-30 backdrop-blur-sm">
        <div className="max-w-lg mx-auto relative px-2">
          <input 
            type="text" 
            placeholder="Como você se sente agora?"
            className="input-zen !rounded-full !py-6 !pl-8 !pr-20 shadow-2xl border-none ring-1 ring-slate-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
          <button 
            className="absolute right-5 top-2 bottom-2 aspect-square bg-green-800 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-90 border-none cursor-pointer"
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
              sendMessage(input.value);
              input.value = '';
            }}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Onboarding({ onComplete, profileName, onBack }: { onComplete: (data: any) => void, profileName: string, onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [diagnostic, setDiagnostic] = useState({ area: '', pattern: '', notes: '' });

  const steps = [
    {
      title: "Caminhos",
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
      title: "A Raiz",
      subtitle: "Qual desses padrões você sente que te trava?",
      options: [
        { id: 'criticismo', label: 'Criticismo', icon: Wind },
        { id: 'culpa', label: 'Culpa', icon: Heart },
        { id: 'ressentimento', label: 'Ressentimento', icon: MessageCircle },
        { id: 'medo', label: 'Medo', icon: Sparkles }
      ],
      field: 'pattern'
    },
    {
      title: "Desabafo",
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
    <div className="min-h-screen bg-transparent p-8 flex flex-col justify-center max-w-lg mx-auto overflow-hidden">
      <div className="mb-12 flex justify-between items-center">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>
        <button onClick={onBack} className="text-[10px] font-bold uppercase text-slate-300 hover:text-slate-500 border-none bg-none cursor-pointer">Sair</button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="step-container glass-panel p-10"
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
              className="input-zen h-40 resize-none bg-white/50"
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

export default App;
