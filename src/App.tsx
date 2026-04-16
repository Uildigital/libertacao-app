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

  // CONFIGURAÇÃO DO BOT (Aqui deve ir o número do seu N8n/WhatsApp Business)
  const BOT_NUMBER = "5581999801544"; // ATENÇÃO: Ajuste para o número do seu BOT
  
  const whatsappUrl = `https://wa.me/${BOT_NUMBER}?text=Olá Mentora Louise, aqui é ${userName || 'alguém precisando de luz'}. Estou pronto para minha libertação de hoje. Minha jornada atual é: ${journey?.theme || 'Geral'}.`;

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

  const handleIdentify = async (id: string, name: string) => {
    // Normaliza o número: remove tudo que não é dígito
    let cleanId = id.replace(/\D/g, '');
    
    // Se digitou 11 dígitos (DDD + número), assume Brasil e coloca 55
    if (cleanId.length === 11) {
      cleanId = '55' + cleanId;
    }
    
    const formattedId = `${cleanId}@s.whatsapp.net`;
    
    // 1. Salva no navegador
    localStorage.setItem('libertacao_user_id', formattedId);
    localStorage.setItem('libertacao_user_name', name);
    
    // 2. Notifica o Banco de Dados IMEDIATAMENTE (Gatilho para o N8n)
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
      // Log do diagnóstico que a Mentora vai ler
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
        <Wind className="text-green-800 animate-pulse mb-4" size={40} />
        <p className="text-xs font-bold tracking-widest text-slate-300 uppercase">Acolhendo sua presença...</p>
      </div>
    </div>
  );

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#fafaf8] p-8 flex flex-col justify-center items-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-12 text-center">
          <div className="inline-flex p-5 bg-white rounded-full shadow-sm">
            <Heart className="text-rose-500" size={32} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-serif text-slate-900">Seu Espaço de <span className="text-gradient">Libertação</span></h1>
            <p className="text-slate-500 leading-relaxed px-6 italic">
              "A jornada de mil milhas começa com um único passo de amor próprio."
            </p>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-green-900/5 space-y-8 text-left border border-slate-100">
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
          
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            Baseado na filosofia de Louise Hay
          </p>
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
    <div className="min-h-screen p-6 max-w-lg mx-auto pb-24 relative overflow-hidden">
      {/* Ritual Header */}
      <header className="relative z-10 flex justify-between items-end mt-12 mb-10 pt-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="section-label mb-2">Portal de Libertação</p>
          <h1 className="text-4xl font-serif text-slate-800">Caminho de {userName?.split(' ')[0]}</h1>
        </motion.div>
        <button onClick={logout} className="p-4 bg-white/40 backdrop-blur-xl rounded-full text-slate-400 hover:text-rose-600 transition-all border border-white/20">
          <Wind size={20} />
        </button>
      </header>

      {/* The Journey Map (Complex Visualization) */}
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
              <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Sua Evolução</span>
              <span className="text-[10px] font-bold text-slate-400">{( (journey?.current_day || 0) / 21 * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${( (journey?.current_day || 0) / 21 * 100)}%` }}
                className="h-full bg-gradient-to-r from-green-800 to-green-500" 
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-green-50/30 rounded-2xl border border-green-100/50">
          <Sparkles className="text-green-800" size={16} />
          <p className="text-xs font-medium text-green-900">Tema Ativo: <span className="font-bold underline decoration-green-800/30">{journey?.theme}</span></p>
        </div>
      </motion.div>

      {/* The Insight Engine Card (Deep Assistance) */}
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
          Note que sua dificuldade com <span className="text-green-900 font-bold">{journey?.theme.toLowerCase()}</span> é apenas um sinal de que você está pronto para soltar o passado.
        </p>
        <div className="p-4 bg-white/60 rounded-xl italic text-xs text-slate-500 border border-white/40">
          "Para mudar sua vida, você deve mudar seus pensamentos hoje." — Louise
        </div>
      </motion.section>

      {/* Affirmation Totem */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative mb-12 group"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 rounded-[48px]" />
        <img 
          src="/zen_healing_presence_1776372032791.png" 
          className="w-full h-80 object-cover rounded-[48px] shadow-2xl" 
          alt="Presence"
        />
        <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Mantra de Poder do Dia {journey?.current_day}
          </p>
          <p className="power-affirmation mb-8">
            "{journey?.affirmation}"
          </p>
          <button 
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="w-full py-5 rounded-2xl bg-white text-slate-900 font-bold hover:scale-[1.02] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 border-none cursor-pointer group-hover:bg-green-50"
          >
            Praticar no WhatsApp <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* Journaling Timeline (The Healing Moments) */}
      <section className="relative z-10 px-2 pb-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="section-label">Diário de Libertação</h3>
          <button onClick={resetJourney} className="text-[9px] font-bold uppercase text-slate-400 hover:text-rose-600 border-none bg-none cursor-pointer">
            Arquivar Jornada
          </button>
        </div>

        <div className="space-y-12 before:absolute before:left-10 before:top-24 before:bottom-20 before:w-px before:bg-slate-200/50">
          {logs.length > 0 ? logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="relative pl-14"
            >
              <div className="absolute left-8 top-0 w-4 h-4 rounded-full bg-white border-4 border-green-800 shadow-sm z-10" />
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(log.created_at).toLocaleDateString()} às {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="chat-bubble-user text-sm text-slate-600 italic">
                  "{log.user_message}"
                </div>
                {log.ai_response && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="chat-bubble-mentor text-sm leading-relaxed"
                  >
                    <p className="font-bold text-[10px] uppercase mb-2">Mentora Louise</p>
                    {log.ai_response}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-20 opacity-20 italic font-serif text-lg">Sua história começa aqui...</div>
          )}
        </div>
      </section>
    </div>
  );
}

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
    <div className="min-h-screen bg-white/80 backdrop-blur-3xl p-8 flex flex-col justify-center max-w-lg mx-auto overflow-hidden">
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
